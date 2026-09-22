import { MODES, type Resultat, type Vue } from '@/lib/practice-commun'
import { prisma } from '@/lib/prisma'

/**
 * LE RANKED PRACTICE, LU EN BASE (16/09/2026).
 *
 * Depuis le 12/09, l'Elo ne vient plus des kills du FFA mais de duels 1v1 en
 * file : un Elo par mode (HG, Digger, Boxing, Iron Soup) dans `practice_elo`,
 * chaque match dans `practice_match`, et l'Elo GLOBAL — la moyenne des modes,
 * celui qui décide du cashprize — dans `elo_joueur`, que LJElo aligne après
 * chaque match.
 *
 * ⚠ LECTURE SEULE. Toutes ces tables appartiennent aux plugins LJElo et
 * LJPractice. Le site ne fait que des SELECT, et tout ce qui est « détaillé »
 * (records, rivalités, courbes) se calcule ici à partir de l'historique des
 * matchs : il n'existe aucune table de statistiques à tenir à jour.
 *
 * Un joueur exclu du classement (`elo_exclusion.actif`) disparaît des listes
 * et de la recherche, exactement comme en jeu. Sa fiche reste consultable
 * par adresse directe, avec la mention « exclu ».
 */

export { MODES, estVue, infosMode, type IdMode, type Resultat, type Vue } from '@/lib/practice-commun'

/** Les exclus du classement n'apparaissent nulle part dans les listes. */
function horsExclus(alias = ''): string {
  return `${alias ? `${alias}.` : ''}uuid not in (select uuid from elo_exclusion where actif)`
}

function pourcentage(part: number, total: number): number {
  return total > 0 ? Math.round((part * 100) / total) : 0
}


/* ================================================================
 *  LE CLASSEMENT
 * ================================================================ */

export type LigneClassement = {
  rang: number
  uuid: string
  pseudo: string
  elo: number
  eloMax: number
  matchs: number
  victoires: number
  defaites: number
  /** De 0 à 100, arrondi. */
  winrate: number
  serie: number
  recordSerie: number
  /** Les 5 derniers résultats, le plus récent d'abord. */
  forme: Resultat[]
  /** Vue globale seulement : l'Elo de chacun de ses modes. */
  modes: { mode: string; elo: number }[]
}

type BrutClassement = {
  uuid: string
  pseudo: string
  elo: number
  eloMax: number
  matchs: number
  victoires: number
  defaites: number
  serie: number
  recordSerie: number
}

/**
 * Le classement d'une vue, dans l'ordre du jeu : Elo, puis le plus de matchs
 * devant à égalité (même règle que `Base.classement` de LJElo).
 */
export async function lireClassement(saison: number, vue: Vue, limite = 500): Promise<LigneClassement[]> {
  const lignes =
    vue === 'global'
      ? await prisma.$queryRawUnsafe<BrutClassement[]>(
          `select uuid, pseudo, elo, elo_max as "eloMax", combats as matchs, kills as victoires,
                  morts as defaites, serie, record_serie as "recordSerie"
             from elo_joueur
            where saison = $1 and combats > 0 and ${horsExclus()}
            order by elo desc, combats desc, pseudo asc
            limit $2`,
          saison,
          limite,
        )
      : await prisma.$queryRawUnsafe<BrutClassement[]>(
          `select uuid, pseudo, elo, elo_max as "eloMax", matchs, victoires, defaites,
                  serie, record_serie as "recordSerie"
             from practice_elo
            where saison = $1 and ladder = $2 and matchs > 0 and ${horsExclus()}
            order by elo desc, matchs desc, pseudo asc
            limit $3`,
          saison,
          vue,
          limite,
        )

  if (lignes.length === 0) return []
  const uuids = lignes.map((l) => l.uuid)
  const [formes, modes] = await Promise.all([
    lireFormes(saison, uuids, vue === 'global' ? null : vue),
    vue === 'global' ? lireModesDesJoueurs(saison, uuids) : Promise.resolve(new Map<string, { mode: string; elo: number }[]>()),
  ])

  return lignes.map((l, index) => ({
    ...l,
    rang: index + 1,
    winrate: pourcentage(l.victoires, l.matchs),
    forme: formes.get(l.uuid) ?? [],
    modes: modes.get(l.uuid) ?? [],
  }))
}

