/**
 * LES RÉPONSES POSSIBLES DE /suggestions, PARTAGÉES SERVEUR ET NAVIGATEUR.
 *
 * Même découpage que avis / avis-partage : ici ni prisma ni node:crypto, pour
 * que le formulaire puisse l'importer. Les clés sont écrites en base, les
 * libellés vivent dans i18n.ts (public) et dans la page admin.
 */

/** Question 1 — un seul choix : ce qui le ferait rester en saison 2. */
export const CATEGORIES_SUGGESTION = [
  'modes',
  'combat',
  'anticheat',
  'recompenses',
  'events',
  'joueurs',
  'autre',
] as const

/** Question 3 — plusieurs choix, facultatif : pourquoi il joue peu ou a arrêté. */
export const RAISONS_SUGGESTION = [
  'peu-de-joueurs',
  'attente',
  'tricheurs',
  'gameplay',
  'lassitude',
  'horaires',
  'aucune',
] as const

export type CategorieSuggestion = (typeof CATEGORIES_SUGGESTION)[number]
export type RaisonSuggestion = (typeof RAISONS_SUGGESTION)[number]

/** Le champ piège : invisible, rempli seulement par un robot. */
export const CHAMP_PIEGE_SUGGESTION = 'site_web'

/** Une suggestion tient en une phrase utile au minimum, en un pavé au maximum. */
export const SUGGESTION_MIN = 10
export const SUGGESTION_MAX = 2000
