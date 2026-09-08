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
  'pied.versions': { fr: 'Java 1.8 → 1.21+', en: 'Java 1.8 → 1.21+' },
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
  'accueil.h1-1': { fr: 'Serveur Minecraft', en: 'Minecraft server' },
  'accueil.h1-2': { fr: 'PvP Soup', en: 'Soup PvP' },
  'accueil.h1-3': { fr: 'en', en: 'in' },
  'accueil.chapo-1': {
    fr: 'Aucun cooldown d’attaque, aucune armure, et un bol de soupe pour se soigner.',
    en: 'No attack cooldown, no armour, and a bowl of soup to heal.',
  },
  'accueil.chapo-kits': { fr: 'kits', en: 'kits' },
  'accueil.chapo-2': { fr: 'à débloquer en jouant, un', en: 'to unlock by playing, a' },
  'accueil.chapo-classement': {
    fr: 'classement remis à zéro chaque lundi',
    en: 'leaderboard reset every Monday',
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
    fr: 'Clique pour copier · Minecraft Java 1.8 → 1.21+',
    en: 'Click to copy · Minecraft Java 1.8 → 1.21+',
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
    fr: 'Des grades à vie et des packs de coins. Aucun kit en vente, aucun avantage en combat.',
    en: 'Lifetime ranks and coin packs. No kit on sale, no advantage in combat.',
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
} as const satisfies Record<string, Entree>

export type CleTexte = keyof typeof DICO

/** Le texte de l'interface, dans la langue demandée. */
export function t(locale: Locale, cle: CleTexte): string {
  return DICO[cle][locale]
}
