/**
 * Les chiffres du tableau de bord /admin.
 *
 * Deux familles qui ne se mélangent pas :
 *   - l'ARGENT, lu dans Commande et LigneCommande ;
 *   - l'AUDIENCE, lue dans VuePage.
 *
 * Une convention, appliquée partout : le chiffre d'affaires ne compte QUE les
 * commandes livrées, et les remboursements en sont retranchés. Une commande
 * créée mais jamais payée ne vaut rien, et un remboursement n'est pas un
 * revenu — les afficher gonflerait les chiffres sans rien dire de vrai.
 *
 * Toutes les bornes de fenêtres (mois, 30 jours, période précédente) passent
 * par src/lib/temps.ts et sont donc calées sur le fuseau Europe/Paris, alors
 * même que Vercel exécute le code en UTC.
 */
import type { StatutCommande } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import {
  cleMoisParis,
  debutDuJourParis,
  debutDuMoisParis,
  libelleMois,
} from '@/lib/temps'

/** Les statuts qui représentent de l'argent réellement encaissé. */
const STATUTS_ENCAISSES = ['LIVREE'] as const

/** Les statuts d'une commande payée (ou en passe de l'être) mais pas livrée. */
const STATUTS_A_LIVRER = ['EN_ATTENTE', 'PAYEE'] as const

/** Nombre de lignes dans les palmarès (pages, articles, sources). */
const TAILLE_PALMARES = 12

/* -------------------------------------------------------------------------- */
/* ÉVOLUTION                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Comparaison d'une valeur à celle de la période précédente.
 *
 * `sens` pilote la couleur de la tuile (vert / rouge / neutre). Quand la
 * période précédente vaut zéro, l'évolution est INDISPONIBLE — pas +100 %, pas
 * +∞ : diviser par zéro ne veut rien dire, et la tuile affiche « — ».
 */
export type Evolution = {
  pourcentage: number | null
  sens: 'hausse' | 'baisse' | 'stable' | 'indisponible'
}

function evolution(actuel: number, precedent: number): Evolution {
  if (precedent === 0) return { pourcentage: null, sens: 'indisponible' }

  const variation = Math.round(((actuel - precedent) / precedent) * 100)
  return {
    pourcentage: variation,
    sens: variation > 0 ? 'hausse' : variation < 0 ? 'baisse' : 'stable',
  }
}

/* -------------------------------------------------------------------------- */
/* ARGENT                                                                     */
/* -------------------------------------------------------------------------- */

export type ResumeArgent = {
  caTotalCentimes: number
  caMoisCentimes: number
  ca30joursCentimes: number
  ca30joursEvolution: Evolution
  rembourseCentimes: number
  /** Commandes livrées depuis toujours. */
  commandesLivrees: number
  /** Commandes livrées sur les 30 derniers jours, et son évolution. */
  commandes30jours: number
  commandes30joursEvolution: Evolution
  /** Commandes payées (ou en attente de paiement) mais pas encore livrées. */
  enAttenteLivraison: number
  /** Panier moyen de toujours. */
  panierMoyenCentimes: number
  /** Panier moyen sur 30 jours, et son évolution. */
  panierMoyen30joursCentimes: number
  panierMoyen30joursEvolution: Evolution
  /** Commandes créées, tous statuts confondus — le haut de l'entonnoir. */
  commandesCreees: number
  /** Part des commandes créées qui ont été livrées, en pourcentage. */
  tauxConversion: number
}

