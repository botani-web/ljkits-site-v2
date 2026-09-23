import { createHash } from 'node:crypto'

import { z } from 'zod'

import { CASHPRIZE, FREINS, MESSAGE_MAX, PRIORITES } from '@/lib/avis-partage'
import { prisma } from '@/lib/prisma'

export * from '@/lib/avis-partage'

/**
 * ================================================================
 *  LES RETOURS DE JOUEURS — LES RÈGLES  (23/09/2026)
 * ================================================================
 *
 * CINQ QUESTIONS, PAS SIX. Un questionnaire long ne récolte que l'avis des
 * gens qui avaient déjà envie d'écrire — c'est-à-dire les plus contents et
 * les plus fâchés. Court, il attrape aussi le milieu, et c'est le milieu qui
 * dit ce qu'il faut réparer.
 *
 *   1. une note, pour avoir une mesure qui se suit dans le temps ;
 *   2. LA priorité, un seul choix : forcer l'arbitrage donne un classement,
 *      cocher dix cases n'en donne aucun ;
 *   3. les freins, à choix multiples : là, l'accumulation est le signal ;
 *   4. le cashprize, parce qu'une récompense que personne ne connaît ne sert
 *      à rien — la réponse mesure notre communication, pas le joueur ;
 *   5. le texte libre, seul endroit où quelque chose d'imprévu peut arriver.
 *
 * LE PSEUDO EST FACULTATIF, et c'est un choix de fond : on veut les retours
 * de ceux qui n'oseraient pas signer une critique. Ceux qui signent gagnent
 * juste la possibilité d'une réponse.
 *
 * LES CLÉS NE SONT PAS DES LIBELLÉS. En base on écrit `combat`, `triche`,
 * `attente`… et l'affichage traduit. On peut donc reformuler une question en
 * français ou en anglais sans casser les statistiques déjà collectées.
 */

/* -------------------------------------------------------------------------- */
/* La validation                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Le pseudo suit le même format qu'ailleurs sur le site (3 à 16, lettres,
 * chiffres, underscore) — mais il peut être VIDE, et c'est le point.
 */
const pseudoFacultatif = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .refine((v) => v === null || /^[A-Za-z0-9_]{3,16}$/.test(v), {
    message: 'Un pseudo Minecraft fait 3 à 16 caractères (lettres, chiffres, _).',
  })

export const schemaAvis = z.object({
  pseudo: pseudoFacultatif,
  note: z.coerce.number().int().min(1, 'Donne une note.').max(5),
  priorite: z.enum(PRIORITES, { message: 'Choisis une priorité.' }),
  freins: z.array(z.enum(FREINS)).max(FREINS.length),
  cashprize: z.enum(CASHPRIZE, { message: 'Réponds à la question du cashprize.' }),
  message: z
    .string()
    .trim()
    .max(MESSAGE_MAX, `Reste sous ${MESSAGE_MAX} caractères.`)
    .transform((v) => (v === '' ? null : v)),
  langue: z.enum(['fr', 'en']).catch('fr'),
})

export type AvisValide = z.infer<typeof schemaAvis>

/* -------------------------------------------------------------------------- */
/* La limitation de débit                                                     */
/* -------------------------------------------------------------------------- */

/** Anti double-clic et anti-boucle. */
const FENETRE_COURTE_MS = 60_000
/** Par jour : on veut un avis par personne, pas un journal intime. */
const FENETRE_LONGUE_MS = 24 * 60 * 60 * 1_000
const MAX_COURT = 1
const MAX_LONG = 3

/**
 * L'empreinte d'une adresse. Salée par AUTH_SECRET : un vol de base ne rend
 * aucune adresse, et deux envois de la même source restent reconnaissables.
 * Même principe et même limite que pour le recrutement (voir lib/limite.ts) —
 * changer AUTH_SECRET remet les compteurs à zéro, c'est assumé.
 */
export function empreinteAdresse(adresse: string): string {
  return createHash('sha256').update(`${process.env.AUTH_SECRET ?? ''}|avis|${adresse}`).digest('hex')
}

export type Verdict = { autorise: true } | { autorise: false; message: string }