/** Les 5 derniers résultats de chaque joueur, en une seule requête. */
async function lireFormes(saison: number, uuids: string[], ladder: string | null): Promise<Map<string, Resultat[]>> {
  const filtre = ladder ? 'and ladder = $3' : ''
  const parametres: unknown[] = ladder ? [saison, uuids, ladder] : [saison, uuids]
  const lignes = await prisma.$queryRawUnsafe<{ uuid: string; resultats: string[] }[]>(
    `select uuid, (array_agg(r order by instant desc))[1:5] as resultats
       from (select gagnant as uuid, instant, 'V' as r from practice_match
              where saison = $1 and gagnant = any($2) ${filtre}
             union all
             select perdant as uuid, instant, 'D' as r from practice_match
              where saison = $1 and perdant = any($2) ${filtre}) x
      group by uuid`,
    ...parametres,
  )
  return new Map(lignes.map((l) => [l.uuid, l.resultats as Resultat[]]))
}

/** L'Elo de chaque mode joué, pour les pastilles de la vue globale. */
async function lireModesDesJoueurs(saison: number, uuids: string[]): Promise<Map<string, { mode: string; elo: number }[]>> {
  const lignes = await prisma.$queryRawUnsafe<{ uuid: string; ladder: string; elo: number }[]>(
    `select uuid, ladder, elo from practice_elo where saison = $1 and matchs > 0 and uuid = any($2)`,
    saison,
    uuids,
  )
  const ordre = new Map<string, number>(MODES.map((m, i) => [m.id, i]))
  const parJoueur = new Map<string, { mode: string; elo: number }[]>()
  for (const l of lignes) {
    const liste = parJoueur.get(l.uuid) ?? []
    liste.push({ mode: l.ladder, elo: l.elo })
    parJoueur.set(l.uuid, liste)
  }
  for (const liste of parJoueur.values()) {
    liste.sort((a, b) => (ordre.get(a.mode) ?? 99) - (ordre.get(b.mode) ?? 99))
  }
  return parJoueur
}

/* ================================================================
 *  LES CHIFFRES DE LA SAISON ET LES DERNIERS MATCHS
 * ================================================================ */

export type ChiffresSaison = {
  joueurs: number
  matchs: number
  matchs24h: number
  dernierMatch: Date | null
  /** Joueurs classés par mode, pour les onglets. */
  classesParMode: Record<string, number>
}

export async function lireChiffres(saison: number): Promise<ChiffresSaison> {
  const [joueurs, matchs, parMode] = await Promise.all([
    prisma.$queryRawUnsafe<{ n: number }[]>(
      `select count(distinct uuid)::int as n from practice_elo where saison = $1 and matchs > 0 and ${horsExclus()}`,
      saison,
    ),
    prisma.$queryRawUnsafe<{ n: number; h: number; dernier: Date | null }[]>(
      `select count(*)::int as n,
              (count(*) filter (where instant > now() - interval '24 hours'))::int as h,
              max(instant) as dernier
         from practice_match where saison = $1`,
      saison,
    ),
    prisma.$queryRawUnsafe<{ ladder: string; n: number }[]>(
      `select ladder, count(*)::int as n from practice_elo
        where saison = $1 and matchs > 0 and ${horsExclus()} group by ladder`,
      saison,
    ),
  ])
  return {
    joueurs: joueurs[0]?.n ?? 0,
    matchs: matchs[0]?.n ?? 0,
    matchs24h: matchs[0]?.h ?? 0,
    dernierMatch: matchs[0]?.dernier ?? null,
    classesParMode: Object.fromEntries(parMode.map((p) => [p.ladder, p.n])),
  }
}

export type LeaderMode = { mode: string; pseudo: string; elo: number }

/** Le n°1 de chaque mode, en une requête (vitrine des modes de l'accueil). */
export async function lireLeadersParMode(saison: number): Promise<LeaderMode[]> {
  return prisma.$queryRawUnsafe<LeaderMode[]>(
    `select distinct on (ladder) ladder as mode, pseudo, elo
       from practice_elo
      where saison = $1 and matchs > 0 and ${horsExclus()}
      order by ladder, elo desc, matchs desc, pseudo asc`,
    saison,
  )
}

