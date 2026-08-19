/**
 * Ce que le serveur envoie au composant client de la boutique.
 *
 * Types explicites plutôt que dérivés de Prisma : ces objets traversent la
 * frontière serveur → client, autant que ce qui y transite soit lisible d'un
 * coup d'œil. Les prix sont en centimes, comme partout.
 */

export type GradeBoutique = {
  slug: string
  nom: string
  kanji: string | null
  sousTitre: string | null
  etiquette: string | null
  prixEurosCentimes: number
  achetable: boolean
  avantages: string[]
  /**
   * Nom du grade juste avant dans l'ordre, si celui-ci hérite de lui.
   * Calculé côté serveur pour afficher « ↳ Tout le grade Ronin ».
   */
  heriteDe: string | null
}

export type KitBoutique = {
  slug: string
  nom: string
  kanji: string | null
  role: string
  descriptionCourte: string
  prixCoins: number
  prixEurosCentimes: number
  bientot: boolean
  achetable: boolean
}

export type PackBoutique = {
  slug: string
  nom: string
  description: string
  prixEurosCentimes: number
  prixBarreCentimes: number | null
  achetable: boolean
}
