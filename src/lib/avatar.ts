/**
 * Têtes de joueurs Minecraft, servies par mc-heads.net.
 * Le domaine est autorisé dans next.config.ts.
 */

const BASE = 'https://mc-heads.net/avatar/'

/** URL de la tête d'un joueur, à la taille demandée (en pixels). */
export function urlAvatar(pseudo: string, taille: number) {
  return `${BASE}${encodeURIComponent(pseudo)}/${taille}`
}
