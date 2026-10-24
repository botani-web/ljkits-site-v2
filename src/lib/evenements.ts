import { unstable_cache } from 'next/cache'

import { prisma } from '@/lib/prisma'

/**
 * LES ÉVÉNEMENTS (24/10/2026, tournoi HG Run du soir : 30 € top 3 + 5 € meilleur clip).
 *
 * Un événement = un créneau (debut → fin) et un barème. Ses MANCHES sont les parties du
 * HG Run public jouées dans ce créneau : le plugin LJHG les écrit, LJRank les range dans
 * hgrun_partie / hgrun_joueur (heure de fin de partie). Pendant un tournoi le Run est en
 * mode compétition (/compet en jeu) : aucune partie ne démarre sans l'organisateur, il n'y
 * a donc pas de partie « parasite » dans le créneau. Une partie de test se retire depuis
 * /admin/evenements (colonne `exclues`).
 *
 * Le classement est calculé ici, à la lecture, avec le MÊME barème que /compet en jeu :
 * points[place - 1] + pointsKill × kills ; égalité → kills, meilleure place, place à la
 * dernière manche.
 */

export type Statut = 'a-venir' | 'en-direct' | 'termine'

export type Evenement = {
  id: number
  slug: string
  nom: string
  nomEn: string
  description: string
  descriptionEn: string
  jeu: string
  debut: string
  fin: string
  cashprize: string
  prix: string
  prixEn: string
  points: number[]
  pointsKill: number
  exclues: string[]
  publie: boolean
}

export type LigneManche = {
  uuid: string
  pseudo: string
  kit: string
  kills: number
  place: number
  points: number
}

export type Manche = {
  id: string
  /** Numéro parmi les manches qui comptent (0 si exclue). */
  numero: number
  instant: string
  carte: string
  duree: number
  exclue: boolean
  lignes: LigneManche[]
}

export type ResultatManche = { numero: number; place: number; kills: number; points: number; kit: string }

export type LigneClassement = {
  rang: number
  uuid: string
  pseudo: string
  points: number
  kills: number
  victoires: number
  manches: number
  meilleure: number
  moyenne: number
  derniere: number
  parManche: ResultatManche[]
}

export type DetailEvenement = {
  evenement: Evenement
  statut: Statut
  manches: Manche[]
  classement: LigneClassement[]
  joueurs: number
  killsTotal: number
  mvp: LigneClassement | null
}

const BAREME_DEFAUT = [20, 15, 12, 10, 8, 6, 5, 4, 3, 2, 1, 1, 1, 1, 1]

export function statutDe(e: Pick<Evenement, 'debut' | 'fin'>, maintenant = Date.now()): Statut {
  if (maintenant < Date.parse(e.debut)) return 'a-venir'
  if (maintenant <= Date.parse(e.fin)) return 'en-direct'
  return 'termine'
}

export function pointsDe(e: Pick<Evenement, 'points' | 'pointsKill'>, place: number, kills: number): number {
  const bareme = e.points.length > 0 ? e.points : BAREME_DEFAUT
  const p = place >= 1 && place <= bareme.length ? bareme[place - 1] : 0
  return p + e.pointsKill * kills
}

type BrutEvenement = Awaited<ReturnType<typeof prisma.evenement.findFirstOrThrow>>

function versEvenement(b: BrutEvenement): Evenement {
  return {
    id: b.id,
    slug: b.slug,
    nom: b.nom,
    nomEn: b.nomEn,
    description: b.description,
    descriptionEn: b.descriptionEn,
    jeu: b.jeu,
    debut: b.debut.toISOString(),
    fin: b.fin.toISOString(),
    cashprize: b.cashprize,
    prix: b.prix,
    prixEn: b.prixEn,
    points: b.points,
    pointsKill: b.pointsKill,
    exclues: b.exclues.map((x) => x.toString()),
    publie: b.publie,
  }
}

/** Tous les événements (admin compris les non publiés), le plus récent d'abord. */
export async function lireTousEvenements(): Promise<Evenement[]> {
  const l = await prisma.evenement.findMany({ orderBy: { debut: 'desc' } })
  return l.map(versEvenement)
}

export async function lireEvenementParId(id: number): Promise<Evenement | null> {
  const b = await prisma.evenement.findUnique({ where: { id } })
  return b ? versEvenement(b) : null
}

type BrutLigne = {
  id: string
  instant: Date
  carte: string | null
  duree: number
  uuid: string
  pseudo: string
  kit: string | null
  kills: number
  place: number
}