export type MatchRecent = {
  id: string
  mode: string
  instant: Date
  gagnant: string
  gagnantPseudo: string
  perdant: string
  perdantPseudo: string
  gain: number
  perte: number
  duree: number
  raison: string
  pvGagnant: number | null
  eloGagnantApres: number
  eloPerdantApres: number
}

const COLONNES_MATCH = `id::text as id, ladder as mode, instant, gagnant, gagnant_pseudo as "gagnantPseudo",
  perdant, perdant_pseudo as "perdantPseudo", elo_gagnant_avant as "eloGagnantAvant",
  elo_gagnant_apres as "eloGagnantApres", elo_perdant_avant as "eloPerdantAvant",
  elo_perdant_apres as "eloPerdantApres", gain, perte, duree_secondes as duree, raison, pv_gagnant as "pvGagnant"`

export async function lireDerniersMatchs(saison: number, limite = 8, vue: Vue = 'global'): Promise<MatchRecent[]> {
  return vue === 'global'
    ? prisma.$queryRawUnsafe<MatchRecent[]>(
        `select ${COLONNES_MATCH} from practice_match where saison = $1 order by instant desc limit $2`,
        saison,
        limite,
      )
    : prisma.$queryRawUnsafe<MatchRecent[]>(
        `select ${COLONNES_MATCH} from practice_match where saison = $1 and ladder = $2 order by instant desc limit $3`,
        saison,
        vue,
        limite,
      )
}

/* ================================================================
 *  LA RECHERCHE
 * ================================================================ */

export type SuggestionJoueur = { uuid: string; pseudo: string; elo: number }

/**
 * Les joueurs dont le pseudo contient la saisie : ceux qui COMMENCENT par elle
 * d'abord, puis par Elo global. Les caractères joker de LIKE sont échappés.
 */
export async function rechercherJoueurs(saison: number, saisie: string, limite = 8): Promise<SuggestionJoueur[]> {
  const motif = saisie.replace(/[\\%_]/g, (c) => `\\${c}`)
  return prisma.$queryRawUnsafe<SuggestionJoueur[]>(
    `select p.uuid, p.pseudo, coalesce(j.elo, 1000)::int as elo
       from (select distinct on (uuid) uuid, pseudo
               from practice_elo where saison = $1
              order by uuid, derniere_maj desc) p
       left join elo_joueur j on j.uuid = p.uuid and j.saison = $1
      where p.pseudo ilike '%' || $2 || '%' and ${horsExclus('p')}
      order by (lower(p.pseudo) like lower($2) || '%') desc, coalesce(j.elo, 1000) desc, p.pseudo asc
      limit $3`,
    saison,
    motif,
    limite,
  )
}

/* ================================================================
 *  LE PROFIL D'UN JOUEUR
 * ================================================================ */

export type StatsMode = {
  mode: string
  elo: number
  eloMax: number
  /** 0 si le joueur est exclu. */
  rang: number
  total: number
  matchs: number
  victoires: number
  defaites: number
  winrate: number
  serie: number
  recordSerie: number
  derniereMaj: Date
}

export type MatchProfil = {
  id: string
  mode: string
  instant: Date
  victoire: boolean
  adversaire: string
  adversairePseudo: string
  eloAvant: number
  eloApres: number
  delta: number
  duree: number
  raison: string
  pvGagnant: number | null
}

export type Rival = {
  uuid: string
  pseudo: string
  victoires: number
  defaites: number
  matchs: number
  dernier: Date
}

export type Profil = {
  uuid: string
  pseudo: string
  exclu: boolean
  discordLie: boolean
  global: {
    elo: number
    eloMax: number
    rang: number
    total: number
    matchs: number
    victoires: number
    defaites: number
    winrate: number
    serie: number
    recordSerie: number
  } | null
  modes: StatsMode[]
  /** Les matchs les plus récents d'abord (au plus HISTORIQUE_MAX). */
  historique: MatchProfil[]
  totaux: { matchs: number; victoires: number; defaites: number; winrate: number }
  forme: Resultat[]
  records: {
    plusRapide: { duree: number; adversaire: string; mode: string } | null
    plusGrosGain: { gain: number; adversaire: string; mode: string } | null
    plusGrossePerte: { perte: number; adversaire: string; mode: string } | null
    dureeMoyenne: number | null
    clutchs: number
    parfaites: number
    modeFavori: string | null
    premier: Date | null
    dernier: Date | null
    raisons: { raison: string; victoires: number; defaites: number }[]
  }
  rivaux: { nemesis: Rival | null; victime: Rival | null; faceAFace: Rival[] }
  /** Une courbe par mode joué, du plus ancien au plus récent. */
  courbes: { mode: string; points: { instant: Date; elo: number }[] }[]
  /** Matchs par jour sur les 14 derniers jours (UTC), le plus ancien d'abord. */
  activite: { jour: string; matchs: number }[]
}

