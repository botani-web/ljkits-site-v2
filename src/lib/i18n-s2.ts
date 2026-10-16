import type { Locale } from '@/lib/i18n'

/**
 * LES TEXTES DE LA REFONTE SAISON 2 (16/10/2026).
 *
 * Même convention que le dictionnaire de i18n.ts — une clé, le français puis
 * l'anglais — mais dans son propre fichier : accueil, classements, profils et
 * matchs ont été réécrits d'un bloc, leurs textes se relisent ensemble ici.
 * Les `{x}` sont remplacés par `ts(locale, cle, { x: … })`.
 */
const TEXTES = {
  /* ---------- navigation ---------- */
  'nav.classements': { fr: 'Classements', en: 'Leaderboards' },
  'nav.matchs': { fr: 'Matchs', en: 'Matches' },
  'nav.boutique': { fr: 'Boutique', en: 'Store' },
  'nav.reglement': { fr: 'Règlement', en: 'Rules' },
  'nav.jouer': { fr: 'Jouer', en: 'Play' },
  'nav.en-ligne': { fr: '{n} en ligne', en: '{n} online' },
  'nav.hors-ligne': { fr: 'Serveur hors ligne', en: 'Server offline' },
  'nav.copier': { fr: "Cliquer pour copier l'IP", en: 'Click to copy the IP' },
  'nav.copiee': { fr: 'IP copiée !', en: 'IP copied!' },
  'nav.menu': { fr: 'Menu', en: 'Menu' },
  'recherche.placeholder': { fr: 'Chercher un joueur…', en: 'Search a player…' },
  'recherche.aria': { fr: 'Chercher le profil d’un joueur', en: 'Search for a player profile' },
  'recherche.aucun': { fr: 'Aucun joueur classé à ce nom', en: 'No ranked player with that name' },
  'recherche.ouvrir': { fr: 'Ouvrir le profil « {q} »', en: 'Open the profile "{q}"' },
  'recherche.saison': { fr: 'Saison {n}', en: 'Season {n}' },

  /* ---------- pied de page ---------- */
  'pied.baseline': {
    fr: 'Le practice compétitif sur 1.7 et 1.8. Un Elo par mode, un cashprize chaque saison, zéro pay-to-win.',
    en: 'Competitive practice on 1.7 and 1.8. One Elo per mode, a cashprize every season, zero pay-to-win.',
  },
  'pied.jeu': { fr: 'Jeu', en: 'Game' },
  'pied.communaute': { fr: 'Communauté', en: 'Community' },
  'pied.serveur': { fr: 'Serveur', en: 'Server' },
  'pied.avis': { fr: 'Donner ton avis', en: 'Give feedback' },
  'pied.suggestions': { fr: 'Suggestions', en: 'Suggestions' },
  'pied.recrutement': { fr: 'Recrutement staff', en: 'Staff applications' },
  'pied.ljscan': { fr: 'Outil de screenshare', en: 'Screenshare tool' },
  'pied.versions': { fr: 'Java 1.7 & 1.8', en: 'Java 1.7 & 1.8' },

  /* ---------- commun ---------- */
  'c.saison': { fr: 'Saison {n}', en: 'Season {n}' },
  'c.saison-courte': { fr: 'S{n}', en: 'S{n}' },
  'c.en-cours': { fr: 'en cours', en: 'live' },
  'c.terminee': { fr: 'terminée', en: 'ended' },
  'c.global': { fr: 'Global', en: 'Global' },
  'c.elo': { fr: 'Elo', en: 'Elo' },
  'c.victoires': { fr: 'Victoires', en: 'Wins' },
  'c.defaites': { fr: 'Défaites', en: 'Losses' },
  'c.v': { fr: 'V', en: 'W' },
  'c.d': { fr: 'D', en: 'L' },
  'c.winrate': { fr: 'Winrate', en: 'Win rate' },
  'c.matchs': { fr: 'Matchs', en: 'Matches' },
  'c.serie': { fr: 'Série', en: 'Streak' },
  'c.meilleure-serie': { fr: 'Meilleure série', en: 'Best streak' },
  'c.pic': { fr: 'Pic', en: 'Peak' },
  'c.forme': { fr: 'Forme', en: 'Form' },
  'c.joueur': { fr: 'Joueur', en: 'Player' },
  'c.rang': { fr: 'Rang', en: 'Rank' },
  'c.mode': { fr: 'Mode', en: 'Mode' },
  'c.place-libre': { fr: 'Place à prendre', en: 'Up for grabs' },
  'c.voir-tout': { fr: 'Tout voir', en: 'View all' },
  'c.non-classe': { fr: 'Non classé', en: 'Unranked' },
  'c.annule': { fr: 'Annulé', en: 'Voided' },
  'c.secondes': { fr: '{n} s', en: '{n}s' },
  'c.vs': { fr: 'VS', en: 'VS' },
  'c.ranked': { fr: 'Ranked', en: 'Ranked' },

  /* ---------- accueil ---------- */
  'a.meta-titre': { fr: 'LJKITS — Practice compétitif 1.7 / 1.8', en: 'LJKITS — Competitive Practice 1.7 / 1.8' },
  'a.meta-desc': {
    fr: 'Serveur practice 1v1 sur Minecraft 1.7 et 1.8 : 8 modes classés, un Elo par mode, {c} de cashprize chaque saison.',
    en: 'Minecraft 1.7 & 1.8 practice server: 8 ranked modes, one Elo per mode, {c} cashprize every season.',
  },
  'a.kicker-ouverture': { fr: 'Saison {n} · ouverture le {d}', en: 'Season {n} · opens {d}' },
  'a.kicker-live': { fr: 'Saison {n} en cours', en: 'Season {n} is live' },
  'a.titre-1': { fr: 'Practice', en: 'Competitive' },
  'a.titre-2': { fr: 'compétitif.', en: 'practice.' },
  'a.chapeau': {
    fr: 'Du 1v1 classé sur 1.7 et 1.8. Huit modes, un Elo par mode, et {c} pour le top 3 de chaque saison.',
    en: 'Ranked 1v1 on 1.7 and 1.8. Eight modes, one Elo per mode, and {c} for the top 3 every season.',
  },
  'a.en-ligne': { fr: 'en ligne', en: 'online' },
  'a.rejoindre-discord': { fr: 'Rejoindre le Discord', en: 'Join the Discord' },
  'a.cagnotte': { fr: 'Cashprize de la saison {n}', en: 'Season {n} cashprize' },
  'a.cagnotte-fin': { fr: 'Clôture dans', en: 'Ends in' },
  'a.cagnotte-ouvre': { fr: 'Ouverture dans', en: 'Opens in' },
  'a.cagnotte-note': {
    fr: 'Classement global = moyenne de tes modes. Compte Discord lié obligatoire.',
    en: 'Global ranking = average of your modes. Linked Discord account required.',
  },
  'a.modes-titre': { fr: 'Les modes classés', en: 'Ranked modes' },
  'a.modes-sous': {
    fr: 'Même kit pour tout le monde, adversaire à ±100 Elo. Clique un mode pour son classement.',
    en: 'Same kit for everyone, opponents within ±100 Elo. Pick a mode to see its leaderboard.',
  },
  'a.mode-classes': { fr: '{n} classés', en: '{n} ranked' },
  'a.mode-leader': { fr: 'N°1', en: '#1' },
  'a.mode-vide': { fr: 'Personne encore', en: 'Nobody yet' },
  'a.derniers-matchs': { fr: 'Derniers matchs', en: 'Latest matches' },
  'a.top-global': { fr: 'Top global', en: 'Global top' },
  'a.temple': { fr: 'Champions de la saison {n}', en: 'Season {n} champions' },
  'a.temple-sous': { fr: 'Le podium final, figé à la clôture.', en: 'The final podium, frozen at closing.' },
  'a.pourquoi': { fr: 'Pourquoi LJKITS', en: 'Why LJKITS' },
  'a.f1-titre': { fr: '1.7 et 1.8', en: '1.7 and 1.8' },
  'a.f1-texte': {
    fr: 'Les deux versions du PvP sur le même serveur, avec un combat retravaillé pour être fluide.',
    en: 'Both PvP versions on the same server, with combat reworked to feel smooth.',
  },
  'a.f2-titre': { fr: 'Un ranked propre', en: 'Fair ranked' },
  'a.f2-texte': {
    fr: 'Kits identiques, matchmaking serré, anti-boost et un seul compte classé par joueur.',
    en: 'Identical kits, tight matchmaking, anti-boosting and one ranked account per player.',
  },
  'a.f3-titre': { fr: 'Chaque match rejouable', en: 'Every match replayable' },
  'a.f3-texte': {
    fr: 'Tous les matchs sont enregistrés : revois-les en jeu avec /matchs, et lis leur récap ici.',
    en: 'Every match is recorded: watch it again in game with /matchs, read its recap here.',
  },
  'a.f4-titre': { fr: 'Et à côté', en: 'And more' },
  'a.f4-texte': {
    fr: 'HG Run 24h/24, tournois HG avec cashprize, Fight Bots pour s’entraîner, FFA soupe.',
    en: 'HG Run 24/7, HG tournaments with cashprize, Fight Bots to train, soup FFA.',
  },
  'a.final-titre': { fr: 'Ton nom en haut du classement ?', en: 'Your name at the top?' },
  'a.final-texte': {
    fr: 'Connecte-toi, lie ton Discord en jeu avec /discord, et lance ta première file ranked.',
    en: 'Join, link your Discord in game with /discord, and queue your first ranked match.',
  },

  /* ---------- classements ---------- */
  'l.meta-titre': { fr: 'Classement {v} · Saison {n}', en: '{v} leaderboard · Season {n}' },
  'l.meta-desc': {
    fr: 'Le classement ranked {v} de LJKITS, saison {n} : Elo, victoires, winrate et séries.',
    en: 'LJKITS {v} ranked leaderboard, season {n}: Elo, wins, win rate and streaks.',
  },
  'l.titre': { fr: 'Classements', en: 'Leaderboards' },
  'l.sous-live': {
    fr: 'Mis à jour toutes les 30 secondes. Le top 3 du global se partage {c} à la clôture.',
    en: 'Updated every 30 seconds. The global top 3 shares {c} at closing.',
  },
  'l.sous-fini': {
    fr: 'Classement final de la saison {n}, figé à sa clôture.',
    en: 'Final standings of season {n}, frozen at closing.',
  },
  'l.joueurs': { fr: '{n} joueurs classés', en: '{n} ranked players' },
  'l.vide-titre': { fr: 'Le classement est vide', en: 'No one is ranked yet' },
  'l.vide-texte': {
    fr: 'Joue un match ranked dans ce mode pour y apparaître le premier.',
    en: 'Play a ranked match in this mode to be the first one on the board.',
  },
  'l.vide-avant': {
    fr: 'La saison {n} ouvre le {d}. En attendant, le classement de la saison {p} reste consultable.',
    en: 'Season {n} opens on {d}. Meanwhile, season {p} standings are still here.',
  },
  'l.voir-saison': { fr: 'Voir la saison {n}', en: 'See season {n}' },
  'l.prix': { fr: 'Prix', en: 'Prize' },
  'l.modes-joues': { fr: 'Modes', en: 'Modes' },

  /* ---------- profil ---------- */
  'p.meta-titre': { fr: '{p} · Profil', en: '{p} · Profile' },
  'p.meta-desc': {
    fr: 'Profil de {p} sur LJKITS : Elo par mode, historique des matchs, records et rivaux.',
    en: '{p} on LJKITS: Elo per mode, match history, records and rivals.',
  },
  'p.en-ligne': { fr: 'En ligne', en: 'Online' },
  'p.vu': { fr: 'Vu {t}', en: 'Seen {t}' },
  'p.jamais-vu': { fr: 'Jamais connecté', en: 'Never joined' },
  'p.premiere-venue': { fr: 'Arrivé le', en: 'Joined' },
  'p.temps-jeu': { fr: 'Temps de jeu', en: 'Playtime' },
  'p.discord-lie': { fr: 'Discord lié', en: 'Discord linked' },
  'p.exclu': { fr: 'Exclu du classement', en: 'Excluded from the leaderboard' },
  'p.rang-global': { fr: '#{r} au global', en: '#{r} global' },
  'p.elo-global': { fr: 'Elo global', en: 'Global Elo' },
  'p.temps-ranked': { fr: 'En ranked', en: 'In ranked' },
  'p.modes': { fr: 'Par mode', en: 'By mode' },
  'p.rang-mode': { fr: '#{r} sur {t}', en: '#{r} of {t}' },
  'p.progression': { fr: 'Progression', en: 'Elo progression' },
  'p.historique': { fr: 'Historique des matchs', en: 'Match history' },
  'p.historique-vide': { fr: 'Aucun match ranked cette saison.', en: 'No ranked match this season.' },
  'p.voir-plus': { fr: 'Afficher {n} matchs de plus', en: 'Show {n} more matches' },
  'p.records': { fr: 'Records', en: 'Records' },
  'p.plus-rapide': { fr: 'Victoire la plus rapide', en: 'Fastest win' },
  'p.plus-gros-gain': { fr: 'Plus gros gain', en: 'Biggest gain' },
  'p.plus-grosse-perte': { fr: 'Plus grosse perte', en: 'Biggest loss' },
  'p.duree-moyenne': { fr: 'Durée moyenne', en: 'Average length' },
  'p.clutchs': { fr: 'Clutchs (≤ 3 cœurs)', en: 'Clutches (≤ 3 hearts)' },
  'p.parfaites': { fr: 'Victoires à pleine vie', en: 'Full-health wins' },
  'p.contre': { fr: 'contre {p}', en: 'vs {p}' },
  'p.mode-favori': { fr: 'Mode favori', en: 'Favourite mode' },
  'p.il-y-a-14': { fr: 'il y a 14 j', en: '14 days ago' },
  'p.aujourdhui': { fr: 'aujourd’hui', en: 'today' },
  'p.rivaux': { fr: 'Rivaux', en: 'Rivals' },
  'p.nemesis': { fr: 'Némésis', en: 'Nemesis' },
  'p.victime': { fr: 'Victime préférée', en: 'Favourite victim' },
  'p.face-a-face': { fr: 'Face-à-face', en: 'Head-to-head' },
  'p.activite': { fr: '14 derniers jours', en: 'Last 14 days' },
  'p.activite-aria': { fr: '{n} matchs le {d}', en: '{n} matches on {d}' },
  'p.aucune-saison': {
    fr: '{p} n’a pas encore joué de ranked. Sa fiche se remplira dès son premier match.',
    en: '{p} hasn’t played ranked yet. This profile fills up after the first match.',
  },
  'p.autre-saison': {
    fr: 'Pas de ranked en saison {n}. Voir la saison {m} ?',
    en: 'No ranked in season {n}. See season {m}?',
  },
  'p.archive': { fr: 'Archives de la saison {n}', en: 'Season {n} archive' },
  'p.archive-ffa': { fr: 'FFA', en: 'FFA' },
  'p.archive-kills': { fr: '{k} kills · {m} morts', en: '{k} kills · {m} deaths' },
  'p.archive-unranked': { fr: 'Unranked', en: 'Unranked' },
  'p.introuvable': { fr: 'Joueur introuvable', en: 'Player not found' },

  /* ---------- match ---------- */
  'm.meta-titre': { fr: '{g} vs {p} · {m}', en: '{g} vs {p} · {m}' },
  'm.meta-desc': {
    fr: 'Récap du match ranked {m} : Elo, coups, combos, soupes et inventaires de fin.',
    en: 'Ranked {m} match recap: Elo, hits, combos, soups and final inventories.',
  },
  'm.match': { fr: 'Match #{id}', en: 'Match #{id}' },
  'm.vainqueur': { fr: 'Vainqueur', en: 'Winner' },
  'm.perdant': { fr: 'Perdant', en: 'Defeated' },
  'm.duree': { fr: 'Durée', en: 'Duration' },
  'm.carte': { fr: 'Carte', en: 'Map' },
  'm.date': { fr: 'Date', en: 'Date' },
  'm.fin': { fr: 'Fin', en: 'Ended by' },
  'm.stats': { fr: 'Statistiques', en: 'Statistics' },
  'm.coups': { fr: 'Coups portés', en: 'Hits landed' },
  'm.coups-s': { fr: 'Coups / seconde', en: 'Hits / second' },
  'm.combo': { fr: 'Plus long combo', en: 'Longest combo' },
  'm.soupes': { fr: 'Soupes bues', en: 'Soups used' },
  'm.vie': { fr: 'Vie restante', en: 'Health left' },
  'm.non-mesure': {
    fr: 'Ce match date d’avant l’enregistrement des statistiques détaillées (5 octobre).',
    en: 'This match predates detailed statistics (October 5).',
  },
  'm.inventaires': { fr: 'Inventaires de fin', en: 'Final inventories' },
  'm.annule': {
    fr: 'Match annulé par le staff ({r}) : son Elo a été rendu.',
    en: 'Match voided by staff ({r}): its Elo was refunded.',
  },
  'm.historique-duo': { fr: 'Entre eux cette saison', en: 'Between them this season' },
  'm.duo': { fr: '{a} {va} – {vb} {b}', en: '{a} {va} – {vb} {b}' },
  'm.autres': { fr: 'Les autres matchs de {p}', en: 'More matches from {p}' },
  'm.replay': {
    fr: 'Revois ce match en jeu : /matchs {p}',
    en: 'Watch this match in game: /matchs {p}',
  },

  /* ---------- flux des matchs ---------- */
  'f.meta-titre': { fr: 'Derniers matchs ranked', en: 'Latest ranked matches' },
  'f.meta-desc': {
    fr: 'Les derniers matchs ranked joués sur LJKITS, mode par mode, avec leur récap.',
    en: 'The latest ranked matches played on LJKITS, mode by mode, with their recap.',
  },
  'f.titre': { fr: 'Matchs', en: 'Matches' },
  'f.sous': {
    fr: 'Les {n} derniers matchs ranked. Clique un match pour son récap complet.',
    en: 'The last {n} ranked matches. Click one for its full recap.',
  },
  'f.tous': { fr: 'Tous', en: 'All' },
  'f.vide': { fr: 'Aucun match pour l’instant.', en: 'No match yet.' },
} satisfies Record<string, { fr: string; en: string }>

export type CleS2 = keyof typeof TEXTES

export function ts(locale: Locale, cle: CleS2, valeurs?: Record<string, string | number>): string {
  let texte: string = TEXTES[cle][locale]
  if (valeurs) for (const [k, v] of Object.entries(valeurs)) texte = texte.replaceAll(`{${k}}`, String(v))
  return texte
}
