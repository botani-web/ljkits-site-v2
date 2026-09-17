import type { Locale } from '@/lib/i18n'

/**
 * CE QUE LE SERVEUR ET LE NAVIGATEUR PARTAGENT DU SUIVI PARTENAIRE.
 *
 * Aucun acces a la base ici : ce fichier est importe par des composants
 * client (le formulaire d'acces), et tout ce qui touche Prisma vit dans
 * `partenaire.ts`. Meme decoupage que practice-commun.ts / practice.ts.
 */

/** Les fenetres proposees par les onglets de la page. `tout` = depuis le debut. */
export const PERIODES = [7, 30, 90, 'tout'] as const
export type Periode = (typeof PERIODES)[number]

/** La periode par defaut : tout l'historique du partenaire. */
export const PERIODE_DEFAUT: Periode = 'tout'

export function estPeriode(valeur: string | null | undefined): valeur is `${Periode}` {
  return valeur === '7' || valeur === '30' || valeur === '90' || valeur === 'tout'
}

/** Le parametre d'URL `?periode=` vers la periode, avec repli sur le defaut. */
export function lirePeriode(valeur: string | null | undefined): Periode {
  if (!estPeriode(valeur)) return PERIODE_DEFAUT
  return valeur === 'tout' ? 'tout' : (Number(valeur) as Periode)
}

/** Le nombre de jours d'une periode, ou null pour « tout ». */
export function joursDePeriode(periode: Periode): number | null {
  return periode === 'tout' ? null : periode
}

/**
 * Combien de barres le graphique montre.
 *
 * Il suit la periode choisie, mais « tout » retomberait sur une frise de
 * plusieurs annees illisible : on s'en tient alors aux 30 derniers jours,
 * qui sont ce qui interesse un partenaire au lendemain d'un live.
 */
export function joursDuGraphique(periode: Periode): number {
  return periode === 'tout' ? 30 : periode
}

/** 9420 → « 2 h 37 » / « 2h 37m ». Le zero se dit « 0 ». */
export function formaterTempsJeu(secondes: number, locale: Locale): string {
  const total = Math.max(0, Math.round(secondes))
  if (total === 0) return '0'

  const heures = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)

  if (heures === 0) return locale === 'fr' ? `${minutes} min` : `${minutes}m`
  if (minutes === 0) return locale === 'fr' ? `${heures} h` : `${heures}h`
  return locale === 'fr' ? `${heures} h ${minutes}` : `${heures}h ${minutes}m`
}

/** La cle d'un jour (« 2026-09-17 ») dans le fuseau du serveur, Paris. */
export function cleJourParis(instant: Date): string {
  return instant.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
}

/** « 17 sept. » / « 17 Sep » — l'etiquette d'une barre du graphique. */
export function libelleJour(cle: string, locale: Locale): string {
  // Midi UTC : aucune bascule de fuseau ne peut faire changer de jour.
  const date = new Date(`${cle}T12:00:00Z`)
  return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Paris',
  })
}
