import type { CleTexte } from '@/lib/i18n'

/**
 * CE QUE LE SERVEUR ET LE NAVIGATEUR PARTAGENT DU RANKED PRACTICE.
 *
 * Aucun accès à la base ici : ce fichier est importé par des composants
 * client, et tout ce qui touche Prisma vit dans `practice.ts`. Le mélanger
 * ferait embarquer le client de base de données dans le JavaScript du site.
 */

/**
 * Les modes classés, dans l'ordre du menu en jeu. La couleur sert aux courbes et aux pastilles,
 * l'icône est la texture 1.8.9 de l'item du menu (public/items, cf. ladders.yml de LJPractice).
 *
 * SAISON 2 (16/10/2026) : huit modes ranked ; Boxing et Iron Soup ne sont plus classés
 * mais restent ici pour lire la saison 1. `saisons` dit dans quelles saisons le mode
 * était classé — c'est ce qui décide des onglets du classement.
 */
export const MODES = [
  { id: 'hg', nom: 'HG', couleur: '#e05b5b', icone: 'blocks-obsidian', saisons: [1, 2] },
  { id: 'digger', nom: 'Digger', couleur: '#c08a4a', icone: 'blocks-dragon_egg', saisons: [1, 2] },
  { id: 'caveuhc', nom: 'CaveUHC', couleur: '#9aa3ad', icone: 'blocks-stone', saisons: [2] },
  { id: 'uhc', nom: 'UHC', couleur: '#fdc003', icone: 'items-apple_golden', saisons: [2] },
  { id: 'builduhc', nom: 'BuildUHC', couleur: '#fe7a2f', icone: 'items-bucket_lava', saisons: [2] },
  { id: 'nodebuff', nom: 'NoDebuff', couleur: '#e05bb6', icone: 'items-potion_bottle_splash', saisons: [2] },
  { id: 'archer', nom: 'Archer', couleur: '#5be06b', icone: 'items-bow_standby', saisons: [2] },
  { id: 'skywars', nom: 'SkyWars', couleur: '#4fd6e0', icone: 'items-ender_pearl', saisons: [2] },
  { id: 'boxing', nom: 'Boxing', couleur: '#5b8dd9', icone: 'items-diamond_chestplate', saisons: [1] },
  { id: 'ironsoup', nom: 'Iron Soup', couleur: '#b98be0', icone: 'items-mushroom_stew', saisons: [1] },
] as const

/** Les modes classés d'une saison, dans l'ordre du menu. Une saison future reprend ceux de la dernière connue. */
export function modesDeSaison(saison: number) {
  const derniere = Math.max(...MODES.flatMap((m) => m.saisons))
  const n = Math.min(saison, derniere)
  return MODES.filter((m) => (m.saisons as readonly number[]).includes(n))
}

export type IdMode = (typeof MODES)[number]['id']
/** Ce qu'affiche un classement : le global, ou un mode. */
export type Vue = 'global' | IdMode

export type Resultat = 'V' | 'D'

export function estVue(valeur: string | null | undefined): valeur is Vue {
  return valeur === 'global' || MODES.some((m) => m.id === valeur)
}

export function infosMode(id: string): { id: string; nom: string; couleur: string; icone: string } {
  return MODES.find((m) => m.id === id) ?? { id, nom: id, couleur: '#9e93ac', icone: 'items-diamond_sword' }
}

/** Temps de jeu à la PvPRivals : « 1d 22h », « 20h 14m », « 35m », « 0s » (12/10/2026). */
export function formaterTempsJeu(secondes: number): string {
  const s = Math.max(0, Math.round(secondes))
  const j = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (j > 0) return `${j}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
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
const RAISONS = new Set(['tue', 'temps', 'boxing', 'abandon', 'deconnexion', 'sortie', 'sortie-haut', 'obsitrap'])

export function cleRaison(raison: string | null | undefined): CleTexte {
  return (raison && RAISONS.has(raison) ? `pr.raison.${raison}` : 'pr.raison.autre') as CleTexte
}

/** Pourquoi un match a été annulé, dans la langue de la page (05/10/2026). */
export function cleAnnulation(annule: string): CleTexte {
  return (annule === 'elo-boosting' ? 'pr.annule.elo-boosting' : 'pr.annule.autre') as CleTexte
}

/** Les PV du gagnant n'ont de sens que sur un kill, et jamais en boxing (les cœurs ne baissent pas). */
export function pvSignificatifs(mode: string, raison: string | null | undefined, pv: number | null | undefined): pv is number {
  return pv != null && raison === 'tue' && mode !== 'boxing'
}

/** Le lien vers le profil d'un joueur. */
export function cheminProfil(pseudo: string): string {
  return `/joueur/${encodeURIComponent(pseudo)}`
}

/** Le lien vers la page d'un match (05/10/2026), vu depuis le profil de ce joueur. */
export function cheminMatch(pseudo: string, id: string): string {
  return `${cheminProfil(pseudo)}/match/${id}`
}

/** L'adresse courte d'un match (16/10/2026) : la même page, sans passer par un profil. */
export function cheminMatchCourt(id: string): string {
  return `/match/${id}`
}

/** Le corps entier d'un joueur, rendu en 3/4 par mc-heads (image fixe, aucun JavaScript). */
export function urlCorps(pseudo: string, taille: number): string {
  return `https://mc-heads.net/body/${encodeURIComponent(pseudo)}/${taille}`
}

/** La tête d'un joueur (mc-heads), à la taille voulue. */
export function urlTete(pseudo: string, taille: number): string {
  return `https://mc-heads.net/avatar/${encodeURIComponent(pseudo)}/${taille}`
}
