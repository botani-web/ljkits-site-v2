/**
 * Le panier de la boutique.
 *
 * Il ne contient QUE des identifiants — jamais de prix. Le navigateur peut
 * écrire ce qu'il veut dans son localStorage : le serveur relit les prix en
 * base au moment de créer la commande (cf. src/actions/commandes.ts).
 */

export type TypeArticle = 'KIT' | 'GRADE' | 'PACK'

/** Ce qui est stocké dans localStorage : le strict minimum. */
export type ArticlePanier = {
  type: TypeArticle
  slug: string
}

/**
 * Un article tel qu'il est affiché : les données viennent du serveur, pas
 * du localStorage. `disponible` passe à false si l'article a été retiré de
 * la vente depuis que le visiteur l'a mis dans son panier.
 */
export type ArticleAffiche = ArticlePanier & {
  nom: string
  prixCentimes: number
  disponible: boolean
}

/** Nombre maximum d'articles distincts. Garde-fou, côté client comme serveur. */
export const PANIER_MAXIMUM = 10

const CLE_STOCKAGE = 'ljkits.panier.v1'

/** Deux articles sont les mêmes si le type ET le slug correspondent. */
export function memeArticle(a: ArticlePanier, b: ArticlePanier) {
  return a.type === b.type && a.slug === b.slug
}

export function contient(panier: ArticlePanier[], article: ArticlePanier) {
  return panier.some((present) => memeArticle(present, article))
}

/**
 * Ajoute ou retire l'article : les cartes de la boutique sont des bascules,
 * comme dans la maquette. On ne vend rien en plusieurs exemplaires.
 */
export function basculer(panier: ArticlePanier[], article: ArticlePanier): ArticlePanier[] {
  if (contient(panier, article)) {
    return panier.filter((present) => !memeArticle(present, article))
  }
  if (panier.length >= PANIER_MAXIMUM) return panier
  return [...panier, article]
}

export function retirer(panier: ArticlePanier[], article: ArticlePanier): ArticlePanier[] {
  return panier.filter((present) => !memeArticle(present, article))
}

/* -------------------------------------------------------------------------- */
/* Persistance                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Relit le panier depuis localStorage.
 *
 * Tout est revalidé : le contenu peut avoir été écrit par une version
 * précédente du site, ou modifié à la main. En cas de doute on repart d'un
 * panier vide plutôt que de planter au chargement de la page.
 */
export function lirePanierStocke(): ArticlePanier[] {
  if (typeof window === 'undefined') return []

  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE)
    if (!brut) return []

    const donnees: unknown = JSON.parse(brut)
    if (!Array.isArray(donnees)) return []

    return donnees
      .filter(
        (entree): entree is ArticlePanier =>
          typeof entree === 'object' &&
          entree !== null &&
          typeof (entree as ArticlePanier).slug === 'string' &&
          ['KIT', 'GRADE', 'PACK'].includes((entree as ArticlePanier).type),
      )
      .slice(0, PANIER_MAXIMUM)
  } catch {
    return []
  }
}

export function ecrirePanierStocke(panier: ArticlePanier[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(panier))
  } catch {
    // Mode navigation privée ou quota atteint : le panier ne survivra pas au
    // rechargement, mais la boutique reste utilisable.
  }
}

/* -------------------------------------------------------------------------- */
/* Pseudo de livraison                                                        */
/* -------------------------------------------------------------------------- */

const CLE_PSEUDO = 'ljkits.pseudo.v1'

/** Règle Mojang : 3 à 16 caractères, lettres, chiffres et tiret bas. */
export const MOTIF_PSEUDO = /^[A-Za-z0-9_]{3,16}$/

export function pseudoValide(pseudo: string) {
  return MOTIF_PSEUDO.test(pseudo)
}

export function lirePseudoStocke(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const pseudo = window.localStorage.getItem(CLE_PSEUDO)
    return pseudo && pseudoValide(pseudo) ? pseudo : null
  } catch {
    return null
  }
}

export function ecrirePseudoStocke(pseudo: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (pseudo === null) window.localStorage.removeItem(CLE_PSEUDO)
    else window.localStorage.setItem(CLE_PSEUDO, pseudo)
  } catch {
    // Idem : sans persistance, la boutique fonctionne quand même.
  }
}

// L'URL des têtes vit dans lib/avatar.ts : elle sert aussi au classement.
// Réexportée ici pour ne pas casser les imports existants de la boutique.
export { urlAvatar } from '@/lib/avatar'
