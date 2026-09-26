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
  'pied.versions': { fr: 'Java 1.7 et 1.8', en: 'Java 1.7 and 1.8' },
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

  /* ---------- accueil compétitif (22/09/2026) ---------- */
  // {c} = le cashprize formaté (« 150€ » / « €150 »), {n} = le numéro de saison.
  'ac.meta-titre': {
    fr: 'LJKITS — Serveur PvP Soup 1.7/1.8 compétitif · {c} de cashprize',
    en: 'LJKITS — Competitive 1.7/1.8 Soup PvP · {c} cashprize',
  },
  'ac.meta-desc': {
    fr: 'Ranked 1v1 en soupe PvP sur Minecraft Java 1.7 et 1.8 : 4 modes classés, un Elo global et {c} de cashprize chaque mois pour le top 3. Zéro pay to win.',
    en: 'Ranked 1v1 soup PvP on Minecraft Java 1.7 and 1.8: 4 ranked modes, one global Elo and a {c} cashprize every month for the top 3. Zero pay-to-win.',
  },
  'ac.etiquette': { fr: 'Saison {n} en cours · Ranked 1v1', en: 'Season {n} live · Ranked 1v1' },
  'ac.h1-1': { fr: 'Monte au top 3.', en: 'Reach the top 3.' },
  'ac.h1-2': { fr: 'Repars avec', en: 'Take home' },
  'ac.chapo': {
    fr: 'Le ranked soup PvP en 1.7/1.8 : des duels 1v1 classés dans quatre modes, un Elo global, et chaque mois {c} pour les trois premiers. Rien ne s’achète — seul ton niveau compte.',
    en: 'Ranked soup PvP on 1.7/1.8: 1v1 duels in four modes, one global Elo, and {c} for the top three every month. Nothing is for sale — only your skill counts.',
  },
  'ac.voir-classement': { fr: 'Voir le classement', en: 'See the leaderboard' },
  'ac.garanties': { fr: 'Java 1.7 et 1.8 · Gratuit · Zéro pay to win', en: 'Java 1.7 and 1.8 · Free · Zero pay-to-win' },

  'ac.cagnotte-etiquette': { fr: 'Cashprize · Saison {n}', en: 'Cashprize · Season {n}' },
  'ac.cagnotte-sous': {
    fr: 'à se partager entre le top 3 de l’Elo global',
    en: 'shared between the global Elo top 3',
  },
  'ac.place-1': { fr: '1er', en: '1st' },
  'ac.place-2': { fr: '2e', en: '2nd' },
  'ac.place-3': { fr: '3e', en: '3rd' },
  'ac.place-libre': { fr: 'Place libre', en: 'Up for grabs' },
  'ac.live': { fr: 'En direct', en: 'Live' },
  'ac.cloture-dans': { fr: 'Clôture dans', en: 'Closes in' },
  'ac.cloture-le': { fr: 'Classement figé le {d}', en: 'Leaderboard frozen on {d}' },
  'ac.rebours-j': { fr: 'jours', en: 'days' },
  'ac.rebours-h': { fr: 'heures', en: 'hours' },
  'ac.rebours-min': { fr: 'min', en: 'min' },
  'ac.rebours-s': { fr: 'sec', en: 'sec' },
  'ac.rebours-sr': { fr: 'La saison se clôture le {d}.', en: 'The season closes on {d}.' },
  'ac.rebours-cloture': { fr: 'Saison close — le podium est figé', en: 'Season closed — the podium is frozen' },

  'ac.chiffre-en-ligne': { fr: 'Joueurs en ligne', en: 'Players online' },
  'ac.chiffre-classes': { fr: 'Joueurs classés', en: 'Ranked players' },
  'ac.chiffre-matchs': { fr: 'Matchs ranked cette saison', en: 'Ranked matches this season' },
  'ac.chiffre-24h': { fr: 'Matchs sur 24 heures', en: 'Matches in the last 24h' },

  'ac.podium-etiquette': { fr: 'Le podium en direct', en: 'The live podium' },
  'ac.podium-titre-1': { fr: 'Si la saison finissait', en: 'If the season ended' },
  'ac.podium-titre-2': { fr: 'maintenant', en: 'right now' },
  'ac.podium-chapeau': {
    fr: 'Ces trois-là se partageraient {c}. Le classement n’est figé qu’à la seconde de la clôture : d’ici là, tout peut basculer.',
    en: 'These three would split {c}. The leaderboard only freezes at the exact second the season closes: until then, anything can change.',
  },
  'ac.podium-vide': {
    fr: 'Personne n’est encore classé cette saison : le podium est à prendre.',
    en: 'Nobody is ranked yet this season: the podium is up for grabs.',
  },
  'ac.poursuivants': { fr: 'Les poursuivants', en: 'The chasers' },
  'ac.poursuivants-texte': {
    fr: 'L’écart avec la 3e place, c’est tout ce qui les sépare de {p}.',
    en: 'The gap to 3rd place is all that stands between them and {p}.',
  },
  'ac.du-podium': { fr: 'du podium', en: 'off podium' },

  'ac.etapes-etiquette': { fr: 'Comment gagner', en: 'How to win' },
  'ac.etapes-titre-1': { fr: 'Quatre étapes jusqu’au', en: 'Four steps to the' },
  'ac.etapes-titre-2': { fr: 'cashprize', en: 'cashprize' },
  'ac.etape1-titre': { fr: 'Connecte-toi', en: 'Join' },
  'ac.etape1': {
    fr: 'Adresse {ip}, en Minecraft Java 1.7 ou 1.8. C’est gratuit.',
    en: 'Address {ip}, on Minecraft Java 1.7 or 1.8. It’s free.',
  },
  'ac.etape2-titre': { fr: 'Lie ton Discord', en: 'Link your Discord' },
  'ac.etape2': {
    fr: 'Tape /discord en jeu. Obligatoire pour le ranked — c’est aussi là que les gagnants sont contactés.',
    en: 'Type /discord in game. Required for ranked — it is also where winners are contacted.',
  },
  'ac.etape3-titre': { fr: 'Débloque le ranked', en: 'Unlock ranked' },
  'ac.etape3': {
    fr: 'Gagne 5 matchs en unranked, avec l’épée en fer du spawn. Un échauffement, sans rien risquer.',
    en: 'Win 5 unranked matches with the iron sword at spawn. A warm-up, nothing at stake.',
  },
  'ac.etape4-titre': { fr: 'Monte au top 3', en: 'Climb to the top 3' },
  'ac.etape4': {
    fr: 'Épée en diamant, choisis ton mode, gagne. Dans le top 3 de l’Elo global à la clôture ? Tu es payé.',
    en: 'Diamond sword, pick your mode, win. In the global Elo top 3 at closing? You get paid.',
  },
  'ac.versement': {
    fr: 'Versé par PayPal ou carte cadeau · 30 jours pour réclamer · accord parental pour les mineurs',
    en: 'Paid by PayPal or gift card · 30 days to claim · parental consent for minors',
  },
  'ac.regles-cashprize': { fr: 'Les règles du cashprize', en: 'Cashprize rules' },

  'ac.modes-etiquette': { fr: '4 modes classés', en: '4 ranked modes' },
  'ac.modes-titre-1': { fr: 'Quatre modes.', en: 'Four modes.' },
  'ac.modes-titre-2': { fr: 'Un seul classement.', en: 'One leaderboard.' },
  'ac.modes-chapeau': {
    fr: 'Chaque mode a son Elo, et ton Elo global en est la moyenne — un mode jamais joué compte pour 1000. Pour décrocher le cashprize, il faut être bon partout.',
    en: 'Each mode has its own Elo, and your global Elo is their average — a mode you never played counts as 1000. To take the cashprize, you have to be good at everything.',
  },
  'ac.mode-hg': {
    fr: 'Le classique du soup PvP : épée en diamant, armure en fer, soupes, seaux et blocs. Construis, piège, achève.',
    en: 'Soup PvP’s classic: diamond sword, iron armour, soups, buckets and blocks. Build, trap, finish.',
  },
  'ac.mode-digger': {
    fr: 'Le combat vertical : on pose, on creuse, et la map se remet à zéro en plein duel. Sortir par le haut, c’est perdre.',
    en: 'Vertical fighting: place, dig, and the map resets mid-duel. Leave through the top and you lose.',
  },
  'ac.mode-boxing': {
    fr: 'Épée seule, zéro dégât, que du recul. Le premier à 100 coups gagne : visée et combos, rien d’autre.',
    en: 'Sword only, zero damage, pure knockback. First to 100 hits wins: aim and combos, nothing else.',
  },
  'ac.mode-ironsoup': {
    fr: 'Armure en fer, épée Tranchant I et 32 soupes. Le soup PvP à l’état pur : celui qui gère le mieux son stock l’emporte.',
    en: 'Iron armour, Sharpness I sword and 32 soups. Soup PvP at its purest: whoever manages their stack best wins.',
  },
  'ac.mode-classes': { fr: '{n} classés', en: '{n} ranked' },
  'ac.numero-1': { fr: 'N°1', en: 'No. 1' },
  'ac.mode-personne': { fr: 'Personne encore — à toi', en: 'Nobody yet — your move' },

  'ac.paliers-etiquette': { fr: 'L’échelle', en: 'The ladder' },
  'ac.paliers-titre': { fr: 'De Fer à', en: 'From Iron to' },
  'ac.paliers-chapeau': {
    fr: 'Tout le monde démarre à 1000 Elo dans chaque mode, et un match en fait gagner ou perdre 30 au plus.',
    en: 'Everyone starts at 1000 Elo in every mode, and a match wins or loses you 30 at most.',
  },
  'ac.paliers-leader': {
    fr: 'Le n°1 de la saison est {p}. Légende commence à {m}.',
    en: 'This season’s No. 1 is {p}. Legend starts at {m}.',
  },
  'ac.depart': { fr: 'Départ', en: 'Start' },

  'ac.merite-etiquette': { fr: 'Compétition propre', en: 'Fair competition' },
  'ac.merite-titre-1': { fr: 'Un podium qui', en: 'A podium you' },
  'ac.merite-titre-2': { fr: 'se mérite', en: 'earn' },
  'ac.merite-kit-v': { fr: 'Même kit', en: 'Same kit' },
  'ac.merite-kit': {
    fr: 'Les deux joueurs reçoivent exactement le même stuff. La boutique ne vend rien qui touche au ranked.',
    en: 'Both players get the exact same gear. The store sells nothing that touches ranked.',
  },
  'ac.merite-mm-v': { fr: '±100 Elo', en: '±100 Elo' },
  'ac.merite-mm': {
    fr: 'La file te cherche d’abord un adversaire de ton niveau, puis élargit peu à peu. Pas de revanche immédiate.',
    en: 'The queue first looks for an opponent at your level, then slowly widens. No instant rematches.',
  },
  'ac.merite-farm-v': { fr: 'Anti-farm', en: 'Anti-farm' },
  'ac.merite-farm': {
    fr: 'L’Elo pris à un même adversaire est plafonné, comme les matchs par heure. Arranger un match fait perdre le prix.',
    en: 'Elo taken from the same opponent is capped, and so are matches per hour. Fixing a match forfeits the prize.',
  },
  'ac.merite-ac-v': { fr: 'Anticheat', en: 'Anticheat' },
  'ac.merite-ac': {
    fr: 'Triche = bannissement définitif, Elo annulé, cashprize perdu. Même si c’est découvert après la saison.',
    en: 'Cheating = permanent ban, Elo voided, cashprize forfeited. Even if it comes out after the season.',
  },

  'ac.ffa-etiquette': { fr: 'Pendant la file', en: 'While you queue' },
  'ac.ffa-titre-1': { fr: 'Tu n’attends pas,', en: 'No waiting,' },
  'ac.ffa-titre-2': { fr: 'tu joues', en: 'you play' },
  'ac.ffa-texte': {
    fr: 'En attendant ton adversaire, le FFA soupe tourne : {n} kits à débloquer en jouant, des coins à chaque kill. Dès qu’un match est trouvé, tu es téléporté dans l’arène.',
    en: 'While you wait for an opponent, soup FFA is on: {n} kits to unlock by playing, coins for every kill. As soon as a match is found, you are teleported to the arena.',
  },
  'ac.ffa-kits': { fr: 'kits', en: 'kits' },

  'ac.final-etiquette': { fr: 'Saison {n} · clôture {d}', en: 'Season {n} · closes {d}' },
  'ac.final-1': { fr: 'Le podium se joue', en: 'The podium is decided' },
  'ac.final-2': { fr: 'maintenant', en: 'now' },
  'ac.final-chapeau': {
    fr: 'Connecte-toi en 1.8, lie ton Discord, gagne tes 5 matchs d’échauffement — et monte.',
    en: 'Log in on 1.8, link your Discord, win your 5 warm-up matches — and climb.',
  },
  'ac.final-ip': {
    fr: 'Clique pour copier · Minecraft Java 1.7 et 1.8',
    en: 'Click to copy · Minecraft Java 1.7 and 1.8',
  },

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
  'boutique.ajoute-grade': { fr: 'Ajoute un pack de coins.', en: 'Add a coin pack.' },
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
    fr: 'Les coins débloquent les kits, les grades et les clans — et tout cela s’obtient en jouant, sans exception. Ici, tu achètes de quoi aller plus vite, pas plus loin.',
    en: 'Coins unlock kits, ranks and clans — and all of it can be earned by playing, without exception. Here you buy speed, not reach.',
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
    fr: 'Des coins, et rien d’autre. Tout le contenu du serveur — kits, grades, clans — s’achète en jeu avec les coins que tu gagnes en jouant. Ici tu gagnes du temps, jamais un avantage en combat.',
    en: 'Coins, and nothing else. Everything on the server — kits, ranks, clans — is bought in game with the coins you earn by playing. Here you buy time, never an advantage in a fight.',
  },
  'boutique.plus-choisi': { fr: 'Le meilleur rapport', en: 'Best value' },
  'boutique.sur-kill': { fr: 'coins, livrés en 90 secondes', en: 'coins, delivered in 90 seconds' },
  'boutique.voir-grades': { fr: 'Voir les packs →', en: 'See the packs →' },
  'boutique.aide-etiquette': { fr: 'De la commande au jeu', en: 'From order to game' },
  'boutique.aide-titre': { fr: 'Comment ça se passe', en: 'How it works' },
  'boutique.tu-achetes': { fr: 'Ce que tu achètes', en: 'What you are buying' },
  'boutique.jamais-vente': {
    fr: 'Ce qui ne sera jamais en vente',
    en: 'What will never be for sale',
  },
  'boutique.grades-touchent': {
    fr: 'Les coins ne touchent ni aux dégâts, ni à la vie, ni au knockback.',
    en: 'Coins touch neither damage, nor health, nor knockback.',
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
    fr: 'Tout se débloque en jouant. Un pack de coins ne fait que raccourcir le chemin — les deux mènent au même endroit.',
    en: 'Everything unlocks by playing. A coin pack only shortens the road — both lead to the same place.',
  },
  'boutique.choisir-grade': { fr: 'Prendre des coins', en: 'Get coins' },
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
  'boutique.etiquette-bandeau': { fr: 'Boutique officielle · vendeur Tebex', en: 'Official store · Tebex reseller' },
  'boutique.soutiens': { fr: 'Soutiens le serveur.', en: 'Support the server.' },
  'boutique.grade-nomme': { fr: 'Grade {n}', en: '{n} rank' },
  'boutique.final-chapeau': { fr: 'Tout se débloque en jouant. Un pack de coins ne fait que raccourcir le chemin — les deux mènent au même endroit.', en: 'Everything unlocks by playing. A coin pack only shortens the road — both lead to the same place.' },
  'boutique.rayon-grades': { fr: 'Rayon 01 · Les grades', en: 'Aisle 01 · Ranks' },
  'boutique.rayon-coins': { fr: 'Les packs de coins', en: 'Coin packs' },
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
  'form.consentement-complet': {
    fr: 'J’accepte que mes réponses soient enregistrées et lues par l’équipe de LJKITS pour l’examen de ma candidature. Elles sont conservées {m} mois, puis supprimées automatiquement. Je peux demander leur suppression à tout moment sur le Discord du serveur.',
    en: 'I agree that my answers are stored and read by the LJKITS team to review my application. They are kept for {m} months, then deleted automatically. I can ask for their deletion at any time on the server Discord.',
  },
  'classement.paliers': { fr: 'Les paliers', en: 'The tiers' },
  'classement.direct': { fr: 'En direct', en: 'Live' },
  'classement.chercher': { fr: 'Chercher un joueur', en: 'Find a player' },
  'classement.complet': { fr: 'Classement complet', en: 'Full leaderboard' },
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
  'boutique.prix-une-fois': { fr: 'Prix, une fois', en: 'Price, once' },
  'boutique.meilleure-valeur': { fr: 'Meilleure valeur', en: 'Best value' },
  'form.obligatoire-sr': { fr: ' (obligatoire)', en: ' (required)' },

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

  // --- Sanctions (23/09/2026) : le casier public d'un joueur ---
  'pr.sanctions-etiquette': { fr: 'Sanctions', en: 'Punishments' },
  'pr.sanctions-titre': { fr: 'Son casier sur le serveur', en: 'Their record on the server' },
  'pr.sanctions-vide': {
    fr: 'Aucune sanction : {p} a un casier vierge.',
    en: 'No punishment: {p} has a clean record.',
  },
  'pr.sanctions-actives': {
    fr: '{n} sanction(s) en cours',
    en: '{n} punishment(s) in force',
  },
  'pr.sanction-ban': { fr: 'Banni', en: 'Banned' },
  'pr.sanction-tempban': { fr: 'Ban temporaire', en: 'Temp ban' },
  'pr.sanction-rankedban': { fr: 'Exclu du ranked', en: 'Ranked ban' },
  'pr.sanction-rankedtempban': { fr: 'Ranked suspendu', en: 'Ranked suspended' },
  'pr.sanction-mute': { fr: 'Muet', en: 'Muted' },
  'pr.sanction-warn': { fr: 'Avertissement', en: 'Warning' },
  'pr.sanction-kick': { fr: 'Expulsé', en: 'Kicked' },
  'pr.sanction-sans-raison': { fr: 'Sans motif précisé', en: 'No reason given' },
  'pr.sanction-etat-active': { fr: 'En cours', en: 'In force' },
  'pr.sanction-etat-levee': { fr: 'Levée', en: 'Lifted' },
  'pr.sanction-etat-expiree': { fr: 'Terminée', en: 'Served' },
  'pr.sanction-jusqu-a': { fr: "En cours jusqu'au {d}", en: 'In force until {d}' },
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
  /* ---------- espace partenaire (/partenaire/<slug>) ---------- */
  'part.meta-titre': { fr: 'Espace partenaire', en: 'Partner area' },
  'part.meta-desc': {
    fr: 'Les joueurs amenés sur LJKITS par un partenaire, et leur temps de jeu.',
    en: 'The players a partner brings to LJKITS, and how long they play.',
  },

  'part.acces-titre': { fr: 'Espace partenaire', en: 'Partner area' },
  'part.acces-chapeau': {
    fr: 'Tes chiffres sont réservés : entre ton identifiant et ton mot de passe.',
    en: 'Your numbers are private: enter your name and password.',
  },
  'part.champ-identifiant': { fr: 'Identifiant', en: 'Name' },
  'part.champ-mot-de-passe': { fr: 'Mot de passe', en: 'Password' },
  'part.entrer': { fr: 'Entrer', en: 'Enter' },
  'part.entrer-en-cours': { fr: 'Vérification…', en: 'Checking…' },
  'part.acces-aide': {
    fr: 'Identifiant et mot de passe sont donnés par le staff LJKITS. Perdu ? Demande-nous un nouveau mot de passe.',
    en: 'The staff gives you both. Lost them? Ask us for a new password.',
  },

  'part.etiquette': { fr: 'Partenaire', en: 'Partner' },
  'part.titre-avant': { fr: 'Les joueurs que tu', en: 'The players you' },
  'part.titre-accent': { fr: 'amènes', en: 'bring in' },
  'part.chapeau': {
    fr: 'Tout ce qui passe par {h}. Les chiffres se mettent à jour à chaque connexion.',
    en: 'Everything coming through {h}. The numbers update on every join.',
  },
  'part.deconnexion': { fr: 'Se déconnecter', en: 'Log out' },
  'part.ferme': {
    fr: 'Cet espace est fermé pour le moment. Contacte le staff LJKITS.',
    en: 'This area is closed for now. Get in touch with the LJKITS staff.',
  },

  'part.periode': { fr: 'Période', en: 'Period' },
  'part.periode-7': { fr: '7 jours', en: '7 days' },
  'part.periode-30': { fr: '30 jours', en: '30 days' },
  'part.periode-90': { fr: '90 jours', en: '90 days' },
  'part.periode-tout': { fr: 'Tout', en: 'All time' },

  'part.joueurs': { fr: 'Joueurs amenés', en: 'Players brought in' },
  'part.joueurs-aide': { fr: 'Ils ont joué au moins une fois sur la période.', en: 'They played at least once in the period.' },
  'part.joueurs-payes': { fr: 'Comptés pour ta rémunération', en: 'Counted for your payout' },
  'part.nouveaux': { fr: 'Nouveaux joueurs', en: 'New players' },
  'part.nouveaux-aide': { fr: 'Leur toute première venue est passée par toi.', en: 'Their very first visit came through you.' },
  'part.revenus': { fr: 'Joueurs revenus', en: 'Returning players' },
  'part.revenus-aide': { fr: 'Venus jouer au moins deux jours différents.', en: 'Played on at least two different days.' },
  'part.temps': { fr: 'Temps de jeu total', en: 'Total playtime' },
  'part.temps-aide': { fr: 'Tous tes joueurs additionnés.', en: 'All your players added up.' },
  'part.temps-moyen': { fr: 'Temps moyen par joueur', en: 'Average per player' },
  'part.sessions': { fr: 'Connexions', en: 'Sessions' },
  'part.sessions-aide': { fr: 'Une par passage sur le serveur.', en: 'One per visit to the server.' },

  'part.graphe-etiquette': { fr: 'Jour par jour', en: 'Day by day' },
  'part.graphe-titre': { fr: 'Les {n} derniers jours', en: 'The last {n} days' },
  'part.graphe-sessions': { fr: 'Connexions', en: 'Sessions' },
  'part.graphe-nouveaux': { fr: 'Nouveaux joueurs', en: 'New players' },
  'part.graphe-vide': { fr: 'Aucune connexion sur ces jours-là.', en: 'No joins on those days.' },
  'part.graphe-jour': { fr: '{d} : {s} connexion(s), {n} nouveau(x)', en: '{d}: {s} session(s), {n} new' },

  'part.table-etiquette': { fr: 'Le détail', en: 'The detail' },
  'part.table-titre': { fr: 'Joueur par joueur', en: 'Player by player' },
  'part.col-joueur': { fr: 'Joueur', en: 'Player' },
  'part.col-premiere': { fr: 'Première venue', en: 'First join' },
  'part.col-sessions': { fr: 'Connexions', en: 'Sessions' },
  'part.col-temps': { fr: 'Temps de jeu', en: 'Playtime' },
  'part.col-derniere': { fr: 'Dernière venue', en: 'Last seen' },
  'part.table-vide': { fr: 'Aucun joueur sur cette période.', en: 'No player in this period.' },
  'part.table-limite': {
    fr: 'Les {n} premiers, du plus gros temps de jeu au plus petit. Tu as amené {t} joueur(s) depuis le début.',
    en: 'The top {n}, from the most playtime down. You have brought in {t} player(s) since day one.',
  },

  'part.attribution': {
    fr: 'Un joueur est compté pour toi s’il est arrivé la PREMIÈRE fois par {h} ; ensuite, tout son temps de jeu t’est attribué, même quand il se reconnecte par l’adresse principale.',
    en: 'A player counts as yours if their FIRST ever join came through {h}; after that all their playtime is credited to you, even when they reconnect through the main address.',
  },
  'part.historique': {
    fr: 'Les joueurs déjà présents avant la mise en service du suivi ne sont attribués à personne : ils n’apparaissent chez aucun partenaire.',
    en: 'Players who were already here before this tracking went live are credited to nobody: they show up for no partner.',
  },
  /* ---------- les joueurs de passage (non attribues) ---------- */
  'part.visiteurs': { fr: 'Revenus par ton IP', en: 'Returning via your IP' },
  'part.visiteurs-aide': {
    fr: 'Déjà connus du serveur : hors rémunération.',
    en: 'Already known to the server: not part of your payout.',
  },
  'part.visiteurs-etiquette': { fr: 'Pour information', en: 'For information' },
  'part.visiteurs-titre': {
    fr: 'Joueurs revenus par ton IP',
    en: 'Players returning through your IP',
  },
  'part.visiteurs-vide': {
    fr: 'Personne d’autre n’est passé par ton adresse sur cette période.',
    en: 'Nobody else came through your address in this period.',
  },
  'part.visiteurs-limite': {
    fr: 'Les {n} premiers, du plus grand nombre de connexions au plus petit.',
    en: 'The top {n}, from the most joins down.',
  },
  'part.visiteurs-note': {
    fr: 'Seuls les NOUVEAUX joueurs sont rémunérés : ceux qui découvrent le serveur par ton adresse. Ceux qui étaient déjà là avant, ou qui sont déjà venus par une autre adresse, apparaissent ici pour information mais ne comptent pas dans ta rémunération.',
    en: 'Only NEW players are paid: the ones who discover the server through your address. Those who were already here, or who first came through another address, are shown here for information only and do not count towards your payout.',
  },
  'part.visiteurs-colonnes': {
    fr: 'Connexions et temps de jeu ne comptent ici que leurs passages par {h}.',
    en: 'Joins and playtime here only count their visits through {h}.',
  },

  /* ---------- la remuneration (/partenaire/<slug>) ---------- */
  'part.paie-etiquette': { fr: 'Ta rémunération', en: 'Your payout' },
  'part.paie-titre': { fr: 'Ce qu’on te doit', en: 'What you are owed' },
  'part.paie-chapeau': {
    fr: 'Tu es payé {p} par nouveau joueur que tu amènes. Le décompte ci-dessous repart de zéro chaque fois que tu confirmes avoir été payé.',
    en: 'You earn {p} for every new player you bring in. The count below restarts from zero each time you confirm a payment.',
  },
  'part.paie-a-encaisser': { fr: 'À encaisser', en: 'To be paid' },
  'part.paie-a-encaisser-aide': { fr: 'Pour la période en cours.', en: 'For the current period.' },
  'part.paie-joueurs': { fr: 'Nouveaux joueurs à payer', en: 'New players to pay' },
  'part.paie-joueurs-aide': { fr: 'Depuis ton dernier versement.', en: 'Since your last payment.' },
  'part.paie-taux': { fr: 'Tarif', en: 'Rate' },
  'part.paie-taux-aide': { fr: 'Par nouveau joueur amené.', en: 'Per new player brought in.' },
  'part.paie-depuis': { fr: 'Période en cours', en: 'Current period' },
  'part.paie-depuis-aide': { fr: 'Ouverte depuis le {d}.', en: 'Open since {d}.' },
  'part.paie-total': { fr: 'Déjà versé', en: 'Already paid' },
  'part.paie-total-aide': { fr: '{n} joueur(s) réglé(s) depuis le début.', en: '{n} player(s) settled since day one.' },
  'part.paie-calcul': {
    fr: '{n} × {p} = {m}',
    en: '{n} × {p} = {m}',
  },

  // ── Téléchargement du screenshare (LJScan) ─────────────────────────────
  'meta.telechargement-titre': { fr: 'LJScan — le screenshare de LJKITS', en: 'LJScan — the LJKITS screenshare tool' },
  'meta.telechargement-desc': {
    fr: "L'outil de vérification que le staff LJKITS demande pendant un screenshare : téléchargement, empreinte et marche à suivre.",
    en: 'The verification tool the LJKITS staff asks for during a screenshare: download, checksum and how to use it.',
  },
  'dl.etiquette': { fr: 'Screenshare', en: 'Screenshare' },
  'dl.h1-1': { fr: 'Télécharger', en: 'Download' },
  'dl.h1-2': { fr: 'LJScan', en: 'LJScan' },
  'dl.chapo': {
    fr: "Un membre du staff t'a demandé un screenshare ? Télécharge l'outil, lance-le et entre le code qu'il t'a donné en jeu. Ça prend deux minutes.",
    en: 'A staff member asked you for a screenshare? Download the tool, run it and enter the code they gave you in game. It takes two minutes.',
  },
  'dl.bouton': { fr: 'Télécharger LJScan', en: 'Download LJScan' },
  'dl.windows': { fr: 'Windows uniquement', en: 'Windows only' },
  'dl.etape1-titre': { fr: 'Télécharge', en: 'Download' },
  'dl.etape1-texte': {
    fr: "Un seul fichier, rien à installer. Garde-le où tu veux, tu peux le supprimer après.",
    en: 'A single file, nothing to install. Keep it wherever you like, you can delete it afterwards.',
  },
  'dl.etape2-titre': { fr: 'Lance-le', en: 'Run it' },
  'dl.etape2-texte': {
    fr: "Windows demande l'autorisation administrateur : l'outil en a besoin pour lire les traces d'exécution du système.",
    en: 'Windows asks for administrator rights: the tool needs them to read the system execution traces.',
  },
  'dl.etape3-titre': { fr: 'Entre ton code', en: 'Enter your code' },
  'dl.etape3-texte': {
    fr: 'Le code à 6 caractères donné en jeu. Le rapport part au staff, tu restes connecté pendant le scan.',
    en: 'The 6-character code given in game. The report goes to the staff; stay connected during the scan.',
  },
  'dl.fait-titre': { fr: "Ce que l'outil regarde", en: 'What the tool looks at' },
  'dl.fait-1': {
    fr: "Les traces d'exécution laissées par Windows : ce qui a tourné sur la machine, et quand.",
    en: 'The execution traces Windows keeps: what ran on the machine, and when.',
  },
  'dl.fait-2': {
    fr: 'La mémoire du jeu, pour y retrouver la signature des clients de triche connus.',
    en: "The game's memory, to find the signature of known cheat clients.",
  },
  'dl.fait-3': {
    fr: "Les effacements suspects : un historique vidé juste avant un screenshare, ça se voit.",
    en: 'Suspicious wipes: a history cleared right before a screenshare shows up.',
  },
  'dl.pasfait-titre': { fr: 'Ce qu\'il ne fait pas', en: 'What it does not do' },
  'dl.pasfait-1': {
    fr: "Il ne lit pas tes documents, tes photos, tes mots de passe ni tes conversations.",
    en: 'It does not read your documents, photos, passwords or conversations.',
  },
  'dl.pasfait-2': {
    fr: "Il ne filme pas ton écran, n'enregistre pas tes frappes et ne reste pas sur ta machine.",
    en: 'It does not record your screen or keystrokes, and it does not stay on your machine.',
  },
  'dl.pasfait-3': {
    fr: 'Il ne bannit personne : il produit un rapport, et ce sont des humains qui décident.',
    en: 'It bans no one: it produces a report, and humans decide.',
  },
  'dl.verif-titre': { fr: 'Antivirus et vérification', en: 'Antivirus and verification' },
  'dl.verif-texte': {
    fr: "Le fichier n'est pas signé : Windows SmartScreen ou ton antivirus peuvent s'en méfier, c'est normal pour un outil distribué par un serveur. Tu n'es pas obligé de nous croire sur parole — compare l'empreinte de ce que tu as téléchargé avec celle affichée ici.",
    en: 'The file is unsigned: Windows SmartScreen or your antivirus may complain, which is expected for a tool distributed by a server. You do not have to take our word for it — compare the checksum of your download with the one shown here.',
  },
  'dl.indisponible': {
    fr: "Le téléchargement est momentanément indisponible. Préviens le staff sur Discord : il te donnera le fichier directement.",
    en: 'The download is temporarily unavailable. Tell the staff on Discord: they will send you the file directly.',
  },
  'dl.clair-titre': { fr: 'En clair, ça fait quoi ?', en: 'In plain words, what does it do?' },
  'dl.clair-1': {
    fr: "Windows garde la trace de ce qui se lance sur ton PC — un peu comme un ticket de caisse. LJScan lit ces traces et les compare à une liste de logiciels de triche connus. Il regarde aussi la mémoire de ton Minecraft, parce que c'est là qu'un client de triche se voit vraiment.",
    en: 'Windows keeps a record of what runs on your PC — a bit like a receipt. LJScan reads those records and compares them with a list of known cheat software. It also looks at your Minecraft memory, because that is where a cheat client really shows.',
  },
  'dl.clair-2': {
    fr: "À la fin, il envoie un rapport au staff : ce qu'il a trouvé, où, et à quelle heure. Toi, tu gardes le fichier ou tu le supprimes, il n'installe rien et ne reste pas sur ta machine.",
    en: 'At the end it sends a report to the staff: what it found, where, and at what time. You keep the file or delete it — it installs nothing and does not stay on your machine.',
  },
  'dl.clair-3': {
    fr: "Et il peut jouer en ta faveur : un scan qui ne trouve rien, c'est écrit noir sur blanc dans le rapport que le staff lit.",
    en: 'And it can work in your favour: a scan that finds nothing is written plainly in the report the staff reads.',
  },
  'dl.questions-titre': { fr: 'Les questions qu\'on nous pose', en: 'Questions we get asked' },
  'dl.q1': { fr: 'Ça installe quelque chose ?', en: 'Does it install anything?' },
  'dl.r1': {
    fr: "Non. Un seul fichier, que tu lances et que tu peux supprimer juste après. Aucun service, aucun démarrage automatique, rien qui tourne une fois le scan terminé.",
    en: 'No. A single file, which you run and can delete right after. No service, no autostart, nothing running once the scan is done.',
  },
  'dl.q2': { fr: 'Vous voyez mes fichiers personnels ?', en: 'Can you see my personal files?' },
  'dl.r2': {
    fr: "Non. L'outil cherche des noms de programmes et des traces d'exécution, pas le contenu de tes dossiers. Il ne lit ni tes documents, ni tes photos, ni tes messages, et il n'envoie aucun fichier à part son propre rapport.",
    en: 'No. The tool looks for program names and execution traces, not the contents of your folders. It does not read your documents, photos or messages, and it uploads no file other than its own report.',
  },
  'dl.q3': { fr: 'Combien de temps ça prend ?', en: 'How long does it take?' },
  'dl.r3': {
    fr: 'Quelques minutes. Reste connecté au serveur pendant le scan : c\'est ce qui permet au staff de savoir que c\'est bien toi.',
    en: 'A few minutes. Stay connected to the server during the scan: that is how the staff knows it is really you.',
  },
  'dl.q4': { fr: 'Je peux refuser ?', en: 'Can I refuse?' },
  'dl.r4': {
    fr: "Oui, personne ne lance rien sur ton PC sans que tu cliques. Mais un refus reste une réponse, et le staff en tire ses conclusions comme pour n'importe quelle vérification — le règlement s'applique.",
    en: 'Yes — nothing runs on your PC unless you click. But a refusal is still an answer, and the staff draws its conclusions as with any other check: the rules apply.',
  },

  'pied.telechargement': { fr: 'Screenshare', en: 'Screenshare' },

  'part.paie-doublons': {
    fr: '{n} compte(s) écarté(s) : une même personne revenue avec un autre compte.',
    en: '{n} account(s) set aside: the same person coming back on another account.',
  },

  'part.paie-bouton': { fr: 'J’ai été payé cette semaine', en: 'I have been paid this week' },
  'part.paie-confirmer': { fr: 'Oui, j’ai bien reçu {m}', en: 'Yes, I received {m}' },
  'part.paie-annuler': { fr: 'Annuler', en: 'Cancel' },
  'part.paie-en-cours': { fr: 'Enregistrement…', en: 'Saving…' },
  'part.paie-question': {
    fr: 'Confirmes-tu avoir reçu {m} pour {n} nouveau(x) joueur(s) ? Le compteur repartira de zéro.',
    en: 'Do you confirm receiving {m} for {n} new player(s)? The counter will restart from zero.',
  },
  'part.paie-rien': {
    fr: 'Aucun nouveau joueur depuis ton dernier versement : rien à confirmer pour le moment.',
    en: 'No new player since your last payment: nothing to confirm right now.',
  },
  'part.paie-note': {
    fr: 'Ce bouton n’efface AUCUN joueur. Il pose simplement une date : le compteur ne compte plus que les joueurs arrivés après. Tout reste visible dans les tableaux, et chaque versement est archivé ci-dessous.',
    en: 'This button deletes NO player. It only sets a date: the counter then only counts players who arrive after it. Everything stays visible in the tables, and every payment is archived below.',
  },
  'part.paie-avertissement': {
    fr: 'À cliquer une fois le virement reçu, pas avant.',
    en: 'Click it once the money has arrived, not before.',
  },

  'part.semaines-etiquette': { fr: 'Semaine par semaine', en: 'Week by week' },
  'part.semaines-titre': { fr: 'Tes {n} dernières semaines', en: 'Your last {n} weeks' },
  'part.col-semaine': { fr: 'Semaine', en: 'Week' },
  'part.col-nouveaux': { fr: 'Nouveaux joueurs', en: 'New players' },
  'part.col-montant': { fr: 'Montant', en: 'Amount' },
  'part.col-etat': { fr: 'État', en: 'Status' },
  'part.etat-reglee': { fr: 'Payée', en: 'Paid' },
  'part.etat-partielle': { fr: 'En partie payée', en: 'Partly paid' },
  'part.etat-en-cours': { fr: 'À payer', en: 'To pay' },
  'part.semaine-du': { fr: 'du {a} au {b}', en: '{a} → {b}' },
  'part.semaines-note': {
    fr: 'Les montants par semaine sont indicatifs : un versement court d’une confirmation à la suivante et peut tomber au milieu d’une semaine. Le tableau des versements, lui, fait foi.',
    en: 'Weekly amounts are indicative: a payment runs from one confirmation to the next and can land mid-week. The payments table is what counts.',
  },

  'part.paiements-etiquette': { fr: 'L’historique', en: 'The history' },
  'part.paiements-titre': { fr: 'Versements confirmés', en: 'Confirmed payments' },
  'part.col-periode': { fr: 'Période réglée', en: 'Period settled' },
  'part.col-confirme': { fr: 'Confirmé le', en: 'Confirmed on' },
  'part.paiements-vide': {
    fr: 'Aucun versement confirmé pour l’instant.',
    en: 'No payment confirmed yet.',
  },
  'part.paiements-total': {
    fr: 'Total versé : {m} pour {n} joueur(s).',
    en: 'Total paid: {m} for {n} player(s).',
  },

  'part.confidentialite': {
    fr: 'Aucune adresse IP, aucune donnée personnelle : des pseudos, des dates et des durées.',
    en: 'No IP address, no personal data: usernames, dates and durations only.',
  },

  /* ======================================================================
   *  LES AVIS DE JOUEURS  (/avis, 23/09/2026)
   * ====================================================================== */
  'meta.avis-titre': { fr: 'Ton avis sur le serveur', en: 'Your feedback' },
  'meta.avis-desc': {
    fr: 'Cinq questions, une minute : dis-nous ce qui va, ce qui ne va pas, et ce qu’on devrait corriger en priorité.',
    en: 'Five questions, one minute: tell us what works, what doesn’t, and what we should fix first.',
  },

  'pied.avis': { fr: 'Donner mon avis', en: 'Give feedback' },
  'avis.etiquette': { fr: 'Ton avis', en: 'Your feedback' },
  'avis.titre': {
    fr: 'Dis-nous ce qu’on doit améliorer',
    en: 'Tell us what we should improve',
  },
  'avis.chapeau': {
    fr: 'On règle le serveur sur ce qu’on entend en jeu et sur Discord — donc sur l’avis des plus bavards. Cinq questions pour entendre les autres. Le classement, les modes et le cashprize de {c} par mois se décident aussi là-dessus.',
    en: 'We tune the server on what we hear in game and on Discord — that is, on the loudest voices. Five questions to hear everyone else. The leaderboard, the modes and the {c} monthly cashprize are decided on this too.',
  },
  'avis.duree': { fr: 'Une minute · pseudo facultatif', en: 'One minute · username optional' },

  'avis.q1': { fr: 'Le serveur aujourd’hui, tu lui mets combien ?', en: 'How would you rate the server today?' },
  'avis.q1-aide': {
    fr: 'Ta première impression, sans réfléchir trop longtemps.',
    en: 'Your gut feeling — don’t overthink it.',
  },
  'avis.note-1': { fr: 'à revoir', en: 'needs work' },
  'avis.note-2': { fr: 'moyen', en: 'meh' },
  'avis.note-3': { fr: 'correct', en: 'decent' },
  'avis.note-4': { fr: 'très bien', en: 'very good' },
  'avis.note-5': { fr: 'excellent', en: 'excellent' },

  'avis.q2': { fr: 'Sur quoi on doit travailler en priorité ?', en: 'What should we work on first?' },
  'avis.q2-aide': {
    fr: 'Un seul choix : c’est celui qu’on traitera en premier.',
    en: 'Pick one — that’s the one we’ll tackle first.',
  },
  'avis.priorite-combat': { fr: 'Le combat : knockback, hits, soupe', en: 'Combat: knockback, hits, soup' },
  'avis.priorite-triche': { fr: 'La triche et l’anticheat', en: 'Cheating and the anticheat' },
  'avis.priorite-modes': { fr: 'Les modes de jeu (HG, Digger, Iron Soup…)', en: 'Game modes (HG, Digger, Iron Soup…)' },
  'avis.priorite-cartes': { fr: 'Les cartes et les arènes', en: 'Maps and arenas' },
  'avis.priorite-joueurs': { fr: 'Le nombre de joueurs en ligne', en: 'How many players are online' },
  'avis.priorite-boutique': { fr: 'La boutique, les grades, les kits', en: 'Shop, ranks and kits' },
  'avis.priorite-autre': { fr: 'Autre chose (dis-le plus bas)', en: 'Something else (say it below)' },

  'avis.q3': { fr: 'Qu’est-ce qui t’empêche de jouer plus souvent ?', en: 'What keeps you from playing more often?' },
  'avis.q3-aide': { fr: 'Plusieurs réponses possibles, ou aucune.', en: 'Pick as many as you like, or none.' },
  'avis.frein-peu-de-joueurs': { fr: 'Il n’y a pas assez de monde en ligne', en: 'Not enough players online' },
  'avis.frein-attente': { fr: 'J’attends trop longtemps en file', en: 'Queues take too long' },
  'avis.frein-gameplay': { fr: 'Le gameplay ne me convient pas', en: 'The gameplay isn’t for me' },
  'avis.frein-tricheurs': { fr: 'Je tombe sur des tricheurs', en: 'I run into cheaters' },
  'avis.frein-horaires': { fr: 'Je ne suis pas là aux bonnes heures', en: 'I’m not around at the right times' },
  'avis.frein-aucun': { fr: 'Rien, je joue autant que je veux', en: 'Nothing, I play as much as I want' },

  'avis.q4': { fr: 'Savais-tu qu’il y a {c} à gagner chaque mois ?', en: 'Did you know there’s {c} to win every month?' },
  'avis.q4-aide': {
    fr: 'Cette question nous juge nous, pas toi : si personne n’est au courant, c’est qu’on le dit mal.',
    en: 'This question is about us, not you: if nobody knows, we’re not saying it loudly enough.',
  },
  'avis.cashprize-oui': { fr: 'Oui, je le savais', en: 'Yes, I knew' },
  'avis.cashprize-vaguement': { fr: 'J’en avais entendu parler', en: 'I’d heard about it' },
  'avis.cashprize-non': { fr: 'Non, je ne savais pas', en: 'No, I had no idea' },

  'avis.q5': { fr: 'Une suggestion, un bug, une idée ?', en: 'A suggestion, a bug, an idea?' },
  'avis.q5-aide': {
    fr: 'C’est la réponse qu’on lit en premier. Sois précis, même si c’est sévère.',
    en: 'This is the one we read first. Be specific, even if it stings.',
  },
  'avis.q5-exemple': {
    fr: 'Ex. : le knockback du kit Anchor me sort de l’arène, il manque un mode 2v2, la file HG est vide le matin…',
    en: 'e.g. Anchor’s knockback throws me out of the arena, a 2v2 mode is missing, the HG queue is empty in the morning…',
  },

  'avis.pseudo': { fr: 'Ton pseudo (facultatif)', en: 'Your username (optional)' },
  'avis.pseudo-aide': {
    fr: 'Laisse vide pour rester anonyme. Le donner permet au staff de revenir vers toi — et rien d’autre.',
    en: 'Leave it empty to stay anonymous. Giving it just lets the staff get back to you — nothing else.',
  },
  'avis.pseudo-exemple': { fr: 'TonPseudo', en: 'YourName' },

  'avis.envoyer': { fr: 'Envoyer mon avis', en: 'Send my feedback' },
  'avis.envoi': { fr: 'Envoi…', en: 'Sending…' },

  'avis.merci-titre': { fr: 'Merci, c’est enregistré', en: 'Thanks — it’s in' },
  'avis.merci-texte': {
    fr: 'On lit tous les avis. Les plus fréquents finissent en chantier, et les corrections apparaissent sur le Discord.',
    en: 'We read every single one. The most frequent ones become actual work, and the fixes show up on Discord.',
  },
  'avis.merci-cashprize': {
    fr: 'Au fait : {c} sont remis en jeu chaque mois, partagés entre les trois premiers du classement ({p}). Il suffit de lier son Discord et de jouer en ranked.',
    en: 'By the way: {c} is up for grabs every month, split between the top three of the leaderboard ({p}). Just link your Discord and play ranked.',
  },

} as const satisfies Record<string, Entree>

export type CleTexte = keyof typeof DICO

/** Le texte de l'interface, dans la langue demandée. */
export function t(locale: Locale, cle: CleTexte): string {
  return DICO[cle][locale]
}
