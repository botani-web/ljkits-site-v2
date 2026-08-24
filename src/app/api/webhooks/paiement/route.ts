import { notifierCommande } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'
import {
  extraireCommandeId,
  extraireIdentPanier,
  extraireTransaction,
  signatureWebhookValide,
  TYPE_LITIGE_GAGNE,
  TYPE_LITIGE_OUVERT,
  TYPE_LITIGE_PERDU,
  TYPE_PAIEMENT_COMPLETE,
  TYPE_PAIEMENT_REFUSE,
  TYPE_PAIEMENT_REMBOURSE,
  TYPE_VALIDATION,
  type WebhookTebex,
} from '@/lib/tebex'

/**
 * Webhook Tebex — c'est lui qui fait avancer une commande.
 *
 * C'est la route la plus sensible du site : quelqu'un qui saurait la
 * déclencher se ferait livrer gratuitement. D'où l'ordre strict ci-dessous —
 * la signature est vérifiée AVANT toute lecture du contenu.
 *
 * Toujours répondre 2XX quand l'évènement a été reçu et compris, même s'il a
 * déjà été traité : un code d'erreur ferait réessayer Tebex indéfiniment.
 */

// Jamais de cache, jamais de pré-rendu : chaque requête doit être exécutée.
export const dynamic = 'force-dynamic'

export async function POST(requete: Request) {
  /* ---- 1. le corps BRUT, avant tout ---- */
  // Impératif : la signature porte sur ces octets exacts. Passer par
  // requete.json() puis re-sérialiser changerait le texte et invaliderait
  // la vérification.
  const corpsBrut = await requete.text()
  const signature = requete.headers.get('x-signature') ?? ''

  if (!signatureWebhookValide(corpsBrut, signature)) {
    console.warn('[webhook] signature invalide, requête rejetée')
    return Response.json({ erreur: 'Signature invalide.' }, { status: 401 })
  }

  /* ---- 2. lecture du contenu ---- */
  let evenement: WebhookTebex
  try {
    evenement = JSON.parse(corpsBrut)
  } catch {
    return Response.json({ erreur: 'Corps illisible.' }, { status: 400 })
  }

  if (!evenement?.id || !evenement?.type) {
    return Response.json({ erreur: 'Évènement incomplet.' }, { status: 400 })
  }

  /* ---- 3. validation de l'endpoint ---- */
  // Tebex envoie ce type au moment où l'on enregistre l'URL dans le tableau
  // de bord. Il attend un 200 contenant exactement l'id reçu.
  if (evenement.type === TYPE_VALIDATION) {
    return Response.json({ id: evenement.id }, { status: 200 })
  }

  /* ---- 4. idempotence ---- */
  // On pose la marque AVANT de traiter. Si l'insertion échoue sur la clé
  // primaire, c'est que l'évènement est déjà passé : on répond 200 sans rien
  // refaire. Une même commande reçoit plusieurs évènements légitimes, c'est
  // bien l'id du webhook — et non la commande — qui sert de clé.
  const commandeId = extraireCommandeId(evenement.subject)

  try {
    await prisma.evenementTebex.create({
      data: { id: evenement.id, type: evenement.type, commandeId },
    })
  } catch {
    console.info(`[webhook] évènement ${evenement.id} déjà traité, ignoré`)
    return Response.json({ recu: true, deja: true }, { status: 200 })
  }

  /* ---- 5. retrouver la commande ---- */
  const commande = await retrouverCommande(evenement)

  if (!commande) {
    // On répond 200 : renvoyer une erreur ferait réessayer Tebex en boucle
    // pour une commande qui n'existera jamais. La trace part dans les logs.
    console.error(
      `[webhook] commande introuvable pour ${evenement.type} (${evenement.id})`,
      JSON.stringify(evenement.subject)?.slice(0, 800),
    )
    return Response.json({ recu: true, commande: null }, { status: 200 })
  }

  /* ---- 6. traitement ---- */
  try {
    switch (evenement.type) {
      case TYPE_PAIEMENT_COMPLETE:
        await marquerPayeeEtLivrer(commande.id, extraireTransaction(evenement.subject))
        // Après la mise à jour, pour que l'e-mail porte le statut LIVREE et
        // l'identifiant de transaction. `notifierCommande` avale ses erreurs :
        // un envoi raté ne fera jamais échouer le webhook.
        await notifierCommande(commande.id, false)
        break

      // Paiement refusé par la banque ou le prestataire. Sans ce cas, la
      // commande resterait EN_ATTENTE indéfiniment — et ce statut compte dans
      // le garde-fou anti-abus : trois refus d'affilée bloqueraient une heure
      // un joueur qui n'y est pour rien.
      case TYPE_PAIEMENT_REFUSE:
        await prisma.commande.update({
          where: { id: commande.id },
          data: { statut: 'ECHOUEE', derniereErreur: 'Paiement refusé par Tebex.' },
        })
        break

      case TYPE_PAIEMENT_REMBOURSE:
      case TYPE_LITIGE_PERDU:
        await marquerRembourseeEtRetirer(commande.id)
        break

      // Litige tranché en notre faveur : le paiement tient, la commande
      // retrouve son statut d'avant la contestation.
      case TYPE_LITIGE_GAGNE:
        await prisma.commande.update({
          where: { id: commande.id },
          data: { statut: 'LIVREE', derniereErreur: null },
        })
        break

      case TYPE_LITIGE_OUVERT:
        // Un litige ouvert ne retire rien : l'arbitrage n'est pas tranché.
        // `livreeAt` reste posé, c'est lui qui dira si la commande avait été
        // livrée avant la contestation.
        await prisma.commande.update({
          where: { id: commande.id },
          data: { statut: 'LITIGE' },
        })
        break

      default:
        console.info(`[webhook] type non géré : ${evenement.type}`)
    }
  } catch (erreur) {
    console.error(`[webhook] échec du traitement de ${evenement.id} :`, erreur)
    await prisma.commande.update({
      where: { id: commande.id },
      data: {
        derniereErreur: `Webhook ${evenement.type} : ${
          erreur instanceof Error ? erreur.message : 'erreur inconnue'
        }`,
      },
    })
    // 500 : là, un réessai de Tebex a du sens — l'évènement était valide,
    // c'est notre traitement qui a échoué.
    return Response.json({ erreur: 'Traitement impossible.' }, { status: 500 })
  }

  return Response.json({ recu: true }, { status: 200 })
}

