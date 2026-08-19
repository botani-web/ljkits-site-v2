import type { Prisma, StatutCommande, TypeLivraison } from '@prisma/client'

import { lignesAExecuter } from '@/lib/livraison'
import { prisma } from '@/lib/prisma'
import {
  extraireCommandeId,
  extraireIdentPanier,
  extraireTransaction,
  signatureWebhookValide,
  TYPE_LITIGE_OUVERT,
  TYPE_LITIGE_PERDU,
  TYPE_PAIEMENT_COMPLETE,
  TYPE_PAIEMENT_REMBOURSE,
  TYPE_VALIDATION,
  type WebhookTebex,
} from '@/lib/tebex'

/**
 * Webhook Tebex — le point d'entrée qui déclenche la livraison.
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
        break

      case TYPE_PAIEMENT_REMBOURSE:
      case TYPE_LITIGE_PERDU:
        await marquerRembourseeEtRetirer(commande.id)
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

/** Passe la commande en PAYEE et remplit la file de livraison. */
async function marquerPayeeEtLivrer(commandeId: string, transaction: string | null) {
  await creerLignesEtChangerStatut(commandeId, 'LIVRAISON', 'PAYEE', {
    payeeAt: new Date(),
    transactionTebex: transaction,
    derniereErreur: null,
  })
}

/** Passe la commande en REMBOURSEE et met les commandes de retrait en file. */
async function marquerRembourseeEtRetirer(commandeId: string) {
  await creerLignesEtChangerStatut(commandeId, 'RETRAIT', 'REMBOURSEE', {})
}

/**
 * Change le statut d'une commande et lui ajoute ses lignes de livraison,
 * en une seule transaction : soit la commande avance et la file est remplie,
 * soit rien ne bouge.
 */
async function creerLignesEtChangerStatut(
  commandeId: string,
  sens: TypeLivraison,
  statut: StatutCommande,
  champsSupplementaires: Prisma.CommandeUpdateInput,
) {
  const commande = await prisma.commande.findUniqueOrThrow({
    where: { id: commandeId },
    include: { lignes: true },
  })

  const commandes = lignesAExecuter(
    commande.lignes,
    commande.pseudoMinecraft,
    sens === 'LIVRAISON' ? 'LIVRAISON' : 'RETRAIT',
  )

  await prisma.$transaction([
    prisma.commande.update({
      where: { id: commandeId },
      data: { statut, ...champsSupplementaires },
    }),
    prisma.ligneLivraison.createMany({
      data: commandes.map((texte) => ({ commandeId, type: sens, commande: texte })),
    }),
  ])

  if (commandes.length === 0) {
    console.warn(
      `[webhook] commande ${commandeId} : aucune commande console à exécuter en ${sens}`,
    )
  }
}

/**
 * Utile pour vérifier depuis un navigateur que la route est déployée.
 * Ne révèle rien : ni la configuration, ni l'existence du secret.
 */
export async function GET() {
  return Response.json({ statut: 'en ligne', methode: 'POST attendu' }, { status: 200 })
}