/** Au-delà, l'historique s'arrête : les statistiques, elles, portent sur toute la saison. */
const HISTORIQUE_MAX = 80
/** Garde-fou : un joueur ne jouera pas des milliers de matchs par mois, mais on borne la lecture. */
const MATCHS_LUS_MAX = 5000
/** Une victoire « clutch » : 3 cœurs ou moins au moment du kill. */
const PV_CLUTCH = 6
/** En boxing, les cœurs ne baissent jamais : les PV n'y veulent rien dire. */
const MODES_SANS_PV = new Set(['boxing'])

type BrutMatch = {
  id: string
  mode: string
  instant: Date
  gagnant: string
  gagnantPseudo: string
  perdant: string
  perdantPseudo: string
  eloGagnantAvant: number
  eloGagnantApres: number
  eloPerdantAvant: number
  eloPerdantApres: number
  gain: number
  perte: number
  duree: number
  raison: string
  pvGagnant: number | null
}

/** Le profil complet d'un joueur pour la saison, ou null s'il n'a jamais joué de ranked. */
export async function lireProfil(saison: number, recherche: string): Promise<Profil | null> {
  // Le pseudo peut avoir changé : on retrouve l'UUID par l'apparition la plus récente.
  const trouve = await prisma.$queryRawUnsafe<{ uuid: string }[]>(
    `select uuid from (
        select uuid, derniere_maj as t from practice_elo where saison = $1 and lower(pseudo) = lower($2)
        union all
        select gagnant, instant from practice_match where saison = $1 and lower(gagnant_pseudo) = lower($2)
        union all
        select perdant, instant from practice_match where saison = $1 and lower(perdant_pseudo) = lower($2)
      ) x order by t desc limit 1`,
    saison,
    recherche,
  )
  const uuid = trouve[0]?.uuid
  if (!uuid) return null

  const [pseudos, exclusion, liaison, globaux, modesBruts, bruts] = await Promise.all([
    prisma.$queryRawUnsafe<{ pseudo: string }[]>(
      `select pseudo from practice_elo where uuid = $1 order by derniere_maj desc limit 1`,
      uuid,
    ),
    prisma.$queryRawUnsafe<{ n: number }[]>(`select count(*)::int as n from elo_exclusion where uuid = $1 and actif`, uuid),
    prisma.$queryRawUnsafe<{ n: number }[]>(`select count(*)::int as n from elo_liaison where uuid = $1`, uuid),
    prisma.$queryRawUnsafe<(Omit<NonNullable<Profil['global']>, 'winrate'>)[]>(
      `select g.elo, g.elo_max as "eloMax", g.combats as matchs, g.kills as victoires, g.morts as defaites,
              g.serie, g.record_serie as "recordSerie", coalesce(r.rang, 0)::int as rang, coalesce(r.total, 0)::int as total
         from elo_joueur g
         left join (select uuid,
                           (row_number() over (order by elo desc, combats desc, pseudo asc))::int as rang,
                           (count(*) over ())::int as total
                      from elo_joueur where saison = $1 and combats > 0 and ${horsExclus()}) r on r.uuid = g.uuid
        where g.saison = $1 and g.uuid = $2 and g.combats > 0`,
      saison,
      uuid,
    ),
    prisma.$queryRawUnsafe<Omit<StatsMode, 'winrate'>[]>(
      `select p.ladder as mode, p.elo, p.elo_max as "eloMax", p.matchs, p.victoires, p.defaites, p.serie,
              p.record_serie as "recordSerie", p.derniere_maj as "derniereMaj",
              coalesce(r.rang, 0)::int as rang, coalesce(r.total, 0)::int as total
         from practice_elo p
         left join (select uuid, ladder,
                           (row_number() over (partition by ladder order by elo desc, matchs desc, pseudo asc))::int as rang,
                           (count(*) over (partition by ladder))::int as total
                      from practice_elo where saison = $1 and matchs > 0 and ${horsExclus()}) r
                on r.uuid = p.uuid and r.ladder = p.ladder
        where p.saison = $1 and p.uuid = $2 and p.matchs > 0`,
      saison,
      uuid,
    ),
    prisma.$queryRawUnsafe<BrutMatch[]>(
      `select ${COLONNES_MATCH} from practice_match
        where saison = $1 and (gagnant = $2 or perdant = $2)
        order by instant desc limit $3`,
      saison,
      uuid,
      MATCHS_LUS_MAX,
    ),
  ])

  const matchs: MatchProfil[] = bruts.map((b) => {
    const victoire = b.gagnant === uuid
    return {
      id: b.id,
      mode: b.mode,
      instant: b.instant,
      victoire,
      adversaire: victoire ? b.perdant : b.gagnant,
      adversairePseudo: victoire ? b.perdantPseudo : b.gagnantPseudo,
      eloAvant: victoire ? b.eloGagnantAvant : b.eloPerdantAvant,
      eloApres: victoire ? b.eloGagnantApres : b.eloPerdantApres,
      delta: victoire ? b.gain : -b.perte,
      duree: b.duree,
      raison: b.raison,
      pvGagnant: b.pvGagnant,
    }
  })

  const pseudo =
    pseudos[0]?.pseudo ??
    (bruts[0] ? (bruts[0].gagnant === uuid ? bruts[0].gagnantPseudo : bruts[0].perdantPseudo) : recherche)

  const ordreModes = new Map<string, number>(MODES.map((m, i) => [m.id, i]))
  const modes: StatsMode[] = modesBruts
    .map((m) => ({ ...m, winrate: pourcentage(m.victoires, m.matchs) }))
    .sort((a, b) => (ordreModes.get(a.mode) ?? 99) - (ordreModes.get(b.mode) ?? 99))

  const global = globaux[0] ? { ...globaux[0], winrate: pourcentage(globaux[0].victoires, globaux[0].matchs) } : null

  return {
    uuid,
    pseudo,
    exclu: (exclusion[0]?.n ?? 0) > 0,
    discordLie: (liaison[0]?.n ?? 0) > 0,
    global,
    modes,
    historique: matchs.slice(0, HISTORIQUE_MAX),
    totaux: calculerTotaux(matchs),
    forme: matchs.slice(0, 10).map((m) => (m.victoire ? 'V' : 'D')),
    records: calculerRecords(matchs),
    rivaux: calculerRivaux(matchs),
    courbes: calculerCourbes(matchs),
    activite: calculerActivite(matchs, 14),
  }
}

