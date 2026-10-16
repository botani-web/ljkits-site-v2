/**
 * LA PROMO DE LA BOUTIQUE (16/10/2026) — sans accès base, importable partout.
 *
 * ⚠ AFFICHAGE SEULEMENT. Le site montre le prix barré, le prix réduit, la bulle
 * de la barre et le bandeau. Ce qui est réellement payé est décidé par TEBEX : la
 * réduction doit y être créée (une « sale » sur les mêmes produits, aux mêmes
 * dates). Ni creerCommande ni le panier Tebex ne lisent ce fichier.
 */
export type RayonPromo = 'grades' | 'coins' | 'tout'

export type Promo = {
  active: boolean
  pourcentage: number
  rayon: RayonPromo
  /** Fin en ISO, ou null = jusqu'à ce qu'on la coupe. */
  fin: string | null
  bulle: string
  texte: string
  texteEn: string
}

export const PROMO_VIDE: Promo = { active: false, pourcentage: 0, rayon: 'grades', fin: null, bulle: '', texte: '', texteEn: '' }

/** La promo est-elle visible à cet instant ? (cochée, un pourcentage, pas encore finie) */
export function promoEnCours(p: Promo, maintenant = Date.now()): boolean {
  return p.active && p.pourcentage > 0 && p.pourcentage < 100 && (p.fin == null || Date.parse(p.fin) > maintenant)
}

/** Le pourcentage appliqué à un rayon, 0 s'il n'y en a pas. */
export function promoDuRayon(p: Promo, rayon: 'grades' | 'coins', maintenant = Date.now()): number {
  if (!promoEnCours(p, maintenant)) return 0
  return p.rayon === 'tout' || p.rayon === rayon ? p.pourcentage : 0
}

/** Le prix affiché après réduction, au centime. */
export function prixPromo(centimes: number, pourcentage: number): number {
  return pourcentage > 0 ? Math.round((centimes * (100 - pourcentage)) / 100) : centimes
}