export async function verifierDebitAvis(adresse: string): Promise<Verdict> {
  const empreinte = empreinteAdresse(adresse)

  const recents = await prisma.avis.count({
    where: { empreinte, createdAt: { gte: new Date(Date.now() - FENETRE_COURTE_MS) } },
  })
  if (recents >= MAX_COURT) {
    return { autorise: false, message: 'Ton avis vient d’être envoyé. Merci !' }
  }

  const duJour = await prisma.avis.count({
    where: { empreinte, createdAt: { gte: new Date(Date.now() - FENETRE_LONGUE_MS) } },
  })
  if (duJour >= MAX_LONG) {
    return {
      autorise: false,
      message: 'Tu as déjà envoyé plusieurs avis aujourd’hui. Reviens demain, on les lit tous.',
    }
  }

  return { autorise: true }
}

/* -------------------------------------------------------------------------- */
/* La lecture, pour l'administration                                          */
/* -------------------------------------------------------------------------- */

export type LigneAvis = {
  id: string
  numero: number
  pseudo: string | null
  note: number
  priorite: string
  freins: string[]
  cashprize: string
  message: string | null
  langue: string
  traiteAt: Date | null
  createdAt: Date
  /** Combien d'avis partagent cette empreinte : un envoi en série se voit. */
  memeSource: number
}

export async function lireAvis(limite = 200): Promise<LigneAvis[]> {
  const lignes = await prisma.avis.findMany({
    orderBy: { createdAt: 'desc' },
    take: limite,
  })

  const parEmpreinte = new Map<string, number>()
  for (const l of lignes) {
    parEmpreinte.set(l.empreinte, (parEmpreinte.get(l.empreinte) ?? 0) + 1)
  }

  return lignes.map((l) => ({
    id: l.id,
    numero: l.numero,
    pseudo: l.pseudo,
    note: l.note,
    priorite: l.priorite,
    freins: l.freins,
    cashprize: l.cashprize,
    message: l.message,
    langue: l.langue,
    traiteAt: l.traiteAt,
    createdAt: l.createdAt,
    memeSource: parEmpreinte.get(l.empreinte) ?? 1,
  }))
}

export type StatsAvis = {
  total: number
  aTraiter: number
  noteMoyenne: number | null
  /** Part de joueurs qui connaissaient le cashprize, en pourcentage. */
  cashprizeConnu: number | null
  repartitionCashprize: { cle: string; n: number }[]
  priorites: { cle: string; n: number }[]
  freins: { cle: string; n: number }[]
  /** Les sept derniers jours, du plus ancien au plus récent. */
  parJour: { jour: string; n: number }[]
}

/**
 * Les statistiques, calculées en mémoire à partir des mêmes lignes que la
 * liste : à cette échelle (quelques centaines d'avis), une deuxième requête
 * d'agrégation coûterait plus cher qu'elle ne rapporterait.
 */
export function statistiques(lignes: LigneAvis[]): StatsAvis {
  const total = lignes.length
  if (total === 0) {
    return {
      total: 0,
      aTraiter: 0,
      noteMoyenne: null,
      cashprizeConnu: null,
      repartitionCashprize: [],
      priorites: [],
      freins: [],
      parJour: [],
    }
  }

  const compter = (valeurs: string[]) => {
    const carte = new Map<string, number>()
    for (const v of valeurs) carte.set(v, (carte.get(v) ?? 0) + 1)
    return [...carte.entries()]
      .map(([cle, n]) => ({ cle, n }))
      .sort((a, b) => b.n - a.n)
  }

  const somme = lignes.reduce((t, l) => t + l.note, 0)
  const connus = lignes.filter((l) => l.cashprize === 'oui').length

  const jours = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    jours.set(d.toISOString().slice(0, 10), 0)
  }
  for (const l of lignes) {
    const jour = l.createdAt.toISOString().slice(0, 10)
    if (jours.has(jour)) jours.set(jour, (jours.get(jour) ?? 0) + 1)
  }

  return {
    total,
    aTraiter: lignes.filter((l) => !l.traiteAt).length,
    noteMoyenne: Math.round((somme / total) * 10) / 10,
    cashprizeConnu: Math.round((connus * 100) / total),
    repartitionCashprize: compter(lignes.map((l) => l.cashprize)),
    priorites: compter(lignes.map((l) => l.priorite)),
    freins: compter(lignes.flatMap((l) => l.freins)),
    parJour: [...jours.entries()].map(([jour, n]) => ({ jour, n })),
  }
}
