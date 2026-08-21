'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Prisma, StatutCommande } from '@prisma/client'

import type { EtatFormulaire } from '@/actions/etat'
import { exigerAdmin } from '@/actions/garde'
import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/site'
import { creerPanierTebex, ErreurTebex } from '@/lib/tebex'
import { schemaCommande } from '@/lib/validations'

/* -------------------------------------------------------------------------- */
/* Garde-fou anti-abus                                                        */
/* -------------------------------------------------------------------------- */

/** Nombre de commandes non payées tolérées pour un même pseudo, par heure. */
const MAX_EN_ATTENTE_PAR_HEURE = 3

/**
 * Refuse une nouvelle commande si le pseudo en a déjà trop en attente.
 *
 * Ce n'est PAS une limitation de débit complète : quelqu'un qui change de
 * pseudo à chaque requête passe au travers. C'est la protection minimale
 * réalisable côté base, sans dépendance ni table de compteurs, contre le cas
 * réaliste (un joueur qui reclique, un script naïf). La vraie limitation de
 * débit se règle au niveau du pare-feu Vercel, cf. README.
 */
async function tropDeCommandesEnAttente(pseudo: string) {
  const uneHeureAvant = new Date(Date.now() - 60 * 60 * 1000)

  const enAttente = await prisma.commande.count({
    where: {
      // Les pseudos Minecraft ne sont pas sensibles à la casse en pratique :
      // comparer sans tenir compte de la casse évite de contourner le compteur
      // en écrivant "Lestoo" puis "lestoo".
      pseudoMinecraft: { equals: pseudo, mode: 'insensitive' },
      statut: 'EN_ATTENTE',
      createdAt: { gte: uneHeureAvant },
    },
  })

  return enAttente >= MAX_EN_ATTENTE_PAR_HEURE
}

/* -------------------------------------------------------------------------- */
/* Création d'une commande — action PUBLIQUE                                  */
/* -------------------------------------------------------------------------- */

/**
 * ⚠ SEULE action de mutation du projet, avec connecter(), qui n'appelle pas
 * exigerAdmin() : c'est un visiteur anonyme qui commande.
 *
 * Ce qui la protège à la place :
 *
 *  1. Les PRIX NE SONT JAMAIS LUS DEPUIS LE NAVIGATEUR. Le panier client
 *     n'envoie que des couples {type, slug} ; nom, prix et commande de
 *     livraison sont relus en base, et le total recalculé ici. Sans ça,
 *     n'importe qui achèterait le pack à un centime.
 *  2. Seuls les articles visible + achetable sont acceptés, et les kits
 *     marqués « bientôt » sont refusés.
 *  3. Le pseudo est revalidé par zod, jamais par le seul `pattern` HTML.
 *  4. Panier plafonné à 10 articles, doublons écartés.
 *  5. Garde-fou anti-abus ci-dessus.
 */
