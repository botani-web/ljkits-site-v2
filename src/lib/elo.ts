import { prisma } from '@/lib/prisma'

/**
 * Lecture du classement Elo.
 *
 * ⚠ LECTURE SEULE. Les quatre tables `elo_*` appartiennent au plugin LJElo :
 * lui seul écrit dedans. Rien ici ne doit jamais faire d'écriture — une
 * saison corrompue depuis le site serait invisible en jeu jusqu'au prochain
 * combat.
 */

/** Les paliers, repris à l'identique de Palier.java côté serveur. */
export const PALIERS = [
  { nom: 'Fer', minimum: 0, couleur: '#9e93ac' },
  { nom: 'Bronze', minimum: 850, couleur: '#c07a3e' },
  { nom: 'Argent', minimum: 1000, couleur: '#f2e8d9' },
  { nom: 'Or', minimum: 1150, couleur: '#fdc003' },
  { nom: 'Platine', minimum: 1300, couleur: '#5b8dd9' },
  { nom: 'Diamant', minimum: 1450, couleur: '#4fd6e0' },
  { nom: 'Maître', minimum: 1600, couleur: '#d977d9' },
  { nom: 'Légende', minimum: 1800, couleur: '#e92813' },
] as const

export type Palier = (typeof PALIERS)[number]

/** Le palier d'un Elo. Le tableau est trié, on prend le dernier atteint. */
export function palierDe(elo: number): Palier {
  let trouve: Palier = PALIERS[0]
  for (const palier of PALIERS) {
    if (elo >= palier.minimum) trouve = palier
  }
  return trouve
}

/** Ce qu'il reste avant le palier suivant, ou null au palier maximum. */
export function resteAvantSuivant(elo: number): { palier: Palier; reste: number } | null {
  for (const palier of PALIERS) {
    if (elo < palier.minimum) return { palier, reste: palier.minimum - elo }
  }
  return null
}

/** Nombre de combats exigé pour être éligible au cashprize. */
export const COMBATS_MINIMUM = 100

/** Nombre de joueurs remontés par le classement. */
export const TAILLE_CLASSEMENT = 100

export type LigneElo = {
  rang: number
  uuid: string
  pseudo: string
  elo: number
  eloMax: number
  combats: number
  kills: number
  morts: number
  serie: number
  recordSerie: number
  /** Le joueur a-t-il atteint les 100 combats du cashprize ? */
  eligible: boolean
}

export type SaisonElo = {
  id: number
  nom: string
  debut: Date
  fin: Date | null
}

/** La saison en cours, ou null si le serveur n'en a jamais ouvert. */
export async function lireSaisonCourante(): Promise<SaisonElo | null> {
  const saison = await prisma.eloSaison.findFirst({
    where: { fin: null },
    orderBy: { id: 'desc' },
    select: { id: true, nom: true, debut: true, fin: true },
  })
  return saison
}

/**
 * Le classement d'une saison.
 *
 * SEULS LES COMPTES LIÉS À DISCORD Y FIGURENT. C'est la règle du jeu : un
 * joueur non lié progresse normalement mais n'apparaît nulle part et ne peut
 * pas gagner le cashprize. Le site DOIT appliquer le même filtre que le
 * serveur, sinon les deux classements divergent et la liaison ne sert plus à
 * rien.
 *
 * La jointure passe par du SQL brut : `elo_liaison` n'a pas de relation
 * déclarée vers `elo_joueur` (le plugin ne pose aucune clé étrangère, pour
 * qu'une liaison puisse exister avant le premier combat).
 */
export async function lireClassementElo(saison: number): Promise<LigneElo[]> {
  const lignes = await prisma.$queryRaw<
    Array<{
      uuid: string
      pseudo: string
      elo: number
      elo_max: number
      combats: number
      kills: number
      morts: number
      serie: number
      record_serie: number
    }>
  >`
    SELECT j.uuid, j.pseudo, j.elo, j.elo_max, j.combats,
           j.kills, j.morts, j.serie, j.record_serie
      FROM elo_joueur j
      JOIN elo_liaison l ON l.uuid = j.uuid
     WHERE j.saison = ${saison}
     ORDER BY j.elo DESC, j.combats DESC, j.pseudo ASC
     LIMIT ${TAILLE_CLASSEMENT}
  `

  return lignes.map((ligne, index) => ({
    rang: index + 1,
    uuid: ligne.uuid,
    pseudo: ligne.pseudo,
    elo: ligne.elo,
    eloMax: ligne.elo_max,
    combats: ligne.combats,
    kills: ligne.kills,
    morts: ligne.morts,
    serie: ligne.serie,
    recordSerie: ligne.record_serie,
    eligible: ligne.combats >= COMBATS_MINIMUM,
  }))
}

/** Combien de joueurs sont classés, et combien de combats ont eu lieu. */
export async function lireChiffresSaison(
  saison: number,
): Promise<{ joueurs: number; combats: number; derniereMaj: Date | null }> {
  const [joueurs, combats, dernier] = await Promise.all([
    prisma.eloJoueur.count({ where: { saison } }),
    prisma.eloMatch.count({ where: { saison } }),
    prisma.eloJoueur.findFirst({
      where: { saison },
      orderBy: { derniereMaj: 'desc' },
      select: { derniereMaj: true },
    }),
  ])
  return { joueurs, combats, derniereMaj: dernier?.derniereMaj ?? null }
}

export type CombatRecent = {
  id: string
  instant: Date
  tueurPseudo: string
  victimePseudo: string
  kitTueur: string | null
  kitVictime: string | null
  gain: number
  perte: number
  eloTueurApres: number
  pvRestants: number | null
}

/**
 * Les derniers combats de la saison.
 *
 * L'`id` est un BigInt en base : il est converti en chaîne AVANT de traverser
 * la frontière serveur → client de Next.js, qui ne sait pas sérialiser un
 * BigInt et lèverait une erreur au rendu.
 */
export async function lireDerniersCombats(saison: number, limite = 10): Promise<CombatRecent[]> {
  const combats = await prisma.eloMatch.findMany({
    where: { saison },
    orderBy: { instant: 'desc' },
    take: limite,
    select: {
      id: true,
      instant: true,
      tueurPseudo: true,
      victimePseudo: true,
      kitTueur: true,
      kitVictime: true,
      gain: true,
      perte: true,
      eloTueurApres: true,
      pvRestants: true,
    },
  })

  return combats.map((combat) => ({ ...combat, id: combat.id.toString() }))
}

/** Met une majuscule au nom de kit, stocké en minuscules côté serveur. */
export function formaterKit(kit: string | null): string {
  if (!kit) return 'Aucun'
  return kit.charAt(0).toUpperCase() + kit.slice(1)
}
