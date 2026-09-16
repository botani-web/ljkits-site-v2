/**
 * Le bilinguisme du site public.
 *
 * ================================================================
 *  L'ANGLAIS EST LA LANGUE PAR DÉFAUT
 * ================================================================
 * `/` redirige vers `/en`. Un visiteur sans préférence lit l'anglais —
 * décision assumée : le serveur s'ouvre à un public international, et le
 * MOTD en jeu dit déjà « OPENING SOON ».
 *
 * ================================================================
 *  DEUX SOURCES DE TEXTE, DEUX MÉCANISMES
 * ================================================================
 *   1. L'INTERFACE (boutons, titres, libellés) vit dans le dictionnaire
 *      ci-dessous : `t(locale, 'cle')`.
 *   2. LE CONTENU ÉDITORIAL (kits, règlement, grades…) vit en base, dans
 *      des colonnes jumelles `...En` : `champ(locale, fr, en)`.
 *
 * Dans les deux cas, l'anglais manquant retombe sur le français. Le site
 * ne peut donc pas afficher de trou, au pire une phrase non traduite.
 * C'est la même convention que les fichiers `lang/*.yml` des plugins.
 *
 * ================================================================
 *  L'ADMIN RESTE EN FRANÇAIS
 * ================================================================
 * `/admin` n'est pas sous `[locale]` : le staff est francophone, et
 * traduire l'administration coûterait plus que ça ne rapporte.
 */

export const LANGUES = ['en', 'fr'] as const
export type Locale = (typeof LANGUES)[number]

export const LANGUE_DEFAUT: Locale = 'en'

export function estLocale(valeur: string | undefined): valeur is Locale {
  return valeur === 'en' || valeur === 'fr'
}

/**
 * Un lien interne, préfixé par la langue.
 *
 * `lien('fr', '/kits')` → `/fr/kits`. Passer par cette fonction plutôt que
 * d'écrire le préfixe à la main est ce qui garantit qu'un clic ne fait
 * jamais changer de langue au milieu d'une visite.
 */
export function lien(locale: Locale, chemin: string): string {
  const propre = chemin === '/' ? '' : chemin
  return `/${locale}${propre}` || '/'
}

/**
 * Le bon champ selon la langue.
 *
 * L'anglais vide ou absent retombe sur le français : une traduction qui
 * manque doit se voir comme une phrase française, pas comme un blanc.
 */
export function champ(locale: Locale, fr: string, en: string | null | undefined): string {
  if (locale === 'fr') return fr
  return en && en.trim() !== '' ? en : fr
}

/** Même chose pour un champ facultatif des deux côtés. */
export function champOptionnel(
  locale: Locale,
  fr: string | null | undefined,
  en: string | null | undefined,
): string | null {
  if (locale === 'fr') return fr ?? null
  return (en && en.trim() !== '' ? en : fr) ?? null
}

/* ================================================================
 *  LE DICTIONNAIRE DE L'INTERFACE
 *
 *  Une clé par texte, le français d'abord — c'est lui qui existait, et
 *  c'est lui qu'on relit pour vérifier une traduction.
 * ================================================================ */

type Entree = { fr: string; en: string }