function calculerTotaux(matchs: MatchProfil[]): Profil['totaux'] {
  const victoires = matchs.filter((m) => m.victoire).length
  return { matchs: matchs.length, victoires, defaites: matchs.length - victoires, winrate: pourcentage(victoires, matchs.length) }
}

function calculerRecords(matchs: MatchProfil[]): Profil['records'] {
  const victoires = matchs.filter((m) => m.victoire)
  const defaites = matchs.filter((m) => !m.victoire)

  const rapides = victoires.filter((m) => m.duree > 0)
  const plusRapide = rapides.length
    ? rapides.reduce((a, b) => (b.duree < a.duree ? b : a))
    : null
  const plusGrosGain = victoires.length ? victoires.reduce((a, b) => (b.delta > a.delta ? b : a)) : null
  const plusGrossePerte = defaites.length ? defaites.reduce((a, b) => (b.delta < a.delta ? b : a)) : null

  const durees = matchs.filter((m) => m.duree > 0).map((m) => m.duree)
  const avecPv = victoires.filter((m) => m.pvGagnant != null && !MODES_SANS_PV.has(m.mode) && m.raison === 'tue')

  const parMode = new Map<string, number>()
  const parRaison = new Map<string, { victoires: number; defaites: number }>()
  for (const m of matchs) {
    parMode.set(m.mode, (parMode.get(m.mode) ?? 0) + 1)
    const r = parRaison.get(m.raison) ?? { victoires: 0, defaites: 0 }
    if (m.victoire) r.victoires++
    else r.defaites++
    parRaison.set(m.raison, r)
  }
  const modeFavori = [...parMode.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    plusRapide: plusRapide ? { duree: plusRapide.duree, adversaire: plusRapide.adversairePseudo, mode: plusRapide.mode } : null,
    plusGrosGain:
      plusGrosGain && plusGrosGain.delta > 0
        ? { gain: plusGrosGain.delta, adversaire: plusGrosGain.adversairePseudo, mode: plusGrosGain.mode }
        : null,
    plusGrossePerte:
      plusGrossePerte && plusGrossePerte.delta < 0
        ? { perte: -plusGrossePerte.delta, adversaire: plusGrossePerte.adversairePseudo, mode: plusGrossePerte.mode }
        : null,
    dureeMoyenne: durees.length ? Math.round(durees.reduce((a, b) => a + b, 0) / durees.length) : null,
    clutchs: avecPv.filter((m) => (m.pvGagnant ?? 99) <= PV_CLUTCH).length,
    parfaites: avecPv.filter((m) => (m.pvGagnant ?? 0) >= 20).length,
    modeFavori,
    premier: matchs.length ? matchs[matchs.length - 1].instant : null,
    dernier: matchs.length ? matchs[0].instant : null,
    raisons: [...parRaison.entries()]
      .map(([raison, v]) => ({ raison, ...v }))
      .sort((a, b) => b.victoires + b.defaites - (a.victoires + a.defaites)),
  }
}