export async function creerCommande(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  // Le panier voyage en JSON dans un champ caché : c'est un état React,
  // pas une suite de champs de formulaire.
  let articlesBruts: unknown = []
  try {
    articlesBruts = JSON.parse(String(formData.get('articles') ?? '[]'))
  } catch {
    return { erreur: 'Panier illisible. Recharge la page et réessaie.' }
  }

  const resultat = schemaCommande.safeParse({
    pseudoMinecraft: String(formData.get('pseudoMinecraft') ?? ''),
    articles: articlesBruts,
  })

  if (!resultat.success) {
    const champs = resultat.error.flatten().fieldErrors
    return {
      erreur: champs.articles?.[0] ?? champs.pseudoMinecraft?.[0] ?? 'Commande invalide.',
      champs,
    }
  }

  const { pseudoMinecraft, articles } = resultat.data

  // Doublons écartés : on ne vend rien en plusieurs exemplaires.
  const articlesUniques = articles.filter(
    (article, index) =>
      articles.findIndex((a) => a.type === article.type && a.slug === article.slug) === index,
  )

  if (await tropDeCommandesEnAttente(pseudoMinecraft)) {
    return {
      erreur:
        'Tu as déjà plusieurs commandes en attente de paiement. Termine-les ou attends une heure avant d’en créer une nouvelle.',
    }
  }

  /* ---- résolution en base : c'est ici que les vrais prix sont lus ---- */
  const lignes: Prisma.LigneCommandeCreateWithoutCommandeInput[] = []
  /// Les packages Tebex correspondants, collectés au fil de la résolution.
  const packageIds: number[] = []

  for (const article of articlesUniques) {
    if (article.type === 'KIT') {
      const kit = await prisma.kit.findFirst({
        where: {
          slug: article.slug,
          visible: true,
          achetable: true,
          bientot: false,
          prixEurosCentimes: { not: null },
        },
      })
      if (!kit || kit.prixEurosCentimes === null) {
        return { erreur: `Le kit « ${article.slug} » n’est plus disponible à l’achat.` }
      }
      if (kit.tebexPackageId === null) {
        return { erreur: `Le kit « ${kit.nom} » n’est pas encore configuré pour le paiement.` }
      }
      lignes.push({
        type: 'KIT',
        kit: { connect: { id: kit.id } },
        libelle: `Kit ${kit.nom}`,
        prixCentimes: kit.prixEurosCentimes,
        commandeLivraison: kit.commandeLivraison,
        commandeRetrait: kit.commandeRetrait,
      })
      packageIds.push(kit.tebexPackageId)
      continue
    }

    if (article.type === 'GRADE') {
      const grade = await prisma.grade.findFirst({
        where: { slug: article.slug, visible: true, achetable: true },
      })
      if (!grade) {
        return { erreur: `Le grade « ${article.slug} » n’est plus disponible à l’achat.` }
      }
      if (grade.tebexPackageId === null) {
        return {
          erreur: `Le grade « ${grade.nom} » n’est pas encore configuré pour le paiement.`,
        }
      }
      lignes.push({
        type: 'GRADE',
        grade: { connect: { id: grade.id } },
        libelle: `Grade ${grade.nom}`,
        prixCentimes: grade.prixEurosCentimes,
        commandeLivraison: grade.commandeLivraison,
        commandeRetrait: grade.commandeRetrait,
      })
      packageIds.push(grade.tebexPackageId)
      continue
    }

    const pack = await prisma.pack.findFirst({
      where: { slug: article.slug, visible: true, achetable: true },
    })
    if (!pack) {
      return { erreur: `Le pack « ${article.slug} » n’est plus disponible à l’achat.` }
    }
    if (pack.tebexPackageId === null) {
      return { erreur: `Le pack « ${pack.nom} » n’est pas encore configuré pour le paiement.` }
    }
    lignes.push({
      type: 'PACK',
      pack: { connect: { id: pack.id } },
      libelle: pack.nom,
      prixCentimes: pack.prixEurosCentimes,
      commandeLivraison: pack.commandeLivraison,
      commandeRetrait: pack.commandeRetrait,
    })
    packageIds.push(pack.tebexPackageId)
  }

  // Total calculé à partir des prix relus, jamais de ceux du navigateur.
  const montantTotalCentimes = lignes.reduce((total, ligne) => total + ligne.prixCentimes, 0)

  const commande = await prisma.commande.create({
    data: {
      pseudoMinecraft,
      montantTotalCentimes,
      statut: 'EN_ATTENTE',
      lignes: { create: lignes },
    },
  })

  /* ---- création du panier chez Tebex ---- */
  //
  // La commande est écrite en base AVANT l'appel à Tebex, parce que son id
  // doit voyager dans le `custom` du panier : c'est lui qui, au retour du
  // webhook, permettra de retrouver quoi livrer.
  //
  // Si Tebex échoue, la commande est marquée ECHOUEE avec la raison, plutôt
  // que supprimée : une trace visible dans l'admin vaut mieux qu'un échec
  // silencieux.
  let urlCheckout: string
  try {
    const panier = await creerPanierTebex({
      pseudoMinecraft,
      packageIds,
      commandeId: commande.id,
      urlRetour: `${SITE.url}/boutique/commande/${commande.id}`,
      urlAnnulation: `${SITE.url}/boutique`,
    })

    await prisma.commande.update({
      where: { id: commande.id },
      data: { referenceExterne: panier.ident, derniereErreur: null },
    })

    urlCheckout = panier.urlCheckout
  } catch (erreur) {
    const message =
      erreur instanceof ErreurTebex
        ? erreur.message
        : 'Erreur inattendue à la création du panier de paiement.'

    await prisma.commande.update({
      where: { id: commande.id },
      data: { statut: 'ECHOUEE', derniereErreur: message },
    })

    // La trace complète part dans les logs Vercel ; le visiteur, lui, ne voit
    // qu'un message générique — l'erreur d'un prestataire ne le concerne pas.
    // `contexte` porte la route exacte et le corps brut renvoyé par Tebex :
    // sans eux, un échec côté prestataire est indébogable depuis les logs.
    console.error(
      `[boutique] création du panier Tebex impossible (commande ${commande.id}) : ${message}`,
    )
    if (erreur instanceof ErreurTebex && erreur.contexte) {
      console.error('[boutique] détail Tebex :', erreur.contexte)
    }
    if (!(erreur instanceof ErreurTebex)) console.error(erreur)

    revalidatePath('/admin/commandes')
    return {
      erreur:
        'Le paiement est momentanément indisponible. Réessaie dans quelques minutes, ou passe sur le Discord.',
    }
  }

  revalidatePath('/admin/commandes')

  // Redirection vers la page de paiement Tebex. `redirect()` accepte une URL
  // externe absolue. Le retour se fera sur /boutique/commande/[id], que Tebex
  // connaît via complete_url.
  redirect(urlCheckout)
}

/* -------------------------------------------------------------------------- */
/* Suivi des commandes — actions ADMIN                                        */
/* -------------------------------------------------------------------------- */

/**
 * Change le statut d'une commande à la main.
 *
 * Tant qu'aucun prestataire de paiement n'est branché, c'est le seul moyen de
 * faire avancer une commande : on exécute les commandes console affichées sur
 * la page de détail, puis on marque la commande comme livrée.
 */
export async function changerStatutCommande(id: string, statut: StatutCommande) {
  await exigerAdmin()

  const commande = await prisma.commande.findUnique({ where: { id } })
  if (!commande) return

  // Les horodatages ne sont posés qu'une fois : repasser une commande en
  // PAYEE ne doit pas réécrire la date du premier paiement.
  const data: Prisma.CommandeUpdateInput = { statut }
  if (statut === 'PAYEE' && commande.payeeAt === null) data.payeeAt = new Date()
  if (statut === 'LIVREE') {
    if (commande.payeeAt === null) data.payeeAt = new Date()
    if (commande.livreeAt === null) data.livreeAt = new Date()
  }

  await prisma.commande.update({ where: { id }, data })

  revalidatePath('/admin/commandes')
  revalidatePath(`/admin/commandes/${id}`)
}
