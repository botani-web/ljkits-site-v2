import { prisma } from '@/lib/prisma'

/**
 * Lecture du classement des joueurs.
 *
 * ⚠ LECTURE SEULE. La table `joueur` appartient au serveur Minecraft
 * (skript-db), et `config_classement` est écrite par lui aussi. Rien ici ne
 * doit jamais écrire dans l'une ou l'autre.
 */

/** Les trois classements proposés. */
export type Periode = 'semaine' | 'mois' | 'vie'

/** Une ligne de classement, telle que la page l'affiche. */
export type LigneClassement = {
  rang: number
  pseudo: string
  /** La valeur qui classe : points hebdo, points mensuels, ou kills. */
  valeur: number
  /** Renseignés uniquement sur le classement à vie. */
  morts: number | null
  recordSerie: number | null
}

/** Nombre de joueurs affichés par classement. */
export const TAILLE_CLASSEMENT = 50

/* -------------------------------------------------------------------------- */
/* Dates de remise à zéro                                                     */
/* -------------------------------------------------------------------------- */

const SECONDES_PAR_JOUR = 86_400

/**
 * Prochain lundi 00:00 UTC, en secondes.
 * Si on est déjà lundi, c'est le lundi SUIVANT — jamais « maintenant ».
 */
export function prochainLundiUtc(maintenant = new Date()): number {
  const cible = new Date(
    Date.UTC(
      maintenant.getUTCFullYear(),
      maintenant.getUTCMonth(),
      maintenant.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  )

  // getUTCDay() : 0 = dimanche, 1 = lundi.
  const joursJusquAuLundi = (8 - cible.getUTCDay()) % 7 || 7
  cible.setUTCDate(cible.getUTCDate() + joursJusquAuLundi)

  return Math.floor(cible.getTime() / 1000)
}

/**
 * Repli du cycle mensuel : maintenant + 30 jours.
 *
 * Le reset mensuel du serveur est un cycle GLISSANT de 30 jours, pas un
 * passage au 1er du mois : à chaque remise à zéro, il recalcule
 * « maintenant + 30 jours ». Ce repli suit la même règle.
 */
export function dansTrenteJours(maintenant = new Date()): number {
  return Math.floor(maintenant.getTime() / 1000) + 30 * SECONDES_PAR_JOUR
}

/**
 * Lit les dates de remise à zéro déposées par le serveur Minecraft.
 *
 * Une valeur absente n'est pas une erreur : le serveur ne l'a peut-être pas
 * encore écrite. On calcule alors une date par défaut plutôt que de casser la
 * page.
 *
 * Les valeurs sont des BigInt en base ; elles sont converties en Number ici,
 * parce qu'un BigInt ne traverse pas la frontière serveur → client de Next.js.
 */
export async function lireDatesDeReset(): Promise<{ semaine: number; mois: number }> {
  const config = await prisma.configClassement.findMany({
    where: { cle: { in: ['hebdo_fin', 'mensuel_fin'] } },
  })

  const parCle = new Map(config.map((entree) => [entree.cle, Number(entree.valeur)]))

  return {
    semaine: parCle.get('hebdo_fin') ?? prochainLundiUtc(),
    mois: parCle.get('mensuel_fin') ?? dansTrenteJours(),
  }
}

/* -------------------------------------------------------------------------- */
/* Les trois classements                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Les trois classements, lus en parallèle.
 *
 * Chaque requête est un `ORDER BY … DESC LIMIT 50` couvert par un des index
 * descendants créés par skript-db : idx_hebdo, idx_mensuel et idx_kills.
 *
 * Le filtre `> 0` écarte les joueurs qui n'ont rien marqué sur la période :
 * une liste de cinquante zéros n'apprend rien à personne.
 */
export async function lireClassements(): Promise<Record<Periode, LigneClassement[]>> {
  const [semaine, mois, vie] = await Promise.all([
    prisma.joueur.findMany({
      where: { hebdoPoints: { gt: 0 } },
      orderBy: [{ hebdoPoints: 'desc' }, { pseudo: 'asc' }],
      take: TAILLE_CLASSEMENT,
      select: { pseudo: true, hebdoPoints: true },
    }),
    prisma.joueur.findMany({
      where: { mensuelPoints: { gt: 0 } },
      orderBy: [{ mensuelPoints: 'desc' }, { pseudo: 'asc' }],
      take: TAILLE_CLASSEMENT,
      select: { pseudo: true, mensuelPoints: true },
    }),
    prisma.joueur.findMany({
      where: { kills: { gt: 0 } },
      orderBy: [{ kills: 'desc' }, { pseudo: 'asc' }],
      take: TAILLE_CLASSEMENT,
      select: { pseudo: true, kills: true, morts: true, recordSerie: true },
    }),
  ])

  return {
    semaine: semaine.map((joueur, index) => ({
      rang: index + 1,
      pseudo: joueur.pseudo,
      valeur: joueur.hebdoPoints,
      morts: null,
      recordSerie: null,
    })),
    mois: mois.map((joueur, index) => ({
      rang: index + 1,
      pseudo: joueur.pseudo,
      valeur: joueur.mensuelPoints,
      morts: null,
      recordSerie: null,
    })),
    vie: vie.map((joueur, index) => ({
      rang: index + 1,
      pseudo: joueur.pseudo,
      valeur: joueur.kills,
      morts: joueur.morts,
      recordSerie: joueur.recordSerie,
    })),
  }
}

/**
 * Date de la dernière écriture du serveur Minecraft, toutes lignes confondues.
 * Sert à afficher « Classement à jour au … » : sans ça, le lecteur n'a aucun
 * moyen de savoir si les chiffres datent d'une minute ou de trois jours.
 */
export async function lireDerniereMiseAJour(): Promise<Date | null> {
  const dernier = await prisma.joueur.findFirst({
    orderBy: { derniereMaj: 'desc' },
    select: { derniereMaj: true },
  })

  return dernier?.derniereMaj ?? null
}