/** Les parties du HG Run du créneau, exclues comprises (marquées), dans l'ordre où elles ont fini. */
export async function lireManches(e: Evenement): Promise<Manche[]> {
  const lignes = await prisma.$queryRaw<BrutLigne[]>`
    SELECT p.id::text AS id, p.instant, p.carte, p.duree, j.uuid, j.pseudo, j.kit, j.kills, j.place
    FROM hgrun_partie p JOIN hgrun_joueur j ON j.partie = p.id
    WHERE p.instant >= ${new Date(e.debut)} AND p.instant <= ${new Date(e.fin)}
    ORDER BY p.instant ASC, j.place ASC, j.kills DESC`
  const exclues = new Set(e.exclues)
  const parId = new Map<string, Manche>()
  for (const l of lignes) {
    let m = parId.get(l.id)
    if (!m) {
      m = { id: l.id, numero: 0, instant: l.instant.toISOString(), carte: l.carte ?? '', duree: l.duree, exclue: exclues.has(l.id), lignes: [] }
      parId.set(l.id, m)
    }
    m.lignes.push({ uuid: l.uuid, pseudo: l.pseudo, kit: l.kit ?? '', kills: l.kills, place: l.place, points: pointsDe(e, l.place, l.kills) })
  }
  let n = 0
  const manches = [...parId.values()]
  for (const m of manches) if (!m.exclue) m.numero = ++n
  return manches
}

export function classementDe(manches: Manche[]): LigneClassement[] {
  const comptent = manches.filter((m) => !m.exclue)
  const derniere = comptent[comptent.length - 1]
  const parJoueur = new Map<string, LigneClassement>()
  for (const m of comptent) {
    for (const l of m.lignes) {
      let x = parJoueur.get(l.uuid)
      if (!x) {
        x = { rang: 0, uuid: l.uuid, pseudo: l.pseudo, points: 0, kills: 0, victoires: 0, manches: 0, meilleure: 999, moyenne: 0, derniere: 999, parManche: [] }
        parJoueur.set(l.uuid, x)
      }
      x.pseudo = l.pseudo
      x.points += l.points
      x.kills += l.kills
      x.manches++
      if (l.place === 1) x.victoires++
      x.meilleure = Math.min(x.meilleure, l.place)
      if (m === derniere) x.derniere = l.place
      x.parManche.push({ numero: m.numero, place: l.place, kills: l.kills, points: l.points, kit: l.kit })
    }
  }
  const l = [...parJoueur.values()]
  for (const x of l) x.moyenne = x.parManche.reduce((s, r) => s + r.place, 0) / Math.max(1, x.parManche.length)
  l.sort((a, b) => b.points - a.points || b.kills - a.kills || a.meilleure - b.meilleure || a.derniere - b.derniere)
  l.forEach((x, i) => (x.rang = i + 1))
  return l
}

async function detail(e: Evenement): Promise<DetailEvenement> {
  const manches = await lireManches(e)
  const classement = classementDe(manches)
  const mvp = classement.length > 0 ? [...classement].sort((a, b) => b.kills - a.kills || a.rang - b.rang)[0] : null
  return {
    evenement: e,
    statut: statutDe(e),
    manches,
    classement,
    joueurs: classement.length,
    killsTotal: classement.reduce((s, x) => s + x.kills, 0),
    mvp: mvp && mvp.kills > 0 ? mvp : null,
  }
}

/** La page publique d'un événement : gardée 20 s (pendant le direct, une manche arrive en moins d'une minute). */
export const lireDetailEvenement = unstable_cache(
  async (slug: string): Promise<DetailEvenement | null> => {
    const b = await prisma.evenement.findUnique({ where: { slug } })
    if (!b || !b.publie) return null
    return detail(versEvenement(b))
  },
  ['evenement-detail'],
  { revalidate: 20, tags: ['evenements'] },
)

export type ResumeEvenement = {
  evenement: Evenement
  statut: Statut
  manches: number
  joueurs: number
  gagnant: LigneClassement | null
}

/** La liste publique : chaque événement publié avec son nombre de manches et son premier. */
export const lireEvenementsPublics = unstable_cache(
  async (): Promise<ResumeEvenement[]> => {
    const l = await prisma.evenement.findMany({ where: { publie: true }, orderBy: { debut: 'desc' } })
    return Promise.all(
      l.map(async (b) => {
        const d = await detail(versEvenement(b))
        return { evenement: d.evenement, statut: d.statut, manches: d.manches.filter((m) => !m.exclue).length, joueurs: d.joueurs, gagnant: d.classement[0] ?? null }
      }),
    )
  },
  ['evenements-publics'],
  { revalidate: 20, tags: ['evenements'] },
)
