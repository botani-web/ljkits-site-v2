import type { Locale } from '@/lib/i18n'

/**
 * LES TEXTES DES ÉVÉNEMENTS (24/10/2026). Même convention que i18n-s2.ts :
 * une clé, le français puis l'anglais, `{x}` remplacés par `te(locale, cle, { x })`.
 */
const TEXTES = {
  'meta.titre': { fr: 'Événements et tournois', en: 'Events and tournaments' },
  'meta.desc': {
    fr: 'Les tournois LJKITS : classements en direct, manches, kills et gagnants.',
    en: 'LJKITS tournaments: live leaderboards, rounds, kills and winners.',
  },
  'liste.titre': { fr: 'Événements', en: 'Events' },
  'liste.sous': {
    fr: 'Les tournois du serveur, avec le classement en direct et le détail de chaque manche.',
    en: 'Server tournaments, with the live leaderboard and every round in detail.',
  },
  'liste.vide': { fr: 'Aucun événement pour le moment. Rejoins le Discord pour être prévenu.', en: 'No events yet. Join the Discord to be notified.' },
  'liste.direct': { fr: 'En direct', en: 'Live' },
  'liste.avenir': { fr: 'À venir', en: 'Upcoming' },
  'liste.passes': { fr: 'Terminés', en: 'Past' },
  'statut.a-venir': { fr: 'À venir', en: 'Upcoming' },
  'statut.en-direct': { fr: 'En direct', en: 'Live' },
  'statut.termine': { fr: 'Terminé', en: 'Finished' },
  'carte.manches': { fr: '{n} manche(s)', en: '{n} round(s)' },
  'carte.joueurs': { fr: '{n} joueur(s)', en: '{n} player(s)' },
  'carte.gagnant': { fr: 'Gagnant', en: 'Winner' },
  'carte.leader': { fr: 'En tête', en: 'Leading' },
  'carte.voir': { fr: 'Voir le classement', en: 'See the leaderboard' },
  'jeu.hgrun': { fr: 'HG Run', en: 'HG Run' },

  'ev.retour': { fr: 'Tous les événements', en: 'All events' },
  'ev.cashprize': { fr: 'Cashprize', en: 'Cash prize' },
  'ev.direct-maj': { fr: 'Classement mis à jour en direct, moins d’une minute après chaque manche.', en: 'Leaderboard updated live, less than a minute after each round.' },
  'ev.avenir-texte': { fr: 'Le classement apparaîtra ici dès la fin de la première manche.', en: 'The leaderboard will show up here as soon as the first round ends.' },
  'ev.rejoindre': { fr: 'Pour jouer : mc.ljkits.eu, puis le menu Événements → HG Run.', en: 'To play: mc.ljkits.eu, then the Events menu → HG Run.' },
  'ev.manches': { fr: 'Manches', en: 'Rounds' },
  'ev.joueurs': { fr: 'Joueurs', en: 'Players' },
  'ev.kills': { fr: 'Kills', en: 'Kills' },
  'ev.mvp': { fr: 'MVP kills', en: 'Kill MVP' },
  'ev.podium': { fr: 'Podium', en: 'Podium' },
  'ev.podium-provisoire': { fr: 'Podium provisoire', en: 'Current podium' },
  'ev.pts': { fr: 'pts', en: 'pts' },
  'ev.victoires': { fr: '{n} victoire(s)', en: '{n} win(s)' },
  'ev.classement': { fr: 'Classement', en: 'Leaderboard' },
  'ev.classement-sous': { fr: 'Points cumulés sur toutes les manches.', en: 'Points added up over every round.' },
  'ev.col.joueur': { fr: 'Joueur', en: 'Player' },
  'ev.col.points': { fr: 'Points', en: 'Points' },
  'ev.col.v': { fr: 'V', en: 'W' },
  'ev.col.kills': { fr: 'Kills', en: 'Kills' },
  'ev.col.manches': { fr: 'Manches', en: 'Rounds' },
  'ev.col.meilleure': { fr: 'Meilleure', en: 'Best' },
  'ev.col.moyenne': { fr: 'Moyenne', en: 'Average' },
  'ev.col.detail': { fr: 'Manche par manche', en: 'Round by round' },
  'ev.col.place': { fr: 'Place', en: 'Place' },
  'ev.col.kit': { fr: 'Kit', en: 'Kit' },
  'ev.place': { fr: '{n}e', en: '#{n}' },
  'ev.premier': { fr: '1er', en: '1st' },
  'ev.chemin': { fr: 'Comment {p} a gagné', en: 'How {p} won' },
  'ev.chemin-direct': { fr: 'Le parcours de {p}, en tête', en: 'The run of {p}, leading' },
  'ev.manche': { fr: 'Manche {n}', en: 'Round {n}' },
  'ev.manche-ligne': { fr: '{place}, {kills} kill(s) · {kit}', en: '{place}, {kills} kill(s) · {kit}' },
  'ev.manches-titre': { fr: 'Les manches', en: 'The rounds' },
  'ev.manches-sous': { fr: 'Carte, durée, gagnant et placements de chaque manche.', en: 'Map, length, winner and placements of every round.' },
  'ev.gagnant-manche': { fr: 'Gagnant', en: 'Winner' },
  'ev.top-kills': { fr: 'Top kills', en: 'Top kills' },
  'ev.duree': { fr: 'Durée', en: 'Length' },
  'ev.carte': { fr: 'Carte', en: 'Map' },
  'ev.details': { fr: 'Voir les placements', en: 'See the placements' },
  'ev.bareme': { fr: 'Le barème', en: 'Scoring' },
  'ev.bareme-texte': {
    fr: 'Chaque manche : {places} points du 1er au {n}e, puis +{k} par kill. Égalité : le plus de kills, puis la meilleure place, puis la place à la dernière manche.',
    en: 'Every round: {places} points from 1st to #{n}, then +{k} per kill. Tie: most kills, then best place, then place in the last round.',
  },
  'ev.aucune-manche': { fr: 'Pas encore de manche terminée.', en: 'No round finished yet.' },
  'ev.sans-kit': { fr: 'sans kit', en: 'no kit' },
} satisfies Record<string, { fr: string; en: string }>

export type CleEvenement = keyof typeof TEXTES

export function te(locale: Locale, cle: CleEvenement, valeurs?: Record<string, string | number>): string {
  let texte: string = TEXTES[cle][locale]
  if (valeurs) for (const [k, v] of Object.entries(valeurs)) texte = texte.replaceAll(`{${k}}`, String(v))
  return texte
}

/** « samedi 24 octobre, 21:00 » à l'heure de Paris (le serveur Vercel est en UTC). */
export function dateEvenement(locale: Locale, iso: string, avecJour = true): string {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    timeZone: 'Europe/Paris',
    ...(avecJour ? { weekday: 'long', day: 'numeric', month: 'long' } : {}),
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function mmss(secondes: number): string {
  const m = Math.floor(secondes / 60)
  return `${m}:${String(secondes % 60).padStart(2, '0')}`
}

/** « Aucun » côté plugin = pas de kit. */
export function nomKit(locale: Locale, kit: string): string {
  return !kit || kit === 'Aucun' ? te(locale, 'ev.sans-kit') : kit
}

export function place(locale: Locale, n: number): string {
  return n === 1 ? te(locale, 'ev.premier') : te(locale, 'ev.place', { n })
}