const DICO = {
  /* ---------- navigation et pied de page ---------- */
  'nav.kits': { fr: 'Kits', en: 'Kits' },
  'nav.classement': { fr: 'Classement', en: 'Leaderboard' },
  'nav.boutique': { fr: 'Boutique', en: 'Shop' },
  'nav.reglement': { fr: 'Règlement', en: 'Rules' },
  'nav.recrutement': { fr: 'Recrutement', en: 'Staff' },
  'nav.jouer': { fr: 'Jouer', en: 'Play' },
  'nav.menu': { fr: 'Menu', en: 'Menu' },
  'nav.fermer': { fr: 'Fermer', en: 'Close' },
  'nav.langue': { fr: 'English', en: 'Français' },
  'nav.langue-aria': { fr: 'Switch to English', en: 'Passer en français' },

  'pied.baseline': {
    fr: 'Le PvP Soup compétitif. Un projet passion, sans pay-to-win, porté par la nostalgie du soup français de 2014.',
    en: 'Competitive soup PvP. A passion project, no pay-to-win, born from nostalgia for the French soup scene of 2014.',
  },
  'pied.colonne.serveur': { fr: 'Serveur', en: 'Server' },
  'pied.colonne.communaute': { fr: 'Communauté', en: 'Community' },
  'pied.colonne.jouer': { fr: 'Jouer', en: 'Play' },
  'pied.les-kits': { fr: 'Les kits', en: 'The kits' },
  'pied.versions': { fr: 'Java 1.8 uniquement', en: 'Java 1.8 only' },
  'pied.hommage': {
    fr: 'Hommage indépendant, sans lien avec les anciens administrateurs de MJKits.',
    en: 'An independent tribute, unaffiliated with the former MJKits administrators.',
  },
  'pied.mojang': {
    fr: 'Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.',
    en: 'Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.',
  },

  /* ---------- éléments partagés ---------- */
  'commun.copier-ip': { fr: "Copier l'IP", en: 'Copy the IP' },
  'commun.copie': { fr: 'Copié !', en: 'Copied!' },
  'commun.en-ligne': { fr: 'en ligne', en: 'online' },
  'commun.hors-ligne': { fr: 'hors ligne', en: 'offline' },
  'commun.joueurs': { fr: 'joueurs', en: 'players' },
  'commun.retour': { fr: 'Retour', en: 'Back' },
  'commun.voir-tout': { fr: 'Voir tout', en: 'See all' },
  'commun.chargement': { fr: 'Chargement…', en: 'Loading…' },

  /* ---------- accueil ---------- */
  'accueil.un-classement': { fr: 'Un classement', en: 'A leaderboard' },
  'accueil.competition-long': {
    fr: 'Tout le monde démarre à 1000 Elo. Tu en gagnes en battant plus fort que toi, tu en perds en tombant contre plus faible — et un compte Discord lié est obligatoire pour figurer au tableau. La saison dure un mois, puis tout repart à zéro avec un cashprize à la clé.',
    en: 'Everyone starts at 1000 Elo. You gain by beating stronger players, you lose by falling to weaker ones — and a linked Discord account is required to appear on the board. A season lasts a month, then everything resets with a cashprize at stake.',
  },
  'accueil.cherche-pseudo': {
    fr: 'Cherche ton pseudo sur la page classement',
    en: 'Search your name on the leaderboard page',
  },
  'accueil.joueurs-en-ligne': { fr: 'Joueurs en ligne', en: 'Players online' },
  'accueil.copie-adresse': {
    fr: 'Copie l’adresse et sors du spawn.',
    en: 'Copy the address and leave spawn.',
  },
  'kits.coins-chapeau': {
    fr: 'Aucun kit ne se paie obligatoirement. Voici tout ce qui rapporte des coins, sans sortir la carte bleue.',
    en: 'No kit has to be paid for. Here is everything that earns coins, without reaching for a card.',
  },
  'kits.rien-debourser': { fr: 'Rien à débourser pour commencer', en: 'Nothing to pay to start' },
  'kits.premier-gratuit-1': { fr: 'Le premier kit est', en: 'The first kit is' },
  'kits.premier-gratuit-2': { fr: 'gratuit', en: 'free' },
  'kits.premier-chapeau': {
    fr: 'Connecte-toi, prends le PvP, vise le suivant. Un quart d’heure suffit pour le débloquer.',
    en: 'Log in, take the PvP kit, aim for the next one. Fifteen minutes is enough to unlock it.',
  },
  'coins.kill': { fr: 'Par kill', en: 'Per kill' },
  'coins.kill-t': {
    fr: 'Le gain dépend de la série de ta cible : plus elle enchaînait, plus elle vaut cher.',
    en: 'The gain depends on your target’s streak: the longer it was, the more they are worth.',
  },
  'coins.dix': { fr: 'Tous les 10 kills', en: 'Every 10 kills' },
  'coins.dix-t': {
    fr: 'Un palier de session qui tombe tout seul, en plus des gains de chaque kill.',
    en: 'A session milestone that lands on its own, on top of each kill.',
  },
  'coins.koth': { fr: 'Le KOTH', en: 'The KOTH' },
  'coins.koth-t': {
    fr: 'Tiens la zone assez longtemps sans te faire déloger et la récompense est à toi.',
    en: 'Hold the zone long enough without being pushed out and the reward is yours.',
  },
  'coins.totem': { fr: 'Le Totem', en: 'The Totem' },
  'coins.totem-t': {
    fr: 'La cagnotte de l’événement, répartie entre les joueurs qui l’ont fait tomber.',
    en: 'The event pot, shared between the players who brought it down.',
  },
  'coins.discord': { fr: 'Lier son Discord', en: 'Link your Discord' },
  'coins.discord-t': {
    fr: 'Une seule fois : /discord en jeu, puis le code dans le salon de vérification.',
    en: 'Once only: /discord in game, then the code in the verification channel.',
  },
  'accueil.h1-1': { fr: 'Serveur Minecraft', en: 'Minecraft server' },
  'accueil.h1-2': { fr: 'PvP Soup', en: 'Soup PvP' },
  'accueil.h1-3': { fr: 'en', en: 'in' },
  'accueil.chapo-1': {
    fr: 'Aucun cooldown d’attaque, aucune armure, et un bol de soupe pour se soigner.',
    en: 'No attack cooldown, no armour, and a bowl of soup to heal.',
  },
  'accueil.chapo-kits': { fr: 'kits', en: 'kits' },
  'accueil.chapo-2': { fr: 'à débloquer en jouant, une', en: 'to unlock by playing, a' },
  // Il était écrit « classement remis à zéro chaque lundi » : c'était
  // l'ancien classement hebdomadaire. Le classement est une saison Elo d'un
  // mois, ouverte le 11/09/2026 à 18h00.
  'accueil.chapo-classement': {
    fr: 'saison classée d’un mois avec cashprize',
    en: 'one-month ranked season with a cashprize',
  },
  'accueil.chapo-3': { fr: ', et zéro pay to win.', en: ', and zero pay-to-win.' },
  'accueil.piliers-etiquette': { fr: 'Ce qui t’attend', en: 'What awaits you' },
  'accueil.piliers-titre-1': { fr: 'Trois raisons de', en: 'Three reasons to' },
  'accueil.piliers-titre-2': { fr: 'rester', en: 'stay' },
  'accueil.pilier-kits-lien': { fr: 'Voir les kits', en: 'See the kits' },
  'accueil.pilier-kits-texte': {
    fr: 'Du Kangaroo au Kitsune. Tous débloquables en jouant, aucun réservé à la boutique.',
    en: 'From Kangaroo to Kitsune. All unlockable by playing, none reserved for the shop.',
  },
  'accueil.pilier-elo-titre': { fr: 'Elo de départ', en: 'Starting Elo' },
  'accueil.pilier-elo-lien': { fr: 'Voir le classement', en: 'See the leaderboard' },
  'accueil.pilier-elo-texte': {
    fr: 'Tout le monde part au même point. La saison dure un mois et se termine par un cashprize.',
    en: 'Everyone starts from the same point. A season lasts a month and ends with a cashprize.',
  },
  'accueil.pilier-p2w-lien': { fr: 'Voir la boutique', en: 'See the shop' },
  'accueil.pilier-p2w-texte': {
    fr: 'Rien de ce qui se vend ne se gagne à ta place. Ni dégâts, ni stuff, ni coins.',
    en: 'Nothing on sale wins for you. No damage, no gear, no coins.',
  },
  'accueil.competition': { fr: 'Compétition', en: 'Competition' },
  'accueil.competition-titre-2': { fr: 'mérite', en: 'earned' },
  'accueil.competition-texte': {
    fr: 'Tout le monde démarre à 1000 Elo. Tu en gagnes en battant plus fort que toi, tu en perds en tombant contre plus faible — et un compte Discord lié',
    en: 'Everyone starts at 1000 Elo. You gain by beating stronger players, you lose by falling to weaker ones — and a linked Discord account',
  },
  'accueil.final-1': { fr: 'Le bol est', en: 'The bowl is' },
  'accueil.final-2': { fr: 'plein', en: 'full' },
  'accueil.final-ip': {
    fr: 'Clique pour copier · Minecraft Java 1.8 uniquement',
    en: 'Click to copy · Minecraft Java 1.8 only',
  },
  'accueil.regle.cooldown': {
    fr: 'Tu cliques, ça touche. Le combat 1.8 intégral.',
    en: 'You click, it lands. Full 1.8 combat.',
  },
  'accueil.regle.armure': {
    fr: 'Cinq cœurs, pour tout le monde, sans exception.',
    en: 'Five hearts, for everyone, no exception.',
  },
  'accueil.regle.clic-droit': {
    fr: 'La soupe soigne. Gérer son stock fait partie du duel.',
    en: 'Soup heals. Managing your stack is part of the duel.',
  },
  'accueil.regle.knockback': {
    fr: 'Le recul d’époque, réglé à la main. Le combo repart.',
    en: 'Period-accurate knockback, tuned by hand. The combo is back.',
  },

  /* ---------- page kits ---------- */
  'kits.titre': { fr: 'Les kits', en: 'The kits' },
  'kits.meta-titre': { fr: 'Les kits', en: 'The kits' },
  'kits.intro': {
    fr: 'Chaque kit change une règle du combat. Aucun ne s’achète en euros pour être plus fort : tout se débloque en jouant.',
    en: 'Every kit changes one rule of the fight. None of them buys you strength: everything unlocks by playing.',
  },
  'kits.filtre.tous': { fr: 'Tous', en: 'All' },
  'kits.filtre.gratuits': { fr: 'Gratuits', en: 'Free' },
  'kits.filtre.debloquer': { fr: 'À débloquer', en: 'To unlock' },
  'kits.filtre.exclusifs': { fr: 'Exclusifs', en: 'Exclusive' },
  'kits.tri.prix': { fr: 'Tri : prix croissant', en: 'Sort: price ascending' },
  'kits.tri.prix-desc': { fr: 'Tri : prix décroissant', en: 'Sort: price descending' },
  'kits.tri.nom': { fr: 'Tri : ordre alphabétique', en: 'Sort: alphabetical' },
  'kits.aucun': { fr: 'Aucun kit dans cette catégorie.', en: 'No kit in this category.' },
  'kits.bientot': { fr: 'Bientôt', en: 'Soon' },
  'kits.gratuit': { fr: 'Gratuit', en: 'Free' },
  'kits.offert': { fr: 'Offert', en: 'Free' },
  'kits.coins': { fr: 'coins', en: 'coins' },
  'kits.kit-de-depart': { fr: 'Kit de départ', en: 'Starter kit' },
  'kits.livre-avec-grade': { fr: 'livré avec le grade', en: 'comes with the rank' },
  'kits.ou': { fr: 'ou', en: 'or' },
  'kits.filtrer': { fr: 'Filtrer les kits', en: 'Filter the kits' },
  'kits.chercher': { fr: 'Chercher un kit', en: 'Search a kit' },
  'kits.chercher-placeholder': {
    fr: 'Chercher un kit ou une capacité',
    en: 'Search a kit or an ability',
  },
  'kits.un': { fr: 'kit', en: 'kit' },
  'kits.plusieurs': { fr: 'kits', en: 'kits' },
  'kits.sur': { fr: 'sur', en: 'of' },
  'kits.aucun-resultat': {
    fr: 'Aucun kit ne correspond à cette recherche.',
    en: 'No kit matches this search.',
  },
  'kits.tout-reafficher': { fr: 'Tout réafficher', en: 'Show everything' },
  'kits.etiquette': {
    fr: 'kits · 0 armure · 0 niveau',
    en: 'kits · 0 armour · 0 levels',
  },
  'kits.h1-avant': { fr: 'Choisis', en: 'Choose' },
  'kits.h1-apres': { fr: 'ta lame', en: 'your blade' },
  'kits.chapo-1': {
    fr: 'Il n’y a ni stuff à farmer ni niveau à monter. Tout le monde sort du spawn avec une épée en pierre, un inventaire de soupes et',
    en: 'There is no gear to farm and no level to grind. Everyone leaves spawn with a stone sword, an inventory of soups and',
  },
  'kits.chapo-gras': { fr: 'une seule capacité', en: 'one single ability' },
  'kits.chapo-2': {
    fr: '. C’est elle qui décide de ta façon de jouer.',
    en: '. That is what decides how you play.',
  },
  'kits.exclusif-un': { fr: 'L’exclusif', en: 'The exclusive one' },
  'kits.exclusifs-n': { fr: 'exclusifs', en: 'exclusives' },
  'kits.exclusifs-les': { fr: 'Les', en: 'The' },
  'kits.exclusifs-h2-1': {
    fr: 'Ils ne frappent pas plus fort.',
    en: 'They do not hit harder.',
  },
  'kits.exclusifs-h2-2': { fr: 'Ils jouent', en: 'They play' },
  'kits.exclusifs-h2-3': { fr: 'autrement', en: 'differently' },
  'kits.exclusifs-texte': {
    fr: 'Ces kits ont été écrits de zéro pour LJKITS — tu ne les trouveras nulle part ailleurs. Ils coûtent plus cher en coins parce qu’ils sont plus longs à maîtriser, pas parce qu’ils gagnent les combats à ta place.',
    en: 'These kits were written from scratch for LJKITS — you will not find them anywhere else. They cost more coins because they take longer to master, not because they win fights for you.',
  },
  'kits.exclusifs-gras': {
    fr: 'Chacun s’obtient en jouant, exactement comme les {n} autres.',
    en: 'Every one of them is earned by playing, exactly like the other {n}.',
  },
  'kits.exclusifs-fin': {
    fr: 'L’option payante ne fait que raccourcir le grind, et fait tourner le serveur.',
    en: 'Paying only shortens the grind, and keeps the server running.',
  },

  /* ---------- fiche d'un kit ---------- */
  'kit.retour': { fr: 'Tous les kits', en: 'All kits' },
  'kit.caracteristiques': { fr: 'Caractéristiques', en: 'Stats' },
  'kit.comment': { fr: 'Comment l’obtenir', en: 'How to get it' },
  'kit.autres': { fr: 'D’autres kits', en: 'Other kits' },
  'kit.introuvable': { fr: 'Ce kit n’existe pas.', en: 'This kit does not exist.' },
  'kit.meme-gamme': { fr: 'Dans la même gamme de prix', en: 'In the same price range' },
  'kit.autres-maison': { fr: 'Les autres kits maison', en: 'The other in-house kits' },
  'kit.prochain': { fr: 'Le prochain à viser', en: 'The next one to aim for' },
  'kit.tous-les-kits': { fr: 'Tous les kits', en: 'All the kits' },
  'kit.copier-ip': { fr: 'Copier l’IP', en: 'Copy the IP' },
  'kit.kills-estimes-1': { fr: 'Environ', en: 'About' },
  'kit.kills-estimes-2': { fr: 'kills pour le débloquer, à ~', en: 'kills to unlock it, at ~' },
  'kit.kills-estimes-3': { fr: 'coins le kill.', en: 'coins per kill.' },
  'kit.des-la-connexion': {
    fr: 'Disponible dès ta première connexion.',
    en: 'Available from your very first connection.',
  },
  'kit.debloque-ou': { fr: 'Débloque-le en jouant, ou', en: 'Unlock it by playing, or' },
  'kit.prends-boutique': { fr: 'prends-le en boutique', en: 'get it in the shop' },
  'kit.pour': { fr: 'pour', en: 'for' },
  'kit.debloque-coins': {
    fr: 'Débloque-le en jouant, avec les coins gagnés au combat.',
    en: 'Unlock it by playing, with coins earned in combat.',
  },
  'kit.bientot-texte': {
    fr: 'Ce kit est annoncé mais pas encore jouable.',
    en: 'This kit is announced but not playable yet.',
  },
  'kit.rien-debloquer': { fr: 'Rien à débloquer', en: 'Nothing to unlock' },
  'kit.deux-chemins': { fr: 'Deux chemins, un seul kit', en: 'Two paths, one kit' },
  'kit.aucun-cout': { fr: 'Aucun coût', en: 'No cost' },
  'kit.gratuit-texte': {
    fr: 'Ce kit est disponible dès ta première connexion, sans rien débloquer. C’est le point de départ de tout le monde.',
    en: 'This kit is available from your very first connection, with nothing to unlock. It is where everyone starts.',
  },
  'kit.voie-normale': {
    fr: ', gagnés au combat. C’est la voie normale, et celle que prend la majorité',
    en: ', earned in combat. That is the normal path, and the one most people take',
  },
  'kit.voie-payante': {
    fr: 'pour le même kit, aux mêmes statistiques, simplement sans le grind. Ça fait tourner le serveur — ça ne te rend pas plus fort.',
    en: 'for the same kit, with the same stats, simply without the grind. It keeps the server running — it does not make you stronger.',
  },
  'kit.regles-1': { fr: 'Les règles du soup ne changent', en: 'The rules of soup never' },
  'kit.regles-2': { fr: 'jamais', en: 'change' },
  'kit.meme-stuff': {
    fr: 'Tout le monde sort du spawn avec le même stuff. Seule la capacité change.',
    en: 'Everyone leaves spawn with the same gear. Only the ability changes.',
  },
  'kit.nav-aria': { fr: 'Kit précédent et suivant', en: 'Previous and next kit' },
  'kit.suivant': { fr: 'Kit suivant', en: 'Next kit' },
  'kit.precedent': { fr: 'Kit précédent', en: 'Previous kit' },
  'kit.appel-gratuit': {
    fr: 'Il t’attend dès ta première connexion. Connecte-toi et saute dans l’arène.',
    en: 'It is waiting from your first connection. Log in and jump into the arena.',
  },
  'kit.appel-payant': {
    fr: 'Connecte-toi, enchaîne les kills, et il est à toi. {prix} coins, ça se fait plus vite qu’on ne croit.',
    en: 'Log in, chain the kills, and it is yours. {prix} coins goes faster than you would think.',
  },
  'kit.gain.koth': { fr: 'KOTH remporté', en: 'KOTH won' },
  'kit.gain.totem': { fr: 'Totem remporté', en: 'Totem won' },
  'kit.gain.discord': { fr: 'Discord lié', en: 'Discord linked' },
  'kit.gain.koth-v': { fr: '500 coins', en: '500 coins' },
  'kit.gain.totem-v': { fr: 'Une part de 2 500', en: 'A share of 2,500' },
  'kit.gain.discord-v': { fr: '1 000 coins, une fois', en: '1,000 coins, once' },
  'kit.en-jouant': { fr: 'En jouant', en: 'By playing' },
  'kit.en-boutique': { fr: 'En boutique', en: 'In the shop' },
  'kit.aller-chercher': { fr: 'Aller le chercher', en: 'Go and get it' },
  'kit.avance-1': { fr: 'Prends de', en: 'Get' },
  'kit.avance-2': { fr: 'l’avance', en: 'ahead' },
  'kit.va-chercher': { fr: 'Va chercher le', en: 'Go and get the' },
  'kit.coins-mot': { fr: 'coins', en: 'coins' },
  'kit.voir-les': { fr: 'Voir les', en: 'See the' },
  'kit.gain.kill': { fr: 'Par kill', en: 'Per kill' },
  'kit.gain.kill-v': { fr: '~20 coins', en: '~20 coins' },
  'kit.gain.dix': { fr: 'Tous les 10 kills', en: 'Every 10 kills' },
  'kit.gain.dix-v': { fr: '+50 coins', en: '+50 coins' },
  'kit.garantie.stats': { fr: 'Statistiques', en: 'Stats' },
  'kit.garantie.stats-v': { fr: 'Identiques', en: 'Identical' },
  'kit.garantie.avantage': { fr: 'Avantage en combat', en: 'Combat advantage' },
  'kit.garantie.avantage-v': { fr: 'Aucun', en: 'None' },
  'kit.garantie.livraison': { fr: 'Livraison', en: 'Delivery' },
  'kit.garantie.livraison-v': { fr: 'Sous 90 s en jeu', en: 'Within 90 s in game' },

  /* ---------- classement ---------- */
  'classement.titre': { fr: 'Classement Elo', en: 'Elo leaderboard' },
  'classement.rang': { fr: 'Rang', en: 'Rank' },
  'classement.joueur': { fr: 'Joueur', en: 'Player' },
  'classement.elo': { fr: 'Elo', en: 'Elo' },
  'classement.combats': { fr: 'Combats', en: 'Fights' },
  'classement.ratio': { fr: 'Ratio', en: 'Ratio' },
  'classement.vide': {
    fr: 'Personne n’est encore classé. La saison vient de commencer.',
    en: 'Nobody is ranked yet. The season has just started.',
  },

  'kit.retour-fleche': { fr: 'Tous les kits', en: 'All kits' },
  'kit.identiques': { fr: 'Identiques pour les {n} kits', en: 'Identical for all {n} kits' },
  'combats.minimum': {
    fr: 'combats minimum pour le cashprize · la liaison Discord est obligatoire pour apparaître ici.',
    en: 'fights minimum for the cashprize · linking Discord is required to appear here.',
  },
  'joueur.plus-que': { fr: 'Plus que', en: 'Only' },
  'joueur.avant': { fr: 'avant', en: 'before' },
  'joueur.progression': {
    fr: 'Progression sur les {n} derniers combats',
    en: 'Progress over the last {n} fights',
  },
  'joueur.ses-kits': { fr: 'Ses kits', en: 'Their kits' },
  'boutique.prendre-le': { fr: 'Prendre le', en: 'Get the' },
  'boutique.ce-que-tu-obtiens': { fr: 'Ce que tu obtiens', en: 'What you get' },
  'boutique.bonus-coins': {
    fr: 'Bonus de coins sur chaque kill',
    en: 'Coin bonus on every kill',
  },
  'boutique.symbole': {
    fr: 'Symbole ❀ dans le chat et le tab',
    en: '❀ symbol in chat and tab',
  },
  'boutique.nom-holo': {
    fr: 'Nom sur l’hologramme des soutiens',
    en: 'Name on the supporters hologram',
  },
  'boutique.panier-vide': { fr: 'Ton panier est vide.', en: 'Your cart is empty.' },
  'boutique.ajoute-grade': { fr: 'Ajoute un grade ou un kit.', en: 'Add a rank or a kit.' },
  'boutique.ajoute-article': {
    fr: 'Ajoute un article pour continuer.',
    en: 'Add an item to continue.',
  },
  'boutique.couleur-pseudo': { fr: 'Couleur du pseudo', en: 'Name colour' },
  'boutique.blanc': { fr: 'Blanc', en: 'White' },
  'boutique.or': { fr: 'Or', en: 'Gold' },
  'boutique.violet': { fr: 'Violet', en: 'Purple' },
  'boutique.pas-plus-fort': { fr: 'Pas plus fort', en: 'Not stronger' },
  'boutique.jamais': { fr: ', jamais.', en: ', ever.' },
  'boutique.temps-1': { fr: 'Le temps,', en: 'Time,' },
  'boutique.temps-2': { fr: 'pas la puissance', en: 'not power' },
  'boutique.grades-chapeau-long': {
    fr: 'Trois grades, cumulatifs : chaque grade contient tout ce que donne le précédent. Ils changent ce que tu gagnes en jouant, jamais ta puissance en combat.',
    en: 'Three ranks, cumulative: each one contains everything the previous gives. They change what you earn by playing, never your power in combat.',
  },
  'boutique.coins-chapeau-long': {
    fr: 'Les coins débloquent les kits — et tous les kits s’obtiennent en jouant, sans exception. Ici, tu achètes de quoi aller plus vite, pas plus loin.',
    en: 'Coins unlock kits — and every kit can be earned by playing, without exception. Here you buy speed, not reach.',
  },
  'classement.moins-de': { fr: 'moins de 1100', en: 'under 1100' },
  'classement.et-plus': { fr: 'Elo et plus', en: 'Elo and above' },
  'classement.ferme': {
    fr: 'Le classement de la saison arrive très bientôt sur le site. En attendant, le top 100 (global, HG et Digger) est disponible en jeu avec /leaderboard.',
    en: 'The season leaderboard is coming to the website very soon. Meanwhile, the top 100 (global, HG and Digger) is available in game with /leaderboard.',
  },
  'classement.vide-page': {
    fr: 'Le classement Elo n’a pas encore démarré. Reviens à l’ouverture de la première saison.',
    en: 'The Elo leaderboard has not started yet. Come back when the first season opens.',
  },
  'classement.paliers-titre': {
    fr: 'Huit rangs, de Fer à',
    en: 'Eight ranks, from Iron to',
  },
  'classement.paliers-legende': { fr: 'Légende', en: 'Legend' },
  'classement.paliers-chapeau': {
    fr: 'Les bornes sont resserrées autour de 1000, le point de départ : la grande majorité des joueurs vit entre 800 et 1500, et des paliers larges rendraient la progression invisible. Ton palier change en direct, à chaque combat.',
    en: 'The thresholds are tight around 1000, the starting point: the vast majority of players live between 800 and 1500, and wide tiers would make progress invisible. Your tier changes live, with every fight.',
  },
  'classement.antifarm-1': {
    fr: 'Retuer la même personne rapporte de moins en moins :',
    en: 'Killing the same person again earns less and less:',
  },
  'classement.antifarm-gras1': { fr: 'moitié au 2ᵉ kill', en: 'half on the 2nd kill' },
  'classement.antifarm-2': {
    fr: ', un quart au 3ᵉ, puis plus rien pendant deux heures. Le coefficient s’applique aussi',
    en: ', a quarter on the 3rd, then nothing at all for two hours. The same coefficient applies',
  },
  'classement.antifarm-gras2': { fr: 'à la perte', en: 'to the loss' },
  'classement.antifarm-3': {
    fr: '— se faire tuer en boucle par un ami ne vide pas ton Elo, mais ne remplit pas le sien non plus.',
    en: '— being killed on repeat by a friend does not drain your Elo, but does not fill theirs either.',
  },

  'tableau.maj-direct': { fr: 'mis à jour en direct', en: 'updated live' },
  'tableau.intro-1': { fr: 'Tout le monde démarre à', en: 'Everyone starts at' },
  'tableau.intro-2': {
    fr: '. Tu en gagnes en battant plus fort que toi, tu en perds en tombant contre plus faible. La saison dure un mois, puis tout repart à zéro.',
    en: '. You gain by beating stronger players, you lose by falling to weaker ones. A season lasts a month, then everything resets.',
  },
  'tableau.cashprize': {
    fr: 'Réparti entre les meilleurs du classement. Il faut un compte Discord lié pour être éligible.',
    en: 'Shared between the best on the leaderboard. A linked Discord account is required to be eligible.',
  },
  'tableau.classe': { fr: 'classé', en: 'ranked' },
  'tableau.classes': { fr: 'classés', en: 'ranked' },
  'tableau.aucun-resultat': {
    fr: 'Aucun joueur ne correspond à cette recherche.',
    en: 'No player matches this search.',
  },
  'tableau.personne': {
    fr: 'Personne n’est encore classé cette saison. Lie ton compte Discord et lance-toi — les premières places sont à prendre.',
    en: 'Nobody is ranked this season yet. Link your Discord and get going — the top places are up for grabs.',
  },
  'tableau.reafficher': { fr: 'Réafficher le classement', en: 'Show the leaderboard' },
  'tableau.pas-eligible': { fr: 'Pas encore éligible ·', en: 'Not eligible yet ·' },
  'tableau.combats': { fr: 'combats', en: 'fights' },
  'tableau.joueur': { fr: 'joueur', en: 'player' },
  'tableau.joueurs': { fr: 'joueurs', en: 'players' },
  'tableau.affiche': { fr: 'affiché', en: 'shown' },
  'tableau.affiches': { fr: 'affichés', en: 'shown' },
  'tableau.intro-3': { fr: 'Cherche ton pseudo', en: 'Search your name' },
  'tableau.intro-4': { fr: 'pour voir ta place exacte.', en: 'to see your exact placing.' },
  'tableau.cashprize-titre': { fr: 'Cashprize de la saison', en: 'Season cashprize' },
  'tableau.cashprize-1': {
    fr: 'Réparti entre les meilleurs du classement. Il faut',
    en: 'Shared between the best on the leaderboard. It takes',
  },
  'tableau.cashprize-2': {
    fr: 'minimum et un compte Discord lié pour être éligible.',
    en: 'minimum and a linked Discord account to be eligible.',
  },
  'tableau.direct': { fr: 'En direct', en: 'Live' },
  'tableau.hors-ligne': { fr: 'Hors ligne', en: 'Offline' },
  'tableau.sur': { fr: 'sur', en: 'of' },

  /* ---------- règlement ---------- */
  'reglement.titre': { fr: 'Règlement', en: 'Rules' },
  'reglement.etiquette': { fr: 'Les règles du serveur', en: 'The server rules' },
  'reglement.intro': {
    fr: 'En jouant sur LJKITS, tu acceptes ces règles. Elles existent pour une seule raison : que le serveur reste agréable pour tout le monde.',
    en: 'By playing on LJKITS, you accept these rules. They exist for one reason only: to keep the server enjoyable for everyone.',
  },
  'reglement.maj': { fr: 'Dernière mise à jour :', en: 'Last updated:' },
  // Les cinq onglets de gauche. Slugs et ordre dans src/lib/reglement.ts.
  'reglement.cat.ranked': { fr: 'Ranked 1v1', en: 'Ranked 1v1' },
  'reglement.cat.modes': { fr: 'Modes de jeu', en: 'Game modes' },
  'reglement.cat.cashprize': { fr: 'Cashprize', en: 'Cashprize' },
  'reglement.cat.integrite': { fr: 'Intégrité', en: 'Integrity' },
  'reglement.cat.sanctions': { fr: 'Sanctions', en: 'Sanctions' },
  'reglement.cat.serveur': { fr: 'Utilisation', en: 'Server use' },
  'reglement.esprit': {
    fr: 'L’esprit du règlement en une phrase',
    en: 'The spirit of the rules, in one sentence',
  },
  'reglement.phrase-avant': { fr: 'Joue au soup comme en', en: 'Play soup like it is' },
  'reglement.phrase-apres': {
    fr: ', sans pourrir le jeu des autres.',
    en: ', without ruining anyone else’s game.',
  },
  'reglement.meta-description': {
    fr: 'Le règlement du serveur Minecraft PvP Soup LJKITS : triche, respect, stats, bugs, chat, sanctions.',
    en: 'The rules of the LJKITS Minecraft soup PvP server: cheating, respect, stats, bugs, chat, sanctions.',
  },

  /* ---------- boutique ---------- */
  'boutique.titre': { fr: 'Boutique', en: 'Shop' },
  'boutique.grades': { fr: 'Grades', en: 'Ranks' },
  'boutique.coins': { fr: 'Coins', en: 'Coins' },
  'boutique.acheter': { fr: 'Acheter', en: 'Buy' },
  'boutique.bientot': { fr: 'Bientôt disponible', en: 'Coming soon' },
  'boutique.chapo': {
    fr: 'Des grades à vie et des packs de coins. Aucun kit en vente, aucun avantage en combat : tout ce qui se joue s’obtient en jouant.',
    en: 'Lifetime ranks and coin packs. No kit on sale, no advantage in combat: everything that matters in a fight is earned by playing.',
  },
  'boutique.plus-choisi': { fr: 'Le plus choisi', en: 'Most chosen' },
  'boutique.sur-kill': { fr: 'sur chaque kill, à vie', en: 'on every kill, for life' },
  'boutique.voir-grades': { fr: 'Voir les grades →', en: 'See the ranks →' },
  'boutique.aide-etiquette': { fr: 'De la commande au jeu', en: 'From order to game' },
  'boutique.aide-titre': { fr: 'Comment ça se passe', en: 'How it works' },
  'boutique.tu-achetes': { fr: 'Ce que tu achètes', en: 'What you are buying' },
  'boutique.jamais-vente': {
    fr: 'Ce qui ne sera jamais en vente',
    en: 'What will never be for sale',
  },
  'boutique.grades-touchent': {
    fr: 'Les grades ne touchent ni aux dégâts, ni à la vie, ni au knockback.',
    en: 'Ranks touch neither damage, nor health, nor knockback.',
  },
  'boutique.liste-fixe': { fr: 'Cette liste ne bougera pas.', en: 'This list will not change.' },
  'boutique.faq-etiquette': { fr: 'Avant d’acheter', en: 'Before you buy' },
  'boutique.faq-titre': {
    fr: 'Les questions qui reviennent',
    en: 'The questions that keep coming up',
  },
  'boutique.livre-90': { fr: 'Livré en 90 secondes', en: 'Delivered in 90 seconds' },
  'boutique.final-1': { fr: 'Le prochain kill peut être', en: 'The next kill could be' },
  'boutique.final-2': { fr: 'le tien', en: 'yours' },
  'boutique.final-chapo': {
    fr: 'Un grade se prend une fois et se garde à vie. Tu peux aussi tout débloquer en jouant — les deux chemins mènent au même endroit.',
    en: 'A rank is bought once and kept for life. You can also unlock everything by playing — both paths lead to the same place.',
  },
  'boutique.choisir-grade': { fr: 'Choisir un grade', en: 'Choose a rank' },
  'boutique.achat-vie-1': { fr: 'Un achat,', en: 'One purchase,' },
  'boutique.achat-vie-2': { fr: 'à vie', en: 'for life' },
  'boutique.grades-chapeau': {
    fr: 'Trois grades, cumulatifs : chaque grade contient tout ce que donne le précédent.',
    en: 'Three ranks, cumulative: each one contains everything the previous one gives.',
  },
  'boutique.coins-chapeau': {
    fr: 'Les coins débloquent les kits — et tous les kits s’obtiennent en jouant, sans exception. Ici, tu achètes du temps.',
    en: 'Coins unlock kits — and every kit can be earned by playing, without exception. Here, you are buying time.',
  },
  'boutique.ouvre-bientot': {
    fr: 'définitifs, l’achat ouvre dans quelques jours.',
    en: 'final, purchasing opens in a few days.',
  },
  'boutique.bientot-dispo': { fr: 'Bientôt disponible', en: 'Coming soon' },
  'boutique.bientot-en-boutique': { fr: 'Bientôt en boutique', en: 'Coming to the shop' },
  'boutique.permanent': { fr: 'Permanent · livré en 90 s', en: 'Permanent · delivered in 90 s' },
  'boutique.a-lunite': { fr: 'à l’unité', en: 'each' },
  'boutique.livraison-a': { fr: 'Livraison à ', en: 'Delivery to ' },
  'boutique.a-vie': { fr: 'à vie', en: 'for life' },
  'boutique.pseudo-invalide': {
    fr: 'Pseudo invalide : 3 à 16 caractères, lettres, chiffres et _ uniquement.',
    en: 'Invalid username: 3 to 16 characters, letters, digits and _ only.',
  },
  'boutique.pseudo-aide': {
    fr: 'C’est ce pseudo qui recevra la livraison en jeu. Vérifie la casse.',
    en: 'This username receives the delivery in game. Check the capitals.',
  },
  'boutique.aucun-kit': {
    fr: 'Aucun kit ne correspond à cette recherche.',
    en: 'No kit matches this search.',
  },
  'boutique.tout-reafficher': { fr: 'Tout réafficher', en: 'Show everything' },
  'boutique.recapitulatif': { fr: 'Récapitulatif', en: 'Summary' },
  'boutique.verifie-pseudo': {
    fr: 'Vérifie-le : c’est lui qui recevra la livraison en jeu.',
    en: 'Check it: this is the account that receives the delivery in game.',
  },
  'boutique.creation': { fr: 'Création de la commande…', en: 'Creating the order…' },
  'boutique.aller-paiement': { fr: 'Aller au paiement', en: 'Go to payment' },
  'boutique.tebex': {
    fr: 'Ta commande est enregistrée. Le paiement s’ouvre dans un onglet séparé, sur la page sécurisée de Tebex.',
    en: 'Your order is saved. Payment opens in a separate tab, on the secure Tebex page.',
  },
  'boutique.livraison-ira': { fr: 'La livraison ira à', en: 'Delivery will go to' },
  'boutique.role-discord': {
    fr: 'Rôle et salon réservés sur le Discord',
    en: 'Reserved role and channel on Discord',
  },
  'commun.adresse-copiee': { fr: 'Adresse copiée :', en: 'Address copied:' },
  'commun.retour-accueil': { fr: 'Retour à l’accueil', en: 'Back to home' },
  'commun.reessayer': { fr: 'Réessayer', en: 'Try again' },
  'erreur.titre-1': { fr: 'Le bol s’est', en: 'The bowl' },
  'erreur.titre-2': { fr: 'renversé', en: 'spilled' },
  'erreur.texte': {
    fr: 'Quelque chose a mal tourné de notre côté. Réessaye — si ça recommence, le',
    en: 'Something went wrong on our side. Try again — if it keeps happening, the',
  },
  'erreur.404': {
    fr: 'Cette page n’existe pas, ou plus. Le kit que tu cherchais a peut-être été retiré.',
    en: 'This page does not exist, or no longer does. The kit you were looking for may have been removed.',
  },
  'panier.livraison-ira': { fr: 'La livraison ira à', en: 'Delivery will go to' },
  'combats.chapeau': {
    fr: 'Chaque duel de la saison est enregistré : les deux kits, l’Elo échangé et les points de vie qui restaient.',
    en: 'Every duel of the season is recorded: both kits, the Elo exchanged and the health left.',
  },
  'combats.aucun': {
    fr: 'Aucun combat classé pour le moment.',
    en: 'No ranked fight yet.',
  },
  'courbe.periode': { fr: 'sur la période', en: 'over the period' },
  'boutique.multiplicateur': {
    fr: 'Le multiplicateur le plus élevé du serveur',
    en: 'The highest multiplier on the server',
  },

  /* ---------- recrutement ---------- */
  'recrutement.titre': { fr: 'Rejoindre le staff', en: 'Join the staff' },
  'recrutement.envoyer': { fr: 'Envoyer ma candidature', en: 'Send my application' },
  'recrutement.ferme': {
    fr: 'Le recrutement est fermé pour le moment.',
    en: 'Applications are closed for now.',
  },
  'recrutement.obligatoire': { fr: 'Obligatoire', en: 'Required' },
  'recrutement.oui': { fr: 'Oui', en: 'Yes' },
  'recrutement.non': { fr: 'Non', en: 'No' },
  'form.honeypot': { fr: 'Ne remplis pas ce champ', en: 'Do not fill this field' },
  'form.discord-aide': {
    fr: 'C’est là que le staff te répondra. Vérifie-le deux fois.',
    en: 'This is where the staff will reply. Double-check it.',
  },
  'form.consentement': {
    fr: 'J’accepte que mes réponses soient enregistrées et lues par l’équipe de LJKITS pour l’examen de ma candidature.',
    en: 'I agree that my answers are stored and read by the LJKITS team to review my application.',
  },
  'form.une-seule': {
    fr: 'Une seule candidature à la fois. Prends le temps de te relire : tu ne pourras pas la modifier après l’envoi.',
    en: 'One application at a time. Take the time to re-read it: you will not be able to change it after sending.',
  },
  'form.rechargement': {
    fr: ' Un rechargement de la page efface tout : rien n’est enregistré tant que tu n’as pas envoyé.',
    en: ' Reloading the page clears everything: nothing is saved until you send it.',
  },
  'form.envoyee': { fr: 'Candidature envoyée', en: 'Application sent' },
  'form.numero': { fr: 'Ton numéro de dossier :', en: 'Your reference number:' },
  'form.inutile': {
    fr: 'Inutile d’en renvoyer une : elle est enregistrée. Reste joignable sur Discord, c’est là que le staff te répondra.',
    en: 'No need to send another: it is saved. Stay reachable on Discord, that is where the staff will reply.',
  },
  'form.apercu': { fr: 'Aperçu — l’envoi est désactivé.', en: 'Preview — sending is disabled.' },
  'form.choisis': { fr: 'Choisis une réponse…', en: 'Choose an answer…' },
  'recrutement.etiquette': {
    fr: 'LJKITS — équipe de modération',
    en: 'LJKITS — moderation team',
  },
  'recrutement.h1-1': { fr: 'Rejoindre le', en: 'Join the' },
  'recrutement.h1-2': { fr: 'staff', en: 'staff' },
  'recrutement.chapo': {
    fr: 'Modérer un serveur soup, ce n’est pas distribuer des sanctions : c’est arbitrer vite, souvent sans preuve parfaite, et rester droit quand c’est un ami en face.',
    en: 'Moderating a soup server is not handing out sanctions: it is judging fast, often without perfect proof, and staying straight when the person in front of you is a friend.',
  },
  'recrutement.ferme-titre': { fr: 'Recrutement fermé', en: 'Applications closed' },
  'recrutement.preparation': {
    fr: 'Le questionnaire est en cours de préparation. Reviens d’ici peu.',
    en: 'The questionnaire is being prepared. Come back shortly.',
  },
  'recrutement.avant': { fr: 'Avant de commencer', en: 'Before you start' },
  'recrutement.age-gras': { fr: 'ans minimum.', en: 'years old minimum.' },
  'recrutement.age-texte': {
    fr: 'C’est une équipe, pas un grade cosmétique.',
    en: 'This is a team, not a cosmetic rank.',
  },
  'recrutement.duree-gras': {
    fr: 'Compte une bonne demi-heure.',
    en: 'Set aside a good half hour.',
  },
  'recrutement.duree-texte': {
    fr: 'Les mises en situation demandent des réponses développées — c’est précisément ce qu’on lit.',
    en: 'The scenarios call for developed answers — that is precisely what we read.',
  },
  'recrutement.honnete-gras': { fr: 'Sois honnête.', en: 'Be honest.' },
  'recrutement.honnete-texte': {
    fr: 'Une réponse franche ne disqualifie pas. Un mensonge découvert, oui.',
    en: 'A frank answer does not disqualify you. A lie that comes out does.',
  },
  'recrutement.conservation-1': { fr: 'Tes réponses sont conservées', en: 'Your answers are kept for' },
  'recrutement.conservation-2': { fr: 'mois, puis supprimées.', en: 'months, then deleted.' },

  /* ---------- fiche joueur ---------- */
  'meta.kits-titre': { fr: 'Les kits', en: 'The kits' },
  'meta.kits-desc': {
    fr: 'Les kits de LJKITS : capacités, cooldowns, prix en coins. Aucune armure, que du skill.',
    en: 'The LJKITS kits: abilities, cooldowns, prices in coins. No armour, only skill.',
  },
  'meta.reglement-titre': { fr: 'Règlement', en: 'Rules' },
  'meta.reglement-desc': {
    fr: 'Le règlement du serveur Minecraft PvP Soup LJKITS : triche, respect, stats, bugs, chat, sanctions.',
    en: 'The rules of the LJKITS Minecraft soup PvP server: cheating, respect, stats, bugs, chat, sanctions.',
  },
  'meta.classement-titre': { fr: 'Classement', en: 'Leaderboard' },
  'meta.classement-desc': {
    fr: 'Le classement Elo de LJKITS : paliers, combats, ratio K/D. Saison mensuelle avec cashprize à la clé.',
    en: 'The LJKITS Elo leaderboard: tiers, fights, K/D ratio. Monthly season with a cashprize.',
  },
  'meta.boutique-titre': { fr: 'Boutique', en: 'Shop' },
  'meta.boutique-desc': {
    fr: 'Grades à vie et packs de coins pour soutenir LJKITS. Aucun kit en vente, aucun avantage en combat.',
    en: 'Lifetime ranks and coin packs to support LJKITS. No kit on sale, no advantage in combat.',
  },
  'meta.recrutement-titre': { fr: 'Recrutement', en: 'Staff applications' },
  'meta.recrutement-desc': {
    fr: 'Rejoindre l’équipe de modération de LJKITS.',
    en: 'Join the LJKITS moderation team.',
  },
  'joueur.discord-lie': { fr: 'Compte Discord lié', en: 'Discord account linked' },
  'joueur.discord-non-lie': {
    fr: 'Compte Discord non lié · hors classement',
    en: 'Discord account not linked · unranked',
  },
  'joueur.eligible': { fr: 'combats · éligible au cashprize', en: 'fights · eligible for the cashprize' },
  'joueur.pas-eligible': { fr: 'combats · pas encore éligible', en: 'fights · not eligible yet' },
  'joueur.exclu-titre': {
    fr: 'Écarté du classement.',
    en: 'Removed from the leaderboard.',
  },
  'joueur.exclu-detail': {
    fr: "Ce joueur ne concourt plus pour le cashprize de la saison, et ses combats ne font plus bouger l'Elo de personne. Il continue de jouer normalement.",
    en: 'This player no longer competes for the season cashprize, and their fights no longer move anyone’s Elo. They still play normally.',
  },
  'joueur.serie-cours': { fr: 'Série en cours', en: 'Current streak' },
  'joueur.record-serie': { fr: 'Record de série', en: 'Best streak' },
  'joueur.kits-chapeau': {
    fr: 'Les kits les plus joués cette saison, et ce qu’ils rapportent vraiment.',
    en: 'The most played kits this season, and what they actually bring in.',
  },
  'joueur.face-a-face': { fr: 'Face-à-face', en: 'Head to head' },
  'joueur.face-chapeau': {
    fr: 'Les joueurs qu’il croise le plus souvent, et qui mène.',
    en: 'The players they meet most often, and who is ahead.',
  },
  'joueur.egalite': { fr: 'à égalité', en: 'level' },
  'joueur.mene': { fr: 'il mène', en: 'ahead' },
  'joueur.est-mene': { fr: 'il est mené', en: 'behind' },
  'joueur.aucun-combat': {
    fr: 'Aucun combat classé cette saison.',
    en: 'No ranked fight this season.',
  },
  'joueur.col-issue': { fr: 'Issue', en: 'Result' },
  'joueur.col-adversaire': { fr: 'Adversaire', en: 'Opponent' },
  'joueur.col-son-kit': { fr: 'Son kit', en: 'Their kit' },
  'joueur.col-ton-kit': { fr: 'Ton kit', en: 'Your kit' },
  'joueur.col-apres': { fr: 'Après', en: 'After' },
  'joueur.victoire': { fr: 'Victoire', en: 'Win' },
  'joueur.defaite': { fr: 'Défaite', en: 'Loss' },
  'joueur.fiche-a-jour': { fr: 'Fiche à jour au', en: 'Profile updated' },
  'joueur.saison': { fr: 'saison', en: 'season' },
  'joueur.introuvable': { fr: 'Joueur introuvable', en: 'Player not found' },
  'joueur.kills': { fr: 'Kills', en: 'Kills' },
  'joueur.morts': { fr: 'Morts', en: 'Deaths' },
  'joueur.serie': { fr: 'Série', en: 'Streak' },
  'ip.copier': { fr: 'Copier l’IP', en: 'Copy IP' },
  'ip.aria': { fr: 'Copier l’adresse du serveur', en: 'Copy the server address' },
  'nav.retour-accueil': { fr: 'LJKITS — retour à l’accueil', en: 'LJKITS — back to home' },
  'nav.ouvrir-menu': { fr: 'Ouvrir le menu', en: 'Open menu' },
  'nav.fermer-menu': { fr: 'Fermer le menu', en: 'Close menu' },
  'nav.navigation': { fr: 'Navigation', en: 'Navigation' },
  'ouverture.connexion': { fr: 'Connexion…', en: 'Connecting…' },
  'ouverture.en-ligne': { fr: 'Serveur en ligne', en: 'Server online' },
  'ouverture.hors-ligne': { fr: 'Serveur hors ligne', en: 'Server offline' },
  'ouverture.joueurs-en-ligne': { fr: 'Joueurs en ligne', en: 'Players online' },
  'ouverture.dans': { fr: 'Saison 1 dans', en: 'Season 1 in' },
  'ouverture.copie-sors': { fr: 'Copie l’adresse et sors du spawn.', en: 'Copy the address and step out of spawn.' },
  'ouverture.rendez-vous': {
    fr: 'Ouverture officielle de la saison 1 : {d}.',
    en: 'Season 1 officially opens {d}.',
  },
  'boutique.etiquette-bandeau': { fr: 'Boutique officielle · vendeur Tebex', en: 'Official store · Tebex reseller' },
  'boutique.soutiens': { fr: 'Soutiens le serveur.', en: 'Support the server.' },
  'boutique.grade-nomme': { fr: 'Grade {n}', en: '{n} rank' },
  'boutique.final-chapeau': { fr: 'Un grade se prend une fois et se garde à vie. Tu peux aussi tout débloquer en jouant — les deux chemins mènent au même endroit.', en: 'A rank is bought once and kept for life. You can also unlock everything by playing — both paths lead to the same place.' },
  'boutique.rayon-grades': { fr: 'Rayon 01 · Les grades', en: 'Aisle 01 · Ranks' },
  'boutique.rayon-coins': { fr: 'Rayon 02 · Les coins', en: 'Aisle 02 · Coins' },
  'boutique.aucun-grade': { fr: 'Aucun grade en vente pour le moment.', en: 'No rank on sale right now.' },
  'boutique.aucun-pack': { fr: 'Aucun pack de coins pour le moment.', en: 'No coin pack right now.' },
  'boutique.packs-branchement': { fr: 'Les packs de coins sont en cours de branchement au paiement : les prix sont définitifs, l’achat ouvre dans quelques jours.', en: 'Coin packs are still being wired to the payment provider: the prices are final, purchase opens in a few days.' },
  'boutique.un-achat': { fr: 'Un achat', en: 'One purchase' },
  'boutique.tout-ce-que-donne': { fr: 'Tout ce que donne le {g}', en: 'Everything the {g} rank gives' },
  'boutique.ajouter-panier': { fr: 'Ajouter au panier', en: 'Add to cart' },
  'boutique.dans-panier': { fr: 'Dans le panier', en: 'In your cart' },
  'barre.rayons': { fr: 'Rayons', en: 'Aisles' },
  'barre.grades': { fr: 'Grades', en: 'Ranks' },
  'barre.coins': { fr: 'Coins', en: 'Coins' },
  'barre.aide': { fr: 'Aide', en: 'Help' },
  'barre.choisir-pseudo': { fr: 'Choisir mon pseudo', en: 'Choose my username' },
  'barre.renseigner': { fr: 'Renseigner', en: 'Set' },
  'barre.changer': { fr: 'Changer', en: 'Change' },
  'barre.panier': { fr: 'Panier', en: 'Cart' },
  'panier.titre': { fr: 'Ton panier', en: 'Your cart' },
  'panier.fermer': { fr: 'Fermer le panier', en: 'Close cart' },
  'panier.total': { fr: 'Total', en: 'Total' },
  'panier.tva': { fr: 'TVA incluse', en: 'VAT included' },
  'panier.payer': { fr: 'Passer au paiement', en: 'Go to checkout' },
  'panier.choisir-pseudo': { fr: 'Choisis ton pseudo pour commander.', en: 'Choose your username to order.' },
  'panier.revenir': { fr: 'Revenir au panier', en: 'Back to cart' },
  'boutique.pseudo-livraison': { fr: 'Pseudo de livraison', en: 'Delivery username' },
  'boutique.pseudo-label-sr': { fr: 'Ton pseudo Minecraft, celui qui recevra la livraison', en: 'Your Minecraft username — the one that receives the delivery' },
  'boutique.pseudo-placeholder': { fr: 'Ton pseudo Minecraft', en: 'Your Minecraft username' },
  'boutique.recevra': { fr: 'recevra la livraison en jeu', en: 'will receive the delivery in game' },
  'tebex.paiement': { fr: 'Paiement', en: 'Payment' },
  'tebex.payer': { fr: 'Payer sur Tebex', en: 'Pay on Tebex' },
  'tebex.suivre': { fr: 'Suivre ma commande', en: 'Track my order' },
  'commande.garde-numero': { fr: 'Garde ce numéro : c’est lui qu’on te demandera sur le Discord en cas de problème.', en: 'Keep this number: it is what we will ask for on Discord if anything goes wrong.' },
  'commande.detail': { fr: 'Le détail', en: 'The details' },
  'commande.retour-boutique': { fr: 'Retour à la boutique', en: 'Back to the store' },
  'commande.en-attente-titre': { fr: 'Paiement en cours de confirmation', en: 'Payment being confirmed' },
  'commande.en-attente-texte': { fr: 'Si tu viens de payer, la confirmation arrive en général en quelques secondes — recharge la page. Si tu n’as pas terminé le paiement, ta commande reste en attente.', en: 'If you have just paid, confirmation usually lands within seconds — reload the page. If you did not finish the payment, your order stays pending.' },
  'commande.payee-titre': { fr: 'Paiement confirmé, livraison en cours', en: 'Payment confirmed, delivery under way' },
  'commande.payee-texte': { fr: 'Ton contenu part vers le serveur, en général sous une minute. Reconnecte-toi si tu étais déjà en ligne.', en: 'Your content is on its way to the server, usually within a minute. Reconnect if you were already online.' },
  'commande.livree-titre': { fr: 'Livré', en: 'Delivered' },
  'commande.livree-texte': { fr: 'Tout est activé en jeu. Reconnecte-toi si tu étais déjà en ligne pendant la livraison.', en: 'Everything is active in game. Reconnect if you were already online during the delivery.' },
  'commande.annulee-titre': { fr: 'Commande annulée', en: 'Order cancelled' },
  'commande.annulee-texte': { fr: 'Cette commande n’a pas abouti et rien ne t’a été débité. Tu peux en repasser une depuis la boutique.', en: 'This order did not go through and nothing was charged. You can place a new one from the store.' },
  'commande.remboursee-titre': { fr: 'Commande remboursée', en: 'Order refunded' },
  'commande.remboursee-texte': { fr: 'Le paiement a été remboursé et le contenu correspondant a été retiré en jeu.', en: 'The payment was refunded and the matching content was removed in game.' },
  'commande.contestee-titre': { fr: 'Paiement contesté', en: 'Payment disputed' },
  'commande.contestee-texte': { fr: 'Un litige est ouvert sur ce paiement. Passe sur le Discord avec ton numéro de commande, on regarde ça avec toi.', en: 'A dispute is open on this payment. Drop by Discord with your order number and we will look into it with you.' },
  'kits.monnaie': { fr: 'La monnaie', en: 'The currency' },
  'kits.bourse-1': { fr: 'Comment on remplit', en: 'How you fill' },
  'kits.bourse-2': { fr: 'sa bourse', en: 'your purse' },
  'kit.place-progression': { fr: 'Place dans la progression', en: 'Place in the progression' },
  'kit.moins-cher': { fr: '{r}e kit le moins cher sur {n}', en: '#{r} cheapest kit out of {n}' },
  'kit.jauge-aria': { fr: '{c} coins sur {m} pour le kit le plus cher', en: '{c} coins out of {m} for the most expensive kit' },
  'kit.attend': { fr: 'Il t’attend en jeu', en: 'It is waiting for you in game' },
  'kit.gratuit-en-jeu': { fr: 'Gratuit en jeu', en: 'Free in game' },
  'kit.ou-coins': { fr: 'ou {c} coins en jouant', en: 'or {c} coins by playing' },
  'kit.voir-fiche': { fr: 'Voir la fiche du kit {n}', en: 'See the {n} kit page' },
  'classement.joueurs-saison': { fr: '{n} joueurs ayant combattu cette saison', en: '{n} players who fought this season' },
  'classement.joueur-saison': { fr: '{n} joueur ayant combattu cette saison', en: '{n} player who fought this season' },
  'courbe.aria': { fr: 'Progression de {a} à {b} Elo sur {n} combats', en: 'Progression from {a} to {b} Elo over {n} fights' },
  'joueur.meta-titre': { fr: '{p} — Classement Elo', en: '{p} — Elo leaderboard' },
  'joueur.meta-desc': { fr: 'La fiche Elo de {p} sur LJKITS : rang, palier, combats, kits joués et derniers duels.', en: '{p}’s Elo profile on LJKITS: rank, tier, fights, kits played and latest duels.' },
  'joueur.meta-og-desc': { fr: 'Rang, palier et derniers combats de {p}.', en: '{p}’s rank, tier and latest fights.' },
  'joueur.palier-max': { fr: 'Palier maximum atteint.', en: 'Top tier reached.' },
  'joueur.ratio': { fr: 'Ratio K/D', en: 'K/D ratio' },
  'joueur.meilleur-elo': { fr: 'Meilleur Elo', en: 'Best Elo' },
  'joueur.avec-quoi-1': { fr: 'Avec quoi il', en: 'What they' },
  'joueur.avec-quoi-2': { fr: 'gagne', en: 'win with' },
  'joueur.de-victoires': { fr: 'de victoires', en: 'win rate' },
  'joueur.n-combats': { fr: 'combats', en: 'fights' },
  'joueur.ses-adversaires-1': { fr: 'Ses', en: 'Their' },
  'joueur.ses-adversaires-2': { fr: 'adversaires', en: 'opponents' },
  'joueur.historique': { fr: 'Historique', en: 'History' },
  'joueur.derniers-1': { fr: 'Ses derniers', en: 'Their latest' },
  'joueur.derniers-2': { fr: 'combats', en: 'fights' },
  'reglement.en-cours': { fr: 'Le règlement est en cours de rédaction. Reviens d’ici peu.', en: 'The rules are still being written. Check back soon.' },
  'form.etape': { fr: 'Étape {n} sur {t}', en: 'Step {n} of {t}' },
  'form.identite': { fr: 'Identité', en: 'Identity' },
  'form.pseudo-minecraft': { fr: 'Pseudo Minecraft', en: 'Minecraft username' },
  'form.pseudo-discord': { fr: 'Pseudo Discord', en: 'Discord username' },
  'form.age': { fr: 'Âge', en: 'Age' },
  'form.retour': { fr: 'Retour', en: 'Back' },
  'form.suivant': { fr: 'Suivant', en: 'Next' },
  'form.envoi': { fr: 'Envoi en cours…', en: 'Sending…' },
  'form.envoyer': { fr: 'Envoyer ma candidature', en: 'Send my application' },
  'form.err-pseudo-mc': { fr: 'Pseudo Minecraft invalide : 3 à 16 caractères, lettres, chiffres et _ uniquement.', en: 'Invalid Minecraft username: 3 to 16 characters, letters, digits and _ only.' },
  'form.err-pseudo-dc': { fr: 'Pseudo Discord invalide : 2 à 32 caractères, sans espace.', en: 'Invalid Discord username: 2 to 32 characters, no spaces.' },
  'form.err-age-chiffres': { fr: 'Indique ton âge en chiffres.', en: 'Enter your age in digits.' },
  'form.err-age-min': { fr: 'Il faut avoir {a} ans ou plus pour rejoindre le staff.', en: 'You must be {a} or older to join the staff.' },
  'form.err-age-max': { fr: 'Cet âge ne semble pas sérieux.', en: 'That age does not look serious.' },
  'form.err-choix': { fr: 'Choisis une réponse.', en: 'Choose an answer.' },
  'form.err-obligatoire': { fr: 'Cette question est obligatoire.', en: 'This question is required.' },
  'form.err-trop-court': { fr: 'Réponse trop courte : {m} caractères minimum (tu en as écrit {n}).', en: 'Answer too short: {m} characters minimum (you wrote {n}).' },
  'form.err-entier': { fr: 'Indique un nombre entier.', en: 'Enter a whole number.' },
  'form.err-min': { fr: 'La valeur minimale est {m}.', en: 'The minimum value is {m}.' },
  'form.err-max': { fr: 'La valeur maximale est {m}.', en: 'The maximum value is {m}.' },
  'form.err-consentement': { fr: 'Tu dois accepter la conservation de tes réponses pour candidater.', en: 'You must accept that your answers are kept in order to apply.' },
  'commande.meta-titre': { fr: 'Ta commande', en: 'Your order' },
  'commande.etiquette': { fr: 'Commande', en: 'Order' },
  'commande.merci': { fr: 'Merci', en: 'Thanks' },
  'commande.rejoindre-discord': { fr: 'Rejoindre le Discord', en: 'Join the Discord' },
  'accueil.qui-se': { fr: 'qui se', en: 'that is' },
  'form.consentement-complet': {
    fr: 'J’accepte que mes réponses soient enregistrées et lues par l’équipe de LJKITS pour l’examen de ma candidature. Elles sont conservées {m} mois, puis supprimées automatiquement. Je peux demander leur suppression à tout moment sur le Discord du serveur.',
    en: 'I agree that my answers are stored and read by the LJKITS team to review my application. They are kept for {m} months, then deleted automatically. I can ask for their deletion at any time on the server Discord.',
  },
  'classement.paliers': { fr: 'Les paliers', en: 'The tiers' },
  'classement.direct': { fr: 'En direct', en: 'Live' },
  'classement.chercher': { fr: 'Chercher un joueur', en: 'Find a player' },
  'classement.complet': { fr: 'Classement complet', en: 'Full leaderboard' },
  'kit.voir-boutique': { fr: 'Voir la boutique', en: 'See the store' },
  'boutique.changer': { fr: 'Changer', en: 'Change' },
  'classement.placeholder-recherche': { fr: 'Cherche ton pseudo', en: 'Search your username' },
  'tableau.le-classement': { fr: 'Le classement', en: 'The' },
  'tableau.classement-accent': { fr: 'Elo', en: 'Elo leaderboard' },
  'tableau.col-combats': { fr: 'Combats', en: 'Fights' },
  'tableau.col-record': { fr: 'Record', en: 'Record' },
  'tableau.col-rang': { fr: 'Rang', en: 'Rank' },
  'tableau.col-joueur': { fr: 'Joueur', en: 'Player' },
  'tableau.col-palier': { fr: 'Palier', en: 'Tier' },
  'tableau.pv-restants': { fr: 'PV restants', en: 'HP left' },
  'tableau.anti-farm': { fr: 'Anti-farm', en: 'Anti-farm' },
  'tableau.derniers-1': { fr: 'Les derniers', en: 'The latest' },
  'tableau.derniers-2': { fr: 'combats', en: 'fights' },
  'tableau.col-vainqueur': { fr: 'Vainqueur', en: 'Winner' },
  'tableau.col-vaincu': { fr: 'Vaincu', en: 'Loser' },
  'tableau.col-quand': { fr: 'Quand', en: 'When' },
  'tableau.bat': { fr: 'bat', en: 'beats' },
  'joueur.retour-classement': { fr: '← Retour au classement', en: '← Back to the leaderboard' },
  'joueur.contre': { fr: 'contre', en: 'vs' },
  'kit.exclusif-fiche': { fr: 'Kit exclusif', en: 'Exclusive kit' },
  'kit.fiche-technique': { fr: 'Fiche technique', en: 'Tech sheet' },
  'boutique.prix-une-fois': { fr: 'Prix, une fois', en: 'Price, once' },
  'boutique.meilleure-valeur': { fr: 'Meilleure valeur', en: 'Best value' },
  'form.obligatoire-sr': { fr: ' (obligatoire)', en: ' (required)' },
  'accueil.regle.cooldown-titre': { fr: 'cooldown', en: 'cooldown' },
  'accueil.regle.armure-titre': { fr: 'armure', en: 'armour' },
  'accueil.regle.clic-droit-titre': { fr: 'Clic droit', en: 'Right click' },
  'accueil.regle.knockback-titre': { fr: 'Knockback 1.8', en: '1.8 knockback' },
  'accueil.pay-to-win': { fr: 'Pay to win', en: 'Pay to win' },

  /* ---------- classement ranked practice et profils (16/09/2026) ---------- */
  'pr.meta-titre': { fr: 'Classement ranked', en: 'Ranked leaderboard' },
  'pr.meta-desc': {
    fr: 'Le classement ranked 1v1 de LJKITS : Elo global et par mode, profils détaillés, historique de chaque match.',
    en: 'The LJKITS ranked 1v1 leaderboard: global and per-mode Elo, detailed profiles, every match on record.',
  },
  'pr.etiquette': { fr: 'Ranked 1v1 · Saison {s}', en: 'Ranked 1v1 · Season {s}' },
  'pr.titre-avant': { fr: 'Le classement', en: 'The ranked' },
  'pr.titre-accent': { fr: 'ranked', en: 'leaderboard' },
  'pr.chapeau': {
    fr: 'Un Elo par mode, et un Elo global — leur moyenne — qui fait le classement du cashprize. Le top 3 global se partage {c} chaque mois.',
    en: 'One Elo per mode, and a global Elo — their average — that decides the cashprize. The global top 3 share {c} every month.',
  },
  'pr.chiffre-joueurs': { fr: 'Joueurs classés', en: 'Ranked players' },
  'pr.chiffre-matchs': { fr: 'Matchs joués', en: 'Matches played' },
  'pr.chiffre-24h': { fr: 'Sur 24 heures', en: 'In the last 24h' },
  'pr.chiffre-dernier': { fr: 'Dernier match', en: 'Last match' },
  'pr.global': { fr: 'Global', en: 'Global' },
  'pr.global-aide': { fr: 'Moyenne des modes', en: 'Average of the modes' },
  'pr.recherche-placeholder': { fr: 'Chercher un joueur…', en: 'Search for a player…' },
  'pr.recherche-aria': { fr: 'Rechercher un joueur', en: 'Search for a player' },
  'pr.recherche-aucun': { fr: 'Aucun joueur classé à ce nom.', en: 'No ranked player by that name.' },
  'pr.recherche-aide': { fr: '↑ ↓ pour choisir · Entrée pour ouvrir', en: '↑ ↓ to pick · Enter to open' },
  'pr.filtre-placeholder': { fr: 'Filtrer ce classement…', en: 'Filter this ladder…' },
  'pr.tri': { fr: 'Trier par', en: 'Sort by' },
  'pr.tri-elo': { fr: 'Elo', en: 'Elo' },
  'pr.tri-winrate': { fr: 'Winrate', en: 'Winrate' },
  'pr.tri-matchs': { fr: 'Matchs', en: 'Matches' },
  'pr.tri-serie': { fr: 'Série', en: 'Streak' },
  'pr.col-rang': { fr: 'Rang', en: 'Rank' },
  'pr.col-joueur': { fr: 'Joueur', en: 'Player' },
  'pr.col-elo': { fr: 'Elo', en: 'Elo' },
  'pr.col-winrate': { fr: 'Winrate', en: 'Winrate' },
  'pr.col-bilan': { fr: 'Bilan', en: 'Record' },
  'pr.col-serie': { fr: 'Série', en: 'Streak' },
  'pr.col-forme': { fr: 'Forme', en: 'Form' },
  'pr.voir-plus': { fr: 'Afficher plus', en: 'Show more' },
  'pr.aucun-filtre': { fr: 'Personne ne correspond à ce filtre.', en: 'Nobody matches this filter.' },
  'pr.vide': {
    fr: 'Personne n’est encore classé ici. Le premier match ranked ouvrira la liste.',
    en: 'Nobody is ranked here yet. The first ranked match will open the list.',
  },
  'pr.vide-saison': { fr: 'Aucune saison n’est ouverte pour le moment.', en: 'No season is open right now.' },
  'pr.cashprize': { fr: 'Cashprize', en: 'Cashprize' },
  'pr.derniers-etiquette': { fr: 'En direct', en: 'Live' },
  'pr.derniers-titre': { fr: 'Les derniers matchs', en: 'The latest matches' },
  'pr.bat': { fr: 'bat', en: 'beat' },
  'pr.voir-profil': { fr: 'Voir le profil', en: 'View profile' },
  'pr.skin-alt': { fr: 'Skin de {p} en garde', en: '{p}’s skin in a fighting stance' },
  'pr.glisser': { fr: 'Glisse pour faire tourner', en: 'Drag to spin' },

  'pr.profil-meta-titre': { fr: '{p} — profil ranked', en: '{p} — ranked profile' },
  'pr.profil-meta-desc': {
    fr: 'Elo, winrate, records, rivalités et historique complet de {p} sur LJKITS.',
    en: 'Elo, winrate, records, rivalries and full match history of {p} on LJKITS.',
  },
  'pr.retour': { fr: '← Classement', en: '← Leaderboard' },
  'pr.rang-global': { fr: 'Rang global', en: 'Global rank' },
  'pr.sur': { fr: 'sur', en: 'of' },
  'pr.non-classe': { fr: 'Non classé', en: 'Unranked' },
  'pr.exclu': { fr: 'Exclu du classement', en: 'Excluded from the leaderboard' },
  'pr.discord-lie': { fr: 'Discord lié', en: 'Discord linked' },
  'pr.palier-suivant': { fr: 'encore {n} Elo avant {p}', en: '{n} more Elo to reach {p}' },
  'pr.palier-max': { fr: 'Palier le plus haut atteint', en: 'Top tier reached' },
  'pr.elo-max': { fr: 'Elo max', en: 'Peak Elo' },
  'pr.matchs': { fr: 'Matchs', en: 'Matches' },
  'pr.victoires': { fr: 'Victoires', en: 'Wins' },
  'pr.defaites': { fr: 'Défaites', en: 'Losses' },
  'pr.winrate': { fr: 'Winrate', en: 'Winrate' },
  'pr.serie': { fr: 'Série en cours', en: 'Current streak' },
  'pr.meilleure-serie': { fr: 'Meilleure série', en: 'Best streak' },
  'pr.forme': { fr: 'Forme récente', en: 'Recent form' },
  'pr.v': { fr: 'V', en: 'W' },
  'pr.d': { fr: 'D', en: 'L' },
  'pr.victoire': { fr: 'Victoire', en: 'Win' },
  'pr.defaite': { fr: 'Défaite', en: 'Loss' },

  'pr.modes-etiquette': { fr: 'Par mode', en: 'By mode' },
  'pr.modes-titre': { fr: 'Chaque mode a son Elo', en: 'Every mode has its own Elo' },
  'pr.pas-joue': { fr: 'Pas encore joué en ranked', en: 'Not played in ranked yet' },

  'pr.progression-etiquette': { fr: 'Progression', en: 'Progression' },
  'pr.progression-titre': { fr: 'L’Elo, match après match', en: 'Elo, match after match' },
  'pr.progression-vide': { fr: 'Pas encore assez de matchs pour tracer une courbe.', en: 'Not enough matches to draw a curve yet.' },
  'pr.activite': { fr: 'Activité · 14 jours', en: 'Activity · 14 days' },
  'pr.matchs-le': { fr: '{n} match(s) le {d}', en: '{n} match(es) on {d}' },

  'pr.records-etiquette': { fr: 'Records', en: 'Records' },
  'pr.records-titre': { fr: 'Ses meilleurs moments', en: 'Their best moments' },
  'pr.rec-rapide': { fr: 'Victoire la plus rapide', en: 'Fastest win' },
  'pr.rec-gain': { fr: 'Plus gros gain', en: 'Biggest gain' },
  'pr.rec-perte': { fr: 'Plus grosse perte', en: 'Biggest loss' },
  'pr.rec-duree': { fr: 'Durée moyenne d’un match', en: 'Average match length' },
  'pr.rec-clutch': { fr: 'Victoires clutch', en: 'Clutch wins' },
  'pr.rec-clutch-aide': { fr: 'Gagnées avec 3 cœurs ou moins', en: 'Won with 3 hearts or less' },
  'pr.rec-parfait': { fr: 'Victoires parfaites', en: 'Flawless wins' },
  'pr.rec-parfait-aide': { fr: 'Gagnées sans perdre un cœur', en: 'Won without losing a heart' },
  'pr.rec-favori': { fr: 'Mode favori', en: 'Favourite mode' },
  'pr.rec-premier': { fr: 'Premier match ranked', en: 'First ranked match' },
  'pr.rec-dernier': { fr: 'Dernier match', en: 'Last match' },
  'pr.contre': { fr: 'contre', en: 'vs' },
  'pr.en': { fr: 'en', en: 'in' },
  'pr.issues': { fr: 'Comment se finissent ses matchs', en: 'How their matches end' },

  'pr.rivalites-etiquette': { fr: 'Rivalités', en: 'Rivalries' },
  'pr.rivalites-titre': { fr: 'Ceux qu’il croise le plus', en: 'The ones they meet the most' },
  'pr.nemesis': { fr: 'Némésis', en: 'Nemesis' },
  'pr.nemesis-aide': { fr: 'Le joueur qui l’a battu le plus souvent', en: 'The player who beat them the most' },
  'pr.victime': { fr: 'Victime préférée', en: 'Favourite victim' },
  'pr.victime-aide': { fr: 'Le joueur qu’il a battu le plus souvent', en: 'The player they beat the most' },
  'pr.face-a-face': { fr: 'Face-à-face', en: 'Head-to-head' },
  'pr.aucun-rival': { fr: 'Pas encore de rival.', en: 'No rival yet.' },

  'pr.historique-etiquette': { fr: 'Historique', en: 'History' },
  'pr.historique-titre': { fr: 'Tous ses matchs de la saison', en: 'Every match this season' },
  'pr.tous-modes': { fr: 'Tous les modes', en: 'All modes' },
  'pr.tous': { fr: 'Tous', en: 'All' },
  'pr.historique-vide': { fr: 'Aucun match pour ce filtre.', en: 'No match for this filter.' },
  'pr.historique-limite': {
    fr: 'Les {n} derniers matchs. Les statistiques, elles, portent sur toute la saison.',
    en: 'The last {n} matches. Statistics cover the whole season.',
  },

  'pr.raison.tue': { fr: 'Kill', en: 'Kill' },
  'pr.raison.temps': { fr: 'Temps écoulé', en: 'Time up' },
  'pr.raison.boxing': { fr: 'Aux coups', en: 'On hits' },
  'pr.raison.abandon': { fr: 'Abandon', en: 'Forfeit' },
  'pr.raison.deconnexion': { fr: 'Déconnexion', en: 'Disconnect' },
  'pr.raison.sortie': { fr: 'Sortie d’arène', en: 'Left the arena' },
  'pr.raison.sortie-haut': { fr: 'Sorti par le haut', en: 'Left over the top' },
  'pr.raison.autre': { fr: 'Autre', en: 'Other' },
} as const satisfies Record<string, Entree>

export type CleTexte = keyof typeof DICO

/** Le texte de l'interface, dans la langue demandée. */
export function t(locale: Locale, cle: CleTexte): string {
  return DICO[cle][locale]
}
