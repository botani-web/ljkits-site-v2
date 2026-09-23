/**
 * LES RÉPONSES POSSIBLES, PARTAGÉES SERVEUR ET NAVIGATEUR.
 *
 * Ce fichier ne tire NI prisma NI node:crypto : c'est ce qui lui permet
 * d'être importé par le formulaire côté navigateur. Les règles (validation,
 * limitation de débit, lecture admin) vivent dans `avis.ts`, qui n'est
 * jamais envoyé au client. Même découpage que recrutement / recrutement-partage.
 *
 * LES CLÉS NE SONT PAS DES LIBELLÉS. En base on écrit `combat`, `triche`,
 * `attente`… et l'affichage traduit. On peut donc reformuler une question en
 * français ou en anglais sans casser les statistiques déjà collectées.
 */

/* -------------------------------------------------------------------------- */
/* Les réponses possibles                                                     */
/* -------------------------------------------------------------------------- */

/** Question 2 — un seul choix, celui qui compte le plus pour le joueur. */
export const PRIORITES = [
  'combat',
  'triche',
  'modes',
  'cartes',
  'joueurs',
  'boutique',
  'autre',
] as const

/** Question 3 — plusieurs choix : c'est le cumul qui fait le signal. */
export const FREINS = [
  'peu-de-joueurs',
  'attente',
  'gameplay',
  'tricheurs',
  'horaires',
  'aucun',
] as const

/** Question 4 — trois réponses, parce que « vaguement » est une vraie réponse. */
export const CASHPRIZE = ['oui', 'vaguement', 'non'] as const

export type Priorite = (typeof PRIORITES)[number]
export type Frein = (typeof FREINS)[number]
export type ReponseCashprize = (typeof CASHPRIZE)[number]

/** Le champ piège : invisible, rempli seulement par un robot. */
export const CHAMP_PIEGE = 'site_web'

/** Au-delà, ce n'est plus un avis, c'est un collage. */
export const MESSAGE_MAX = 2000