export async function lireArgent(): Promise<ResumeArgent> {
  const debutMois = debutDuMoisParis()
  const debut30 = debutDuJourParis(new Date(), 30)
  const debut60 = debutDuJourParis(new Date(), 60)

  const encaissees = { statut: { in: [...STATUTS_ENCAISSES] } }

  const [total, mois, fenetre30, fenetrePrecedente, rembourse, creees, aLivrer] =
    await Promise.all([
      prisma.commande.aggregate({
        where: encaissees,
        _sum: { montantTotalCentimes: true },
        _count: { _all: true },
      }),
      prisma.commande.aggregate({
        where: { ...encaissees, payeeAt: { gte: debutMois } },
        _sum: { montantTotalCentimes: true },
      }),
      prisma.commande.aggregate({
        where: { ...encaissees, payeeAt: { gte: debut30 } },
        _sum: { montantTotalCentimes: true },
        _count: { _all: true },
      }),
      prisma.commande.aggregate({
        where: { ...encaissees, payeeAt: { gte: debut60, lt: debut30 } },
        _sum: { montantTotalCentimes: true },
        _count: { _all: true },
      }),
      prisma.commande.aggregate({
        where: { statut: 'REMBOURSEE' },
        _sum: { montantTotalCentimes: true },
      }),
      prisma.commande.count(),
      prisma.commande.count({ where: { statut: { in: [...STATUTS_A_LIVRER] } } }),
    ])

  const caTotalCentimes = total._sum.montantTotalCentimes ?? 0
  const commandesLivrees = total._count._all

  const ca30 = fenetre30._sum.montantTotalCentimes ?? 0
  const cmd30 = fenetre30._count._all
  const caPrec = fenetrePrecedente._sum.montantTotalCentimes ?? 0
  const cmdPrec = fenetrePrecedente._count._all

  const panier30 = cmd30 === 0 ? 0 : Math.round(ca30 / cmd30)
  const panierPrec = cmdPrec === 0 ? 0 : Math.round(caPrec / cmdPrec)

  return {
    caTotalCentimes,
    caMoisCentimes: mois._sum.montantTotalCentimes ?? 0,
    ca30joursCentimes: ca30,
    ca30joursEvolution: evolution(ca30, caPrec),
    rembourseCentimes: rembourse._sum.montantTotalCentimes ?? 0,
    commandesLivrees,
    commandes30jours: cmd30,
    commandes30joursEvolution: evolution(cmd30, cmdPrec),
    enAttenteLivraison: aLivrer,
    panierMoyenCentimes: commandesLivrees === 0 ? 0 : Math.round(caTotalCentimes / commandesLivrees),
    panierMoyen30joursCentimes: panier30,
    panierMoyen30joursEvolution: evolution(panier30, panierPrec),
    commandesCreees: creees,
    tauxConversion: creees === 0 ? 0 : Math.round((commandesLivrees / creees) * 100),
  }
}

export type MoisDeVente = {
  /** "2026-08" */
  cle: string
  libelle: string
  caCentimes: number
  commandes: number
}

/** Les douze derniers mois, du plus ancien au plus récent, trous compris. */
export async function lireMois(): Promise<MoisDeVente[]> {
  const depuis = debutDuMoisParis(new Date(), 11)

  const commandes = await prisma.commande.findMany({
    where: { statut: { in: [...STATUTS_ENCAISSES] }, payeeAt: { gte: depuis } },
    select: { payeeAt: true, montantTotalCentimes: true },
  })

  // On prépare les douze cases AVANT de répartir : un mois sans vente doit
  // apparaître à zéro, pas disparaître du graphique.
  const cases = new Map<string, MoisDeVente>()
  for (let recul = 11; recul >= 0; recul--) {
    const debut = debutDuMoisParis(new Date(), recul)
    const cle = cleMoisParis(debut)
    cases.set(cle, { cle, libelle: libelleMois(debut), caCentimes: 0, commandes: 0 })
  }

  for (const commande of commandes) {
    if (!commande.payeeAt) continue
    const mois = cases.get(cleMoisParis(commande.payeeAt))
    if (!mois) continue
    mois.caCentimes += commande.montantTotalCentimes
    mois.commandes += 1
  }

  return [...cases.values()]
}

export type ArticleVendu = {
  libelle: string
  type: string
  quantite: number
  caCentimes: number
}

/** Le palmarès des articles, sur les commandes livrées uniquement. */
export async function lireArticles(): Promise<ArticleVendu[]> {
  const lignes = await prisma.ligneCommande.findMany({
    where: { commande: { statut: { in: [...STATUTS_ENCAISSES] } } },
    select: { libelle: true, type: true, prixCentimes: true },
  })

  const parArticle = new Map<string, ArticleVendu>()
  for (const ligne of lignes) {
    const existant = parArticle.get(ligne.libelle)
    if (existant) {
      existant.quantite += 1
      existant.caCentimes += ligne.prixCentimes
    } else {
      parArticle.set(ligne.libelle, {
        libelle: ligne.libelle,
        type: ligne.type,
        quantite: 1,
        caCentimes: ligne.prixCentimes,
      })
    }
  }

  return [...parArticle.values()]
    .sort((a, b) => b.caCentimes - a.caCentimes)
    .slice(0, TAILLE_PALMARES)
}

export type VenteCategorie = {
  /** 'KIT' | 'GRADE' | 'PACK' */
  categorie: string
  libelle: string
  quantite: number
  caCentimes: number
}

/**
 * Ventes réparties par catégorie d'article (kit, grade, pack), sur les
 * commandes livrées. C'est la matière du donut « ce qui se vend ».
 */
