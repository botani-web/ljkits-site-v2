/**
 * Ce que le serveur envoie au composant client de la boutique.
 *
 * Types explicites plutôt que dérivés de Prisma : ces objets traversent la
 * frontière serveur → client, autant que ce qui y transite soit lisible d'un
 * coup d'œil. Les prix sont en centimes, comme partout.
 */

/**
 * L'article est relié à un package Tebex, donc réellement payable.
 *
 * `creerCommande` refuse tout article dont `tebexPackageId` est null
 * (cf. src/actions/commandes.ts). Sans ce drapeau côté carte, le joueur
 * remplirait son panier pour se heurter au refus à la validation : on préfère
 * un bouton inerte et honnête à un cul-de-sac au paiement.
 */
type Payable = {
  paiementPret: boolean
}

export type GradeBoutique = Payable & {
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

export type KitBoutique = Payable & {
  slug: string
  nom: string
  kanji: string | null
  role: string
  descriptionCourte: string
  prixCoins: number
  prixEurosCentimes: number
  /**
   * GRATUIT = kit classique, EXCLUSIF = kit maison. C'est ce qui range la
   * carte dans l'un des deux rayons et ce sur quoi portent les filtres
   * rapides de la grille.
   */
  type: 'GRATUIT' | 'EXCLUSIF'
  bientot: boolean
  achetable: boolean
}

export type PackBoutique = Payable & {
  slug: string
  nom: string
  description: string
  prixEurosCentimes: number
  prixBarreCentimes: number | null
  achetable: boolean
  /**
   * Les noms des kits que le pack contient, dans l'ordre du catalogue.
   * Affichés sous la description — « Sakura · Yumi · Tanuki… » — pour que
   * l'acheteur voie ce qu'il prend sans ouvrir une autre page.
   */
  kitsInclus: string[]
}
