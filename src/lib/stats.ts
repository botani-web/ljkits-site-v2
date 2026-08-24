/**
 * Les chiffres de /admin/stats.
 *
 * Deux familles qui ne se mélangent pas :
 *   - l'ARGENT, lu dans Commande et LigneCommande ;
 *   - l'AUDIENCE, lue dans VuePage.
 *
 * Une convention, appliquée partout : le chiffre d'affaires ne compte QUE les
 * commandes livrées, et les remboursements en sont retranchés. Une commande
 * créée mais jamais payée ne vaut rien, et un remboursement n'est pas un
 * revenu — les afficher gonflerait les chiffres sans rien dire de vrai.
 */
import { prisma } from '@/lib/prisma'

/** Les statuts qui représentent de l'argent réellement encaissé. */
const STATUTS_ENCAISSES = ['LIVREE'] as const

/** Nombre de lignes dans les palmarès (pages, articles, sources). */
const TAILLE_PALMARES = 12

/** Le début du mois courant, dans le fuseau du serveur. */
function debutDuMois(decalageMois = 0) {
  const maintenant = new Date()
  return new Date(maintenant.getFullYear(), maintenant.getMonth() - decalageMois, 1)
}

function ilYaJours(jours: number) {
  const date = new Date()
  date.setDate(date.getDate() - jours)
  return date
}

/* -------------------------------------------------------------------------- */
/* ARGENT                                                                     */
/* -------------------------------------------------------------------------- */

export type ResumeArgent = {
  caTotalCentimes: number
  caMoisCentimes: number
  ca30joursCentimes: number
  rembourseCentimes: number
  commandesLivrees: number
  panierMoyenCentimes: number
  /** Commandes créées, tous statuts confondus — le haut de l'entonnoir. */
  commandesCreees: number
  /** Part des commandes créées qui ont été payées, en pourcentage. */
  tauxConversion: number
}

export async function lireArgent(): Promise<ResumeArgent> {
  const [total, mois, trenteJours, rembourse, creees] = await Promise.all([
    prisma.commande.aggregate({
      where: { statut: { in: [...STATUTS_ENCAISSES] } },
      _sum: { montantTotalCentimes: true },
      _count: { _all: true },
    }),
    prisma.commande.aggregate({
      where: { statut: { in: [...STATUTS_ENCAISSES] }, payeeAt: { gte: debutDuMois() } },
      _sum: { montantTotalCentimes: true },
    }),
    prisma.commande.aggregate({
      where: { statut: { in: [...STATUTS_ENCAISSES] }, payeeAt: { gte: ilYaJours(30) } },
      _sum: { montantTotalCentimes: true },
    }),
    prisma.commande.aggregate({
      where: { statut: 'REMBOURSEE' },
      _sum: { montantTotalCentimes: true },
    }),
    prisma.commande.count(),
  ])

  const caTotalCentimes = total._sum.montantTotalCentimes ?? 0
  const commandesLivrees = total._count._all

  return {
    caTotalCentimes,
    caMoisCentimes: mois._sum.montantTotalCentimes ?? 0,
    ca30joursCentimes: trenteJours._sum.montantTotalCentimes ?? 0,
    rembourseCentimes: rembourse._sum.montantTotalCentimes ?? 0,
    commandesLivrees,
    panierMoyenCentimes:
      commandesLivrees === 0 ? 0 : Math.round(caTotalCentimes / commandesLivrees),
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
  const depuis = debutDuMois(11)

  const commandes = await prisma.commande.findMany({
    where: { statut: { in: [...STATUTS_ENCAISSES] }, payeeAt: { gte: depuis } },
    select: { payeeAt: true, montantTotalCentimes: true },
  })

  // On prépare les douze cases AVANT de répartir : un mois sans vente doit
  // apparaître à zéro, pas disparaître du graphique.
  const cases = new Map<string, MoisDeVente>()
  for (let recul = 11; recul >= 0; recul--) {
    const date = debutDuMois(recul)
    const cle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    cases.set(cle, {
      cle,
      libelle: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      caCentimes: 0,
      commandes: 0,
    })
  }

  for (const commande of commandes) {
    if (!commande.payeeAt) continue
    const cle = `${commande.payeeAt.getFullYear()}-${String(
      commande.payeeAt.getMonth() + 1,
    ).padStart(2, '0')}`
    const mois = cases.get(cle)
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

export type StatutCompte = { statut: string; nombre: number; totalCentimes: number }

export async function lireStatuts(): Promise<StatutCompte[]> {
  const groupes = await prisma.commande.groupBy({
    by: ['statut'],
    _count: { _all: true },
    _sum: { montantTotalCentimes: true },
  })

  return groupes
    .map((groupe) => ({
      statut: groupe.statut,
      nombre: groupe._count._all,
      totalCentimes: groupe._sum.montantTotalCentimes ?? 0,
    }))
    .sort((a, b) => b.nombre - a.nombre)
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
  /** Moyenne du temps passé, en secondes, sur les vues qui ont une durée. */
  dureeMoyenneSecondes: number
  /** Part des visites d'une seule page, en pourcentage. */
  tauxRebond: number
  /** Vrai tant qu'aucune vue n'a été enregistrée : la page le dit alors. */
  vide: boolean
}

export async function lireAudience(): Promise<ResumeAudience> {
  const sept = ilYaJours(7)
  const trente = ilYaJours(30)

  const [vuesTotal, vues7, vues30, uniques7, uniques30, duree] = await Promise.all([
    prisma.vuePage.count(),
    prisma.vuePage.count({ where: { createdAt: { gte: sept } } }),
    prisma.vuePage.count({ where: { createdAt: { gte: trente } } }),
    prisma.vuePage.findMany({
      where: { createdAt: { gte: sept } },
      distinct: ['visiteId'],
      select: { visiteId: true },
    }),
    prisma.vuePage.findMany({
      where: { createdAt: { gte: trente } },
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
    where: { createdAt: { gte: trente } },
    _count: { _all: true },
  })
  const visitesUnePage = parVisite.filter((v) => v._count._all === 1).length

  return {
    vuesTotal,
    vues7jours: vues7,
    vues30jours: vues30,
    visiteurs7jours: uniques7.length,
    visiteurs30jours: uniques30.length,
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
    where: { createdAt: { gte: ilYaJours(30) } },
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
    where: { createdAt: { gte: ilYaJours(30) } },
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
    where: { createdAt: { gte: ilYaJours(30) } },
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