export async function lireVentesParCategorie(): Promise<VenteCategorie[]> {
  const groupes = await prisma.ligneCommande.groupBy({
    by: ['type'],
    where: { commande: { statut: { in: [...STATUTS_ENCAISSES] } } },
    _count: { _all: true },
    _sum: { prixCentimes: true },
  })

  const libelles: Record<string, string> = { KIT: 'Kits', GRADE: 'Grades', PACK: 'Packs' }

  return groupes
    .map((groupe) => ({
      categorie: groupe.type,
      libelle: libelles[groupe.type] ?? groupe.type,
      quantite: groupe._count._all,
      caCentimes: groupe._sum.prixCentimes ?? 0,
    }))
    .sort((a, b) => b.caCentimes - a.caCentimes)
}

export type CommandeRecente = {
  id: string
  numero: number
  pseudoMinecraft: string
  articles: string
  montantTotalCentimes: number
  statut: StatutCommande
  createdAt: Date
}

/** Les N dernières commandes créées, tous statuts confondus. */
export async function lireDernieresCommandes(limite = 10): Promise<CommandeRecente[]> {
  const commandes = await prisma.commande.findMany({
    orderBy: { createdAt: 'desc' },
    take: limite,
    select: {
      id: true,
      numero: true,
      pseudoMinecraft: true,
      montantTotalCentimes: true,
      statut: true,
      createdAt: true,
      lignes: { select: { libelle: true } },
    },
  })

  return commandes.map((commande) => ({
    id: commande.id,
    numero: commande.numero,
    pseudoMinecraft: commande.pseudoMinecraft,
    articles: commande.lignes.map((ligne) => ligne.libelle).join(' · '),
    montantTotalCentimes: commande.montantTotalCentimes,
    statut: commande.statut,
    createdAt: commande.createdAt,
  }))
}

/* -------------------------------------------------------------------------- */
/* FRÉQUENTATION                                                              */
/* -------------------------------------------------------------------------- */

/**
 * L'instant du dernier échantillon de fréquentation reçu, ou null s'il n'y en
 * a aucun. Utilisé par le rate limit du POST /api/frequentation.
 */
export async function lireDernierEchantillon(): Promise<Date | null> {
  const dernier = await prisma.echantillonFrequentation.findFirst({
    orderBy: { releveLe: 'desc' },
    select: { releveLe: true },
  })
  return dernier?.releveLe ?? null
}

export type EtatCollecte = {
  /** Instant du dernier échantillon reçu, ou null. */
  dernier: Date | null
  /** Nombre d'échantillons reçus sur les dernières 24 h glissantes. */
  nombre24h: number
}

/**
 * L'état de santé du collecteur, pour la tuile joueurs.
 *
 * Deux signaux, car un relevé récent ne prouve pas une collecte régulière : un
 * bot qui redémarre en boucle peut poster un point de temps en temps. On
 * attend 144 échantillons par jour (un toutes les 10 min) ; en voir 30 dit que
 * quelque chose cloche, même si le dernier date d'il y a deux minutes.
 */
export async function lireEtatCollecte(): Promise<EtatCollecte> {
  const ilYa24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [dernier, nombre24h] = await Promise.all([
    prisma.echantillonFrequentation.findFirst({
      orderBy: { releveLe: 'desc' },
      select: { releveLe: true },
    }),
    prisma.echantillonFrequentation.count({ where: { releveLe: { gte: ilYa24h } } }),
  ])

  return { dernier: dernier?.releveLe ?? null, nombre24h }
}

/* -------------------------------------------------------------------------- */
/* AUDIENCE                                                                   */
/* -------------------------------------------------------------------------- */

export type ResumeAudience = {
  vuesTotal: number
  vues7jours: number
  vues30jours: number
  visiteurs7jours: number
  visiteurs30jours: number
  /** Évolution des visiteurs sur 30 jours vs les 30 jours précédents. */
  visiteurs30joursEvolution: Evolution
  /** Moyenne du temps passé, en secondes, sur les vues qui ont une durée. */
  dureeMoyenneSecondes: number
  /** Part des visites d'une seule page, en pourcentage. */
  tauxRebond: number
  /** Vrai tant qu'aucune vue n'a été enregistrée : la page le dit alors. */
  vide: boolean
}

