import { SITE } from '@/lib/site'

/**
 * LA SAISON RANKED ET SON CASHPRIZE, SANS ACCÈS BASE (22/09/2026).
 *
 * Importable côté navigateur : le compte à rebours de l'accueil en a besoin.
 *
 * Le calendrier est celui de LJElo (`Saisons.java`) : la saison 1 s'ouvre à
 * `SITE.ouverture` et chaque saison dure un mois, jusqu'à la même heure de
 * Paris le mois suivant. Le calcul se fait en heure de Paris et non en UTC :
 * sinon la clôture de novembre, qui tombe après le passage à l'heure d'hiver,
 * serait annoncée une heure trop tôt.
 */

/**
 * Le montant et sa répartition, saison par saison. À garder d'accord avec LJElo
 * `saison.cashprize` et LJPractice `leaderboard.cashprize`.
 * Saison 1 : 150€ (75/50/25). Saison 2 : 100€ (50/30/20, décidé le 11/10/2026).
 */
const CASHPRIZES: Record<number, { total: number; podium: readonly [number, number, number] }> = {
  1: { total: 150, podium: [75, 50, 25] },
  2: { total: 100, podium: [50, 30, 20] },
}

/** Le cashprize d'une saison ; une saison pas encore décrite reprend le dernier connu. */
export function cashprizeDe(saison: number): { total: number; podium: readonly [number, number, number] } {
  const connues = Object.keys(CASHPRIZES).map(Number)
  return CASHPRIZES[saison] ?? CASHPRIZES[Math.max(...connues)]
}

/** Le cashprize de la saison en cours (avis, accueil). */
export const CASHPRIZE = cashprizeDe(2)

/**
 * L'OUVERTURE PUBLIQUE d'une saison, quand elle diffère du calendrier de LJElo.
 *
 * La saison 2 existe en base depuis le 12/10 (clôture automatique de la 1), mais le
 * serveur n'ouvre aux joueurs que le samedi 17/10 à 14h30. Avant cette heure, le site
 * montre la saison 1 par défaut et un compte à rebours vers l'ouverture.
 */
export const OUVERTURES_PUBLIQUES: Record<number, string> = {
  2: '2026-10-17T14:30:00+02:00',
}

/** La saison affichée par défaut à cet instant : la plus récente dont l'ouverture publique est passée. */
export function saisonParDefaut(maintenant = Date.now()): number {
  let numero = saisonDu(maintenant).numero
  while (numero > 1 && OUVERTURES_PUBLIQUES[numero] && Date.parse(OUVERTURES_PUBLIQUES[numero]) > maintenant) numero--
  return numero
}

/** « 150€ » en français, « €150 » en anglais — comme en jeu. */
export function euros(montant: number, locale: 'fr' | 'en'): string {
  return locale === 'en' ? `€${montant}` : `${montant}€`
}

const FUSEAU = 'Europe/Paris'

/** L'écart entre l'heure de Paris et l'UTC à un instant donné, en millisecondes. */
function decalageParis(instant: number): number {
  const morceaux = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSEAU,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant))
  const valeur = (type: string) => Number(morceaux.find((m) => m.type === type)?.value)
  const commeUtc = Date.UTC(valeur('year'), valeur('month') - 1, valeur('day'), valeur('hour'), valeur('minute'), valeur('second'))
  return commeUtc - Math.floor(instant / 1000) * 1000
}

/** Une heure de Paris (le mois peut déborder : 13 = janvier suivant) → l'instant UTC. */
function heureDeParis(annee: number, mois: number, jour: number, heure: number, minute: number): number {
  const approche = Date.UTC(annee, mois, jour, heure, minute)
  // Deux passes : la première peut tomber du mauvais côté d'un changement d'heure.
  const premier = approche - decalageParis(approche)
  return approche - decalageParis(premier)
}

/** L'heure d'ouverture de la saison 1, lue telle qu'écrite dans SITE.ouverture (heure de Paris). */
const [, A, M, J, H, MIN] = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(SITE.ouverture)!.map(Number)

function debut(numero: number): number {
  return heureDeParis(A, M - 1 + (numero - 1), J, H, MIN)
}

export type Saison = { numero: number; debut: Date; fin: Date }

/** La saison en cours à cet instant. Avant la toute première, c'est la saison 1. */
export function saisonDu(maintenant = Date.now()): Saison {
  let numero = 1
  while (numero < 1200 && maintenant >= debut(numero + 1)) numero++
  return { numero, debut: new Date(debut(numero)), fin: new Date(debut(numero + 1)) }
}
