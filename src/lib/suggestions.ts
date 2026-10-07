import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CATEGORIES_SUGGESTION,
  RAISONS_SUGGESTION,
  SUGGESTION_MAX,
  SUGGESTION_MIN,
} from '@/lib/suggestions-partage'
import { prisma } from '@/lib/prisma'

export * from '@/lib/suggestions-partage'

/**
 * ================================================================
 *  LES SUGGESTIONS POUR LA SAISON 2 — LES RÈGLES  (07/10/2026)
 * ================================================================
 *
 * Cousine de /avis, mais pas la même question : /avis mesure le serveur tel
 * qu'il est, /suggestions demande ce qu'il faudrait pour que les joueurs
 * RESTENT. La suggestion écrite est donc obligatoire — c'est elle le sujet.
 *
 * Pseudo et Discord sont facultatifs : on veut aussi les idées de ceux qui
 * ne signeraient pas. Les donner permet seulement au staff de répondre.
 *
 * Anti-spam identique à /avis (empreinte d'adresse salée par AUTH_SECRET,
 * jamais l'adresse en clair), avec un plafond journalier un peu plus haut :
 * quelqu'un qui a trois idées doit pouvoir les envoyer séparément.
 */

const pseudoFacultatif = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .refine((v) => v === null || /^[A-Za-z0-9_]{3,16}$/.test(v), {
    message: 'Un pseudo Minecraft fait 3 à 16 caractères (lettres, chiffres, _).',
  })

/** Un nom Discord : 2 à 32 caractères, sans @ ni espaces superflus. */
const discordFacultatif = z
  .string()
  .trim()
  .transform((v) => v.replace(/^@/, ''))
  .transform((v) => (v === '' ? null : v))
  .refine((v) => v === null || /^[A-Za-z0-9_.]{2,32}$/.test(v), {
    message: 'Un pseudo Discord fait 2 à 32 caractères (lettres, chiffres, _ et .).',
  })

export const schemaSuggestion = z.object({
  categorie: z.enum(CATEGORIES_SUGGESTION, { message: 'Choisis une réponse.' }),
  message: z
    .string()
    .trim()
    .min(SUGGESTION_MIN, 'Écris ta suggestion (au moins une phrase).')
    .max(SUGGESTION_MAX, `Reste sous ${SUGGESTION_MAX} caractères.`),
  raisons: z.array(z.enum(RAISONS_SUGGESTION)).max(RAISONS_SUGGESTION.length),
  pseudo: pseudoFacultatif,
  discord: discordFacultatif,
  langue: z.enum(['fr', 'en']).catch('fr'),
})

/* -------------------------------------------------------------------------- */
/* La limitation de débit                                                     */
/* -------------------------------------------------------------------------- */

const FENETRE_COURTE_MS = 60_000
const FENETRE_LONGUE_MS = 24 * 60 * 60 * 1_000
const MAX_COURT = 1
const MAX_LONG = 5

export function empreinteAdresse(adresse: string): string {
  return createHash('sha256')
    .update(`${process.env.AUTH_SECRET ?? ''}|suggestion|${adresse}`)
    .digest('hex')
}

export type Verdict = { autorise: true } | { autorise: false; message: string }

export async function verifierDebitSuggestion(adresse: string, langue: 'fr' | 'en'): Promise<Verdict> {
  const empreinte = empreinteAdresse(adresse)

  const recents = await prisma.suggestion.count({
    where: { empreinte, createdAt: { gte: new Date(Date.now() - FENETRE_COURTE_MS) } },
  })
  if (recents >= MAX_COURT) {
    return {
      autorise: false,
      message:
        langue === 'en'
          ? 'Your suggestion was just sent. Wait a minute before sending another one.'
          : 'Ta suggestion vient d’être envoyée. Attends une minute avant d’en envoyer une autre.',
    }
  }

  const duJour = await prisma.suggestion.count({
    where: { empreinte, createdAt: { gte: new Date(Date.now() - FENETRE_LONGUE_MS) } },
  })
  if (duJour >= MAX_LONG) {
    return {
      autorise: false,
      message:
        langue === 'en'
          ? 'You’ve already sent several suggestions today. Come back tomorrow — we read them all.'
          : 'Tu as déjà envoyé plusieurs suggestions aujourd’hui. Reviens demain, on les lit toutes.',
    }
  }

  return { autorise: true }
}

/* -------------------------------------------------------------------------- */
/* La lecture, pour l'administration                                          */
/* -------------------------------------------------------------------------- */

export type LigneSuggestion = {
  id: string
  numero: number
  categorie: string
  message: string
  raisons: string[]
  pseudo: string | null
  discord: string | null
  langue: string
  traiteAt: Date | null
  noteAdmin: string | null
  createdAt: Date
  /** Combien de suggestions partagent cette empreinte : un envoi en série se voit. */
  memeSource: number
}

export async function lireSuggestions(limite = 500): Promise<LigneSuggestion[]> {
  const lignes = await prisma.suggestion.findMany({
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
    categorie: l.categorie,
    message: l.message,
    raisons: l.raisons,
    pseudo: l.pseudo,
    discord: l.discord,
    langue: l.langue,
    traiteAt: l.traiteAt,
    noteAdmin: l.noteAdmin,
    createdAt: l.createdAt,
    memeSource: parEmpreinte.get(l.empreinte) ?? 1,
  }))
}

/** Compte les clés, de la plus fréquente à la plus rare. */
export function compter(valeurs: string[]): { cle: string; n: number }[] {
  const carte = new Map<string, number>()
  for (const v of valeurs) carte.set(v, (carte.get(v) ?? 0) + 1)
  return [...carte.entries()].map(([cle, n]) => ({ cle, n })).sort((a, b) => b.n - a.n)
}