/* -------------------------------------------------------------------------- */
/* Outils                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Deux voies pour identifier la commande, dans l'ordre de fiabilité :
 * le `custom.commandeId` qu'on a nous-mêmes placé dans le panier, puis
 * l'ident du panier stocké dans `referenceExterne`.
 */
async function retrouverCommande(evenement: WebhookTebex) {
  const commandeId = extraireCommandeId(evenement.subject)
  if (commandeId) {
    const parId = await prisma.commande.findUnique({ where: { id: commandeId } })
    if (parId) return parId
  }

  const identPanier = extraireIdentPanier(evenement.subject)
  if (identPanier) {
    return prisma.commande.findUnique({ where: { referenceExterne: identPanier } })
  }

  return null
}

/**
 * Paiement confirmé : la commande est LIVREE, pas seulement PAYEE.
 *
 * C'est le plugin Tebex, installé sur le serveur Minecraft, qui applique le
 * contenu sur le compte du joueur. Il le fait de son côté dès que Tebex lui
 * signale la transaction — le site n'a aucune commande console à exécuter et
 * aucune file à remplir.
 *
 * `payeeAt` et `livreeAt` sont donc posés ensemble : les deux évènements sont
 * simultanés de notre point de vue. On garde les deux colonnes plutôt qu'une
 * seule, parce qu'un remboursement doit pouvoir distinguer « payée » de
 * « livrée » dans l'historique.
 */
async function marquerPayeeEtLivrer(commandeId: string, transaction: string | null) {
  const maintenant = new Date()

  await prisma.commande.update({
    where: { id: commandeId },
    data: {
      statut: 'LIVREE',
      payeeAt: maintenant,
      livreeAt: maintenant,
      transactionTebex: transaction,
      derniereErreur: null,
    },
  })
}

/**
 * Remboursement ou litige perdu : la commande passe en REMBOURSEE.
 *
 * Le retrait en jeu est du ressort du plugin Tebex, qui gère lui-même les
 * remboursements. `livreeAt` n'est pas effacé : il reste la trace que le
 * joueur avait bien reçu son contenu avant l'annulation.
 */
async function marquerRembourseeEtRetirer(commandeId: string) {
  await prisma.commande.update({
    where: { id: commandeId },
    data: { statut: 'REMBOURSEE' },
  })
}

/**
 * Utile pour vérifier depuis un navigateur que la route est déployée.
 * Ne révèle rien : ni la configuration, ni l'existence du secret.
 */
export async function GET() {
  return Response.json({ statut: 'en ligne', methode: 'POST attendu' }, { status: 200 })
}