function calculerRivaux(matchs: MatchProfil[]): Profil['rivaux'] {
  const parAdversaire = new Map<string, Rival>()
  // Les matchs arrivent du plus récent au plus ancien : le premier pseudo vu est le plus récent.
  for (const m of matchs) {
    const r = parAdversaire.get(m.adversaire) ?? {
      uuid: m.adversaire,
      pseudo: m.adversairePseudo,
      victoires: 0,
      defaites: 0,
      matchs: 0,
      dernier: m.instant,
    }
    r.matchs++
    if (m.victoire) r.victoires++
    else r.defaites++
    parAdversaire.set(m.adversaire, r)
  }
  const tous = [...parAdversaire.values()]
  const departager = (a: Rival, b: Rival) => b.matchs - a.matchs || b.dernier.getTime() - a.dernier.getTime()
  const nemesis = tous.filter((r) => r.defaites > 0).sort((a, b) => b.defaites - a.defaites || departager(a, b))[0] ?? null
  const victime = tous.filter((r) => r.victoires > 0).sort((a, b) => b.victoires - a.victoires || departager(a, b))[0] ?? null
  return { nemesis, victime, faceAFace: tous.sort(departager).slice(0, 10) }
}

function calculerCourbes(matchs: MatchProfil[]): Profil['courbes'] {
  const parMode = new Map<string, MatchProfil[]>()
  for (const m of matchs) {
    const liste = parMode.get(m.mode) ?? []
    liste.push(m)
    parMode.set(m.mode, liste)
  }
  const courbes: Profil['courbes'] = []
  for (const mode of MODES) {
    const liste = parMode.get(mode.id)
    if (!liste?.length) continue
    const chronologique = [...liste].reverse()
    const points = [
      // Le point de départ : l'Elo avant le tout premier match du mode.
      { instant: new Date(chronologique[0].instant.getTime() - 1000), elo: chronologique[0].eloAvant },
      ...chronologique.map((m) => ({ instant: m.instant, elo: m.eloApres })),
    ]
    courbes.push({ mode: mode.id, points })
  }
  return courbes
}

function calculerActivite(matchs: MatchProfil[], jours: number): Profil['activite'] {
  const cle = (d: Date) => d.toISOString().slice(0, 10)
  const compte = new Map<string, number>()
  for (const m of matchs) compte.set(cle(m.instant), (compte.get(cle(m.instant)) ?? 0) + 1)
  const aujourdhui = new Date()
  const activite: Profil['activite'] = []
  for (let i = jours - 1; i >= 0; i--) {
    const jour = new Date(Date.UTC(aujourdhui.getUTCFullYear(), aujourdhui.getUTCMonth(), aujourdhui.getUTCDate() - i))
    activite.push({ jour: cle(jour), matchs: compte.get(cle(jour)) ?? 0 })
  }
  return activite
}
