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

/* ══════════════════════════════════════════════════════════════════════════
   LA FICHE D'UN JOUEUR
   ══════════════════════════════════════════════════════════════════════════ */

export type FicheJoueur = {
  uuid: string
  pseudo: string
  rang: number
  elo: number
  eloMax: number
  combats: number
  kills: number
  morts: number
  serie: number
  recordSerie: number
  eligible: boolean
  lie: boolean
  derniereMaj: Date
}

/**
 * La fiche d'un joueur, cherchée par pseudo.
 *
 * La recherche est INSENSIBLE À LA CASSE : une URL partagée dans un chat
 * arrive rarement avec la casse exacte du pseudo, et renvoyer un 404 sur
 * « /joueur/lestoo » quand le joueur s'appelle « Lestoo » serait absurde.
 *
 * Le rang est calculé par la base plutôt qu'en JavaScript : compter les
 * joueurs mieux classés coûte une requête indexée, là où remonter tout le
 * classement pour y chercher une position ramènerait cent lignes pour en
 * utiliser une.
 */
export async function lireFicheJoueur(
  pseudo: string,
  saison: number,
): Promise<FicheJoueur | null> {
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
      derniere_maj: Date
      lie: boolean
      rang: bigint
    }>
  >`
    SELECT j.uuid, j.pseudo, j.elo, j.elo_max, j.combats, j.kills, j.morts,
           j.serie, j.record_serie, j.derniere_maj,
           (l.uuid IS NOT NULL) AS lie,
           (SELECT count(*) + 1
              FROM elo_joueur mieux
              JOIN elo_liaison ml ON ml.uuid = mieux.uuid
             WHERE mieux.saison = j.saison AND mieux.elo > j.elo) AS rang
      FROM elo_joueur j
      LEFT JOIN elo_liaison l ON l.uuid = j.uuid
     WHERE j.saison = ${saison} AND lower(j.pseudo) = lower(${pseudo})
     LIMIT 1
  `

  const ligne = lignes[0]
  if (!ligne) return null
  // Un joueur non lié n'a pas d'Elo, nulle part : sa fiche n'existe pas.
  // Le serveur n'écrit plus sa ligne depuis le 03/09/2026 ; celle-ci reste
  // une ceinture pour les lignes d'avant et pour un compte délié.
  if (!ligne.lie) return null

  return {
    uuid: ligne.uuid,
    pseudo: ligne.pseudo,
    // Un joueur non lié n'a pas de rang : il ne figure pas au classement.
    rang: ligne.lie ? Number(ligne.rang) : 0,
    elo: ligne.elo,
    eloMax: ligne.elo_max,
    combats: ligne.combats,
    kills: ligne.kills,
    morts: ligne.morts,
    serie: ligne.serie,
    recordSerie: ligne.record_serie,
    eligible: ligne.combats >= COMBATS_MINIMUM,
    lie: ligne.lie,
    derniereMaj: ligne.derniere_maj,
  }
}

export type CombatJoueur = {
  id: string
  instant: Date
  victoire: boolean
  adversaire: string
  monKit: string | null
  sonKit: string | null
  /** Positif sur une victoire, négatif sur une défaite. */
  delta: number
  eloApres: number
  pvRestants: number | null
}

/**
 * Les derniers combats d'un joueur, victoires et défaites mêlées.
 *
 * Un UNION plutôt que deux requêtes : le joueur est tantôt dans la colonne
 * `tueur`, tantôt dans `victime`, et il faut les vingt derniers de l'ensemble
 * — pas les vingt derniers de chaque côté qu'il faudrait ensuite refusionner
 * et retrier en mémoire.
 */
export async function lireCombatsJoueur(
  uuid: string,
  saison: number,
  limite = 20,
): Promise<CombatJoueur[]> {
  const lignes = await prisma.$queryRaw<
    Array<{
      id: bigint
      instant: Date
      victoire: boolean
      adversaire: string
      mon_kit: string | null
      son_kit: string | null
      delta: number
      elo_apres: number
      pv_restants: number | null
    }>
  >`
    SELECT id, instant, true AS victoire, victime_pseudo AS adversaire,
           kit_tueur AS mon_kit, kit_victime AS son_kit,
           gain AS delta, elo_tueur_apres AS elo_apres, pv_restants
      FROM elo_match
     WHERE saison = ${saison} AND tueur = ${uuid}
    UNION ALL
    SELECT id, instant, false AS victoire, tueur_pseudo AS adversaire,
           kit_victime AS mon_kit, kit_tueur AS son_kit,
           -perte AS delta, elo_victime_apres AS elo_apres, NULL AS pv_restants
      FROM elo_match
     WHERE saison = ${saison} AND victime = ${uuid}
     ORDER BY instant DESC
     LIMIT ${limite}
  `

  return lignes.map((ligne) => ({
    id: ligne.id.toString(),
    instant: ligne.instant,
    victoire: ligne.victoire,
    adversaire: ligne.adversaire,
    monKit: ligne.mon_kit,
    sonKit: ligne.son_kit,
    delta: ligne.delta,
    eloApres: ligne.elo_apres,
    pvRestants: ligne.pv_restants,
  }))
}

