import { unstable_cache } from 'next/cache'

import { gradeDe, type Grade } from '@/lib/grades-commun'
import { prisma } from '@/lib/prisma'

/**
 * CE QUE LE SITE SAIT D'UN JOUEUR EN DEHORS DU RANKED (16/10/2026).
 *
 *   - son grade : les groupes LuckPerms, lus dans le schéma `luckperms` que les
 *     serveurs partagent sur Neon depuis le 13/10 ;
 *   - sa présence : `session_joueur`, écrite par LJRank à chaque connexion —
 *     première venue, dernière venue, temps de jeu, et « en ligne » quand la
 *     dernière session n'est pas fermée.
 *
 * ⚠ LECTURE SEULE, comme tout ce que le site lit des plugins.
 */

/** Une session restée ouverte plus longtemps que ça est un reste de crash, pas un joueur en ligne. */
const SESSION_FANTOME_HEURES = 12

/** Le grade de chaque joueur demandé (absent de la Map = sans grade). */
export async function lireGrades(uuids: string[]): Promise<Map<string, Grade>> {
  if (uuids.length === 0) return new Map()
  try {
    const lignes = await prisma.$queryRawUnsafe<{ uuid: string; groupes: string[] }[]>(
      `select uuid, array_agg(substr(permission, 7)) as groupes
         from luckperms.luckperms_user_permissions
        where uuid = any($1) and permission like 'group.%' and value
          and (expiry = 0 or expiry > extract(epoch from now()))
        group by uuid`,
      uuids,
    )
    const grades = new Map<string, Grade>()
    for (const l of lignes) {
      const g = gradeDe(l.groupes)
      if (g) grades.set(l.uuid, g)
    }
    return grades
  } catch {
    // Schéma LuckPerms injoignable (droits, base de test) : on affiche sans grades.
    return new Map()
  }
}

export type Presence = {
  enLigne: boolean
  premiereVenue: Date | null
  derniereVenue: Date | null
  /** Temps de jeu total sur le serveur (toutes saisons), en secondes. */
  tempsJeu: number
}

export async function lirePresence(uuid: string): Promise<Presence> {
  const lignes = await prisma.$queryRawUnsafe<
    { premiere: Date | null; derniere: Date | null; ouverte: boolean; secondes: number }[]
  >(
    `select min(debut) as premiere,
            max(coalesce(fin, debut)) as derniere,
            bool_or(fin is null and debut > now() - interval '${SESSION_FANTOME_HEURES} hours') as ouverte,
            coalesce(sum(secondes), 0)::int as secondes
       from session_joueur where uuid = $1`,
    uuid,
  )
  const l = lignes[0]
  return {
    enLigne: Boolean(l?.ouverte),
    premiereVenue: l?.premiere ?? null,
    derniereVenue: l?.derniere ?? null,
    tempsJeu: l?.secondes ?? 0,
  }
}

export type JoueurTrouve = { uuid: string; pseudo: string; elo: number; saison: number }

/**
 * La recherche de la barre de navigation : TOUTES saisons confondues, pour qu'un
 * joueur de la saison 1 se trouve encore au début de la 2. Ceux qui commencent par
 * la saisie d'abord, puis les plus récents, puis le meilleur Elo.
 */
export async function rechercherPartout(saisie: string, limite = 8): Promise<JoueurTrouve[]> {
  const motif = saisie.replace(/[\\%_]/g, (c) => `\\${c}`)
  return prisma.$queryRawUnsafe<JoueurTrouve[]>(
    `select uuid, pseudo, elo, saison from (
        select distinct on (p.uuid) p.uuid, p.pseudo, coalesce(j.elo, p.elo)::int as elo, p.saison, p.derniere_maj
          from practice_elo p
          left join elo_joueur j on j.uuid = p.uuid and j.saison = p.saison
         where p.pseudo ilike '%' || $1 || '%' and p.matchs > 0
         order by p.uuid, p.saison desc, p.derniere_maj desc
      ) x
      order by (lower(pseudo) like lower($1) || '%') desc, saison desc, elo desc, pseudo asc
      limit $2`,
    motif,
    limite,
  )
}

export const lireGradesCache = unstable_cache(
  async (uuids: string[]) => [...(await lireGrades(uuids)).entries()],
  ['grades'],
  { revalidate: 300 },
)

/** Version en cache, rendue en Map (le cache de Next ne sait pas sérialiser une Map). */
export async function gradesEnCache(uuids: string[]): Promise<Map<string, Grade>> {
  return new Map(await lireGradesCache([...uuids].sort()))
}

/**
 * Retrouve un joueur par son pseudo, même s'il n'a jamais joué de ranked : un
 * nouveau venu a déjà une fiche (grade, première venue, temps de jeu). Le pseudo
 * le plus récemment vu gagne si deux comptes l'ont porté.
 */
export async function trouverJoueur(pseudo: string): Promise<{ uuid: string; pseudo: string } | null> {
  if (!/^[A-Za-z0-9_]{1,16}$/.test(pseudo)) return null
  const lignes = await prisma.$queryRawUnsafe<{ uuid: string; pseudo: string }[]>(
    `select uuid, pseudo from (
        select uuid, pseudo, derniere_maj as t from practice_elo where lower(pseudo) = lower($1)
        union all
        select uuid, pseudo, debut as t from session_joueur where lower(pseudo) = lower($1)
      ) x order by t desc limit 1`,
    pseudo,
  )
  return lignes[0] ?? null
}

/** Les saisons où ce joueur a au moins un match ranked, la plus récente d'abord. */
export async function saisonsJouees(uuid: string): Promise<number[]> {
  const lignes = await prisma.$queryRawUnsafe<{ saison: number }[]>(
    `select distinct saison from practice_elo where uuid = $1 and matchs > 0 order by saison desc`,
    uuid,
  )
  return lignes.map((l) => l.saison)
}

/** Le bilan des matchs ranked entre deux joueurs dans une saison (annulés exclus). */
export async function lireDuel(saison: number, a: string, b: string): Promise<{ a: number; b: number }> {
  const lignes = await prisma.$queryRawUnsafe<{ a: number; b: number }[]>(
    `select (count(*) filter (where gagnant = $2))::int as a, (count(*) filter (where gagnant = $3))::int as b
       from practice_match
      where saison = $1 and annule is null
        and ((gagnant = $2 and perdant = $3) or (gagnant = $3 and perdant = $2))`,
    saison,
    a,
    b,
  )
  return lignes[0] ?? { a: 0, b: 0 }
}
