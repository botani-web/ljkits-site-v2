import type { CleTexte } from '@/lib/i18n'

/**
 * CE QUE LE SERVEUR ET LE NAVIGATEUR PARTAGENT DU RANKED PRACTICE.
 *
 * Aucun accès à la base ici : ce fichier est importé par des composants
 * client, et tout ce qui touche Prisma vit dans `practice.ts`. Le mélanger
 * ferait embarquer le client de base de données dans le JavaScript du site.
 */

/** Les modes classés, dans l'ordre du menu en jeu. La couleur sert aux courbes et aux pastilles. */
export const MODES = [
  { id: 'hg', nom: 'HG', couleur: '#e05b5b' },
  { id: 'digger', nom: 'Digger', couleur: '#c08a4a' },
  { id: 'boxing', nom: 'Boxing', couleur: '#5b8dd9' },
  { id: 'ironsoup', nom: 'Iron Soup', couleur: '#b98be0' },
] as const

export type IdMode = (typeof MODES)[number]['id']
/** Ce qu'affiche un classement : le global, ou un mode. */
export type Vue = 'global' | IdMode

export type Resultat = 'V' | 'D'

export function estVue(valeur: string | null | undefined): valeur is Vue {
  return valeur === 'global' || MODES.some((m) => m.id === valeur)
}

export function infosMode(id: string): { id: string; nom: string; couleur: string } {
  return MODES.find((m) => m.id === id) ?? { id, nom: id, couleur: '#9e93ac' }
}

/** « 0:59 », « 12:04 ». */
export function formaterDuree(secondes: number): string {
  const s = Math.max(0, Math.round(secondes))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** « il y a 3 minutes », « hier »… dans la langue de la page. */
export function tempsRelatif(date: Date | string, locale: 'fr' | 'en', maintenant = Date.now()): string {
  const ecart = (new Date(date).getTime() - maintenant) / 1000
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const absolu = Math.abs(ecart)
  if (absolu < 60) return format.format(Math.round(ecart), 'second')
  if (absolu < 3600) return format.format(Math.round(ecart / 60), 'minute')
  if (absolu < 86400) return format.format(Math.round(ecart / 3600), 'hour')
  if (absolu < 86400 * 30) return format.format(Math.round(ecart / 86400), 'day')
  return format.format(Math.round(ecart / (86400 * 30)), 'month')
}

/** Les causes de fin connues de LJPractice (colonne `raison`). */
const RAISONS = new Set(['tue', 'temps', 'boxing', 'abandon', 'deconnexion', 'sortie', 'sortie-haut'])

export function cleRaison(raison: string | null | undefined): CleTexte {
  return (raison && RAISONS.has(raison) ? `pr.raison.${raison}` : 'pr.raison.autre') as CleTexte
}

/** Les PV du gagnant n'ont de sens que sur un kill, et jamais en boxing (les cœurs ne baissent pas). */
export function pvSignificatifs(mode: string, raison: string | null | undefined, pv: number | null | undefined): pv is number {
  return pv != null && raison === 'tue' && mode !== 'boxing'
}

/** Le lien vers le profil d'un joueur. */
export function cheminProfil(pseudo: string): string {
  return `/joueur/${encodeURIComponent(pseudo)}`
}

/** La tête d'un joueur (mc-heads), à la taille voulue. */
export function urlTete(pseudo: string, taille: number): string {
  return `https://mc-heads.net/avatar/${encodeURIComponent(pseudo)}/${taille}`
}