export async function lireAudience(): Promise<ResumeAudience> {
  const debut7 = debutDuJourParis(new Date(), 7)
  const debut30 = debutDuJourParis(new Date(), 30)
  const debut60 = debutDuJourParis(new Date(), 60)

  const [vuesTotal, vues7, vues30, uniques7, uniques30, uniquesPrec, duree] =
    await Promise.all([
      prisma.vuePage.count(),
      prisma.vuePage.count({ where: { createdAt: { gte: debut7 } } }),
      prisma.vuePage.count({ where: { createdAt: { gte: debut30 } } }),
      prisma.vuePage.findMany({
        where: { createdAt: { gte: debut7 } },
        distinct: ['visiteId'],
        select: { visiteId: true },
      }),
      prisma.vuePage.findMany({
        where: { createdAt: { gte: debut30 } },
        distinct: ['visiteId'],
        select: { visiteId: true },
      }),
      prisma.vuePage.findMany({
        where: { createdAt: { gte: debut60, lt: debut30 } },
        distinct: ['visiteId'],
        select: { visiteId: true },
      }),
      prisma.vuePage.aggregate({
        where: { dureeMs: { not: null } },
        _avg: { dureeMs: true },
      }),
    ])

  // Rebond : une visite qui n'a vu qu'une seule page. Se calcule sur les
  // 30 derniers jours, comme le reste du bloc.
  const parVisite = await prisma.vuePage.groupBy({
    by: ['visiteId'],
    where: { createdAt: { gte: debut30 } },
    _count: { _all: true },
  })
  const visitesUnePage = parVisite.filter((v) => v._count._all === 1).length

  return {
    vuesTotal,
    vues7jours: vues7,
    vues30jours: vues30,
    visiteurs7jours: uniques7.length,
    visiteurs30jours: uniques30.length,
    visiteurs30joursEvolution: evolution(uniques30.length, uniquesPrec.length),
    dureeMoyenneSecondes: Math.round((duree._avg.dureeMs ?? 0) / 1000),
    tauxRebond:
      parVisite.length === 0 ? 0 : Math.round((visitesUnePage / parVisite.length) * 100),
    vide: vuesTotal === 0,
  }
}

export type PageVue = {
  chemin: string
  vues: number
  visiteurs: number
  dureeMoyenneSecondes: number
}

/** Le palmarès des pages sur 30 jours : vues, visiteurs distincts, temps moyen. */
export async function lirePages(): Promise<PageVue[]> {
  const vues = await prisma.vuePage.findMany({
    where: { createdAt: { gte: debutDuJourParis(new Date(), 30) } },
    select: { chemin: true, visiteId: true, dureeMs: true },
  })

  const parChemin = new Map<
    string,
    { vues: number; visiteurs: Set<string>; totalMs: number; avecDuree: number }
  >()

  for (const vue of vues) {
    let entree = parChemin.get(vue.chemin)
    if (!entree) {
      entree = { vues: 0, visiteurs: new Set(), totalMs: 0, avecDuree: 0 }
      parChemin.set(vue.chemin, entree)
    }
    entree.vues += 1
    entree.visiteurs.add(vue.visiteId)
    if (vue.dureeMs !== null) {
      entree.totalMs += vue.dureeMs
      entree.avecDuree += 1
    }
  }

  return [...parChemin.entries()]
    .map(([chemin, e]) => ({
      chemin,
      vues: e.vues,
      visiteurs: e.visiteurs.size,
      // Moyenne sur les seules vues qui ont une durée : compter les autres
      // comme zéro tirerait toutes les moyennes vers le bas.
      dureeMoyenneSecondes: e.avecDuree === 0 ? 0 : Math.round(e.totalMs / e.avecDuree / 1000),
    }))
    .sort((a, b) => b.vues - a.vues)
    .slice(0, TAILLE_PALMARES)
}

export type Repartition = { libelle: string; nombre: number; part: number }

/** D'où viennent les visiteurs, sur 30 jours. */
export async function lireSources(): Promise<Repartition[]> {
  const groupes = await prisma.vuePage.groupBy({
    by: ['source'],
    where: { createdAt: { gte: debutDuJourParis(new Date(), 30) } },
    _count: { _all: true },
  })

  const total = groupes.reduce((somme, g) => somme + g._count._all, 0)

  return groupes
    .map((g) => ({
      libelle: g.source ?? 'Accès direct',
      nombre: g._count._all,
      part: total === 0 ? 0 : Math.round((g._count._all / total) * 100),
    }))
    .sort((a, b) => b.nombre - a.nombre)
    .slice(0, TAILLE_PALMARES)
}

/** Répartition mobile / tablette / bureau, sur 30 jours. */
export async function lireAppareils(): Promise<Repartition[]> {
  const groupes = await prisma.vuePage.groupBy({
    by: ['appareil'],
    where: { createdAt: { gte: debutDuJourParis(new Date(), 30) } },
    _count: { _all: true },
  })

  const total = groupes.reduce((somme, g) => somme + g._count._all, 0)
  const libelles: Record<string, string> = {
    MOBILE: 'Mobile',
    TABLETTE: 'Tablette',
    BUREAU: 'Bureau',
  }

  return groupes
    .map((g) => ({
      libelle: libelles[g.appareil] ?? g.appareil,
      nombre: g._count._all,
      part: total === 0 ? 0 : Math.round((g._count._all / total) * 100),
    }))
    .sort((a, b) => b.nombre - a.nombre)
}