export type StatKit = {
  kit: string
  victoires: number
  defaites: number
  total: number
  /** Pourcentage de victoires, arrondi à l'entier. */
  taux: number
}

/**
 * Les kits du joueur, du plus joué au moins joué.
 *
 * C'est la statistique qui rend une fiche utile plutôt que décorative : elle
 * dit avec quoi le joueur gagne, et avec quoi il perd.
 */
export async function lireStatsParKit(uuid: string, saison: number): Promise<StatKit[]> {
  const lignes = await prisma.$queryRaw<
    Array<{ kit: string; victoires: bigint; defaites: bigint }>
  >`
    SELECT kit,
           sum(CASE WHEN victoire THEN 1 ELSE 0 END) AS victoires,
           sum(CASE WHEN victoire THEN 0 ELSE 1 END) AS defaites
      FROM (
        SELECT kit_tueur AS kit, true AS victoire
          FROM elo_match
         WHERE saison = ${saison} AND tueur = ${uuid} AND kit_tueur IS NOT NULL
        UNION ALL
        SELECT kit_victime AS kit, false AS victoire
          FROM elo_match
         WHERE saison = ${saison} AND victime = ${uuid} AND kit_victime IS NOT NULL
      ) tout
     GROUP BY kit
     ORDER BY count(*) DESC
     LIMIT 8
  `

  return lignes.map((ligne) => {
    const victoires = Number(ligne.victoires)
    const defaites = Number(ligne.defaites)
    const total = victoires + defaites
    return {
      kit: ligne.kit,
      victoires,
      defaites,
      total,
      taux: total > 0 ? Math.round((victoires / total) * 100) : 0,
    }
  })
}

export type Adversaire = {
  pseudo: string
  victoires: number
  defaites: number
}

/** Les adversaires les plus fréquents, avec le face-à-face. */
export async function lireAdversaires(uuid: string, saison: number): Promise<Adversaire[]> {
  const lignes = await prisma.$queryRaw<
    Array<{ pseudo: string; victoires: bigint; defaites: bigint }>
  >`
    SELECT pseudo,
           sum(CASE WHEN victoire THEN 1 ELSE 0 END) AS victoires,
           sum(CASE WHEN victoire THEN 0 ELSE 1 END) AS defaites
      FROM (
        SELECT victime_pseudo AS pseudo, true AS victoire
          FROM elo_match WHERE saison = ${saison} AND tueur = ${uuid}
        UNION ALL
        SELECT tueur_pseudo AS pseudo, false AS victoire
          FROM elo_match WHERE saison = ${saison} AND victime = ${uuid}
      ) tout
     GROUP BY pseudo
     ORDER BY count(*) DESC
     LIMIT 5
  `

  return lignes.map((ligne) => ({
    pseudo: ligne.pseudo,
    victoires: Number(ligne.victoires),
    defaites: Number(ligne.defaites),
  }))
}

/**
 * La courbe d'Elo, reconstruite depuis les combats.
 *
 * Aucune table n'archive l'Elo dans le temps : chaque combat garde l'Elo
 * D'APRÈS, ce qui suffit à retracer la progression sans stocker une seconde
 * fois la même information. On remonte donc les combats du plus ancien au
 * plus récent et on lit la valeur qu'ils portent.
 */
export async function lireCourbeElo(
  uuid: string,
  saison: number,
  points = 40,
): Promise<number[]> {
  const lignes = await prisma.$queryRaw<Array<{ elo_apres: number }>>`
    SELECT elo_apres FROM (
      SELECT instant, elo_tueur_apres AS elo_apres
        FROM elo_match WHERE saison = ${saison} AND tueur = ${uuid}
      UNION ALL
      SELECT instant, elo_victime_apres AS elo_apres
        FROM elo_match WHERE saison = ${saison} AND victime = ${uuid}
      ORDER BY instant DESC
      LIMIT ${points}
    ) derniers
    ORDER BY instant ASC
  `
  return lignes.map((ligne) => ligne.elo_apres)
}
