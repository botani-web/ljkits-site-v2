/**
 * Script de peuplement de la base — `npm run db:seed`.
 *
 * Idempotent : chaque kit est upserté sur son slug, chaque section de
 * règlement sur un identifiant fixe, l'admin sur son e-mail. On peut donc
 * le relancer autant de fois qu'on veut sans créer de doublon.
 *
 * ATTENTION : relancer le seed REMET le contenu de référence ci-dessous.
 * Si tu as modifié un kit ou réordonné la liste depuis l'admin, ces
 * modifications seront écrasées pour les entrées listées ici. C'est un outil
 * d'amorçage, pas une sauvegarde.
 *
 * Cas particulier à connaître : l'upsert se fait sur le SLUG. Si tu as renommé
 * un kit d'origine depuis l'admin (par exemple archer → archer-longue-portee),
 * le seed ne le retrouve plus et en RECRÉE un sous l'ancien slug — tu te
 * retrouves avec les deux. À vérifier après chaque seed sur une base déjà
 * utilisée.
 */
import { PrismaClient, type TypeKit } from '@prisma/client'
import { hash } from 'bcryptjs'

// Charge .env sans dépendance externe (Node 20.6+).
try {
  process.loadEnvFile('.env')
} catch {
  // Pas de fichier .env : les variables viennent de l'environnement (Vercel, CI).
}

const prisma = new PrismaClient()

type KitDeReference = {
  slug: string
  nom: string
  kanji: string | null
  role: string
  descriptionCourte: string
  descriptionLongue: string
  prixCoins: number
  prixEurosCentimes: number | null
  type: TypeKit
  achetable: boolean
  kitDeDepart: boolean
  caracteristiques: { libelle: string; valeur: string }[]
}

/**
 * Les 21 kits, dans l'ordre de la maquette kits.html :
 * 15 kits classiques par prix croissant, puis 6 kits exclusifs.
 * L'index dans ce tableau donne le champ `ordre`.
 */
const KITS: KitDeReference[] = [
  {
    slug: 'pvp',
    nom: 'PvP',
    kanji: null,
    role: 'Fondamental',
    descriptionCourte:
      "L'épée, les soupes, rien d'autre. Celui qui gagne avec le PvP gagne avec n'importe quoi.",
    descriptionLongue: `Le kit de départ, et le seul qui ne triche jamais avec toi : une épée en pierre, un inventaire plein de soupes, aucune capacité.

Tout ce que tu fais avec le PvP vient de ton **aim**, de ton **timing de soupe** et de ta lecture du knockback. C'est le kit de référence — celui contre lequel se mesure la valeur de tous les autres.

Si tu débutes sur LJKITS, reste dessus le temps de prendre les réflexes du soup 1.8. Le reste viendra tout seul.`,
    prixCoins: 0,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: true,
    caracteristiques: [
      { libelle: 'Capacité', valeur: 'Aucune' },
      { libelle: 'Inventaire', valeur: 'Épée + soupes' },
    ],
  },
  {
    slug: 'archer',
    nom: 'Archer',
    kanji: null,
    role: 'Distance',
    descriptionCourte:
      'Un arc et un carquois plein. Tu harcèles, tu finis, tu ne tiens pas la mêlée.',
    descriptionLongue: `Un arc et soixante-quatre flèches. À pleine charge, une flèche retire environ **2,7 ❤** — de quoi finir une cible déjà entamée, jamais de quoi en tuer une en pleine santé.

L'Archer se joue en périphérie : tu ouvres les combats des autres, tu punis ceux qui boivent leur soupe à découvert, et tu décroches dès qu'on te colle.

En mêlée, tu n'as que l'épée de base et aucun avantage. Garder ses distances n'est pas une option de jeu, c'est la condition pour que le kit fonctionne.`,
    prixCoins: 300,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Arc + 64 flèches' },
      { libelle: 'Dégâts', valeur: '2,7 ❤ pleine charge' },
    ],
  },
  {
    slug: 'fisherman',
    nom: 'Fisherman',
    kanji: null,
    role: 'Accroche',
    descriptionCourte:
      "La canne ramène ta cible vers toi. Le kit qui empêche les autres de décrocher du combat.",
    descriptionLongue: `Une canne à pêche, **3 secondes** de rechargement, et un principe simple : personne ne part quand tu ne veux pas.

Le Fisherman ramène vers lui la cible qu'il accroche. Ça sert à rattraper un fuyard à faible vie, à arracher quelqu'un du bord d'une plateforme, ou à casser la distance d'un Archer qui te tire dessus depuis l'autre bout de la map.

C'est un kit de contrôle : il ne fait presque aucun dégât, il décide juste où se passe le combat.`,
    prixCoins: 400,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Canne à pêche' },
      { libelle: 'Cooldown', valeur: '3 s' },
    ],
  },
  {
    slug: 'magma',
    nom: 'Magma',
    kanji: null,
    role: 'Riposte',
    descriptionCourte:
      "Qui te frappe s'enflamme. Purement défensif : tu ne déclenches rien, tu punis.",
    descriptionLongue: `Tu n'as aucun bouton à presser. Quand un joueur te touche en mêlée, il prend **2 secondes de feu**, avec un rechargement de **4 secondes** entre deux déclenchements.

Le Magma ne gagne pas un combat tout seul : il le rend coûteux. Contre un adversaire qui spamme les clics sans jamais décrocher, les brûlures s'accumulent et le forcent à boire plus souvent que toi.

C'est le kit le plus passif du serveur, et sans doute le plus sous-estimé en combat de groupe.`,
    prixCoins: 500,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Effet', valeur: "Feu 2 s sur l'agresseur" },
      { libelle: 'Cooldown', valeur: '4 s' },
    ],
  },
  {
    slug: 'viper',
    nom: 'Viper',
    kanji: null,
    role: 'Poison',
    descriptionCourte:
      'Chaque coup empoisonne. Les dégâts s’accumulent pendant que ta cible boit ses soupes.',
    descriptionLongue: `Chacun de tes coups en mêlée applique **Poison I pendant 4 secondes**.

Le poison ne tue pas — il ne descend jamais sous un demi-cœur — mais il annule une partie de chaque soupe que boit ta cible. Sur un échange long, l'adversaire vide son inventaire deux fois plus vite que toi.

Le Viper n'a aucune portée : tout se joue au corps à corps, et il faut tenir la distance pour que le poison ait le temps de faire son travail.`,
    prixCoins: 500,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Effet', valeur: 'Poison I · 4 s' },
      { libelle: 'Portée', valeur: 'Mêlée uniquement' },
    ],
  },
  {
    slug: 'kangaroo',
    nom: 'Kangaroo',
    kanji: null,
    role: 'Mobilité',
    descriptionCourte:
      'Un bond en avant qui traverse les trous et les groupes. Pour engager comme pour fuir.',
    descriptionLongue: `Une fusée, **5 secondes** de rechargement, et un bond qui t'envoie loin devant.

Le Kangaroo sert autant à entrer dans un combat qu'à en sortir. Il traverse les vides de la map, saute par-dessus une mêlée pour aller chercher l'Archer derrière, ou décroche d'un adversaire qui te colle.

Le seul vrai risque, c'est toi : un bond mal orienté au-dessus du vide ne se rattrape pas.`,
    prixCoins: 800,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Fusée' },
      { libelle: 'Cooldown', valeur: '5 s' },
    ],
  },
  {
    slug: 'anchor',
    nom: 'Anchor',
    kanji: null,
    role: 'Zone',
    descriptionCourte:
      "Une aura permanente qui ralentit tout le monde autour. Personne ne s'échappe d'un Anchor collé.",
    descriptionLongue: `Une aura de **5 blocs** qui applique **Lenteur I** à tous les joueurs autour de toi, en permanence et sans rechargement.

L'Anchor ne fait pas de dégâts : il retire aux autres leur capacité à choisir la distance. Un adversaire qui veut boire sa soupe tranquillement doit d'abord sortir de ton rayon, et il en sort lentement.

C'est le kit qui punit le plus durement les joueurs habitués à décrocher dès qu'ils passent sous la moitié de leur vie.`,
    prixCoins: 1000,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Effet', valeur: 'Lenteur I' },
      { libelle: 'Rayon', valeur: '5 blocs' },
    ],
  },
  {
    slug: 'stomper',
    nom: 'Stomper',
    kanji: null,
    role: 'Impact',
    descriptionCourte:
      'Tu ne prends plus de dégâts de chute : tu les redistribues en atterrissant. La map est verticale, sers-t’en.',
    descriptionLongue: `Les dégâts de chute sont **annulés** pour toi. À l'atterrissage, ils sont convertis en dégâts de zone : jusqu'à **4 ❤** dans un rayon de **4 blocs**, proportionnellement à la hauteur de la chute.

Le Stomper transforme chaque plateforme haute de la map en arme. Il faut apprendre les points de saut, et savoir viser un groupe plutôt qu'une cible isolée : l'impact touche tout le monde.

Sans dénivelé, c'est un kit PvP ordinaire — son intérêt dépend entièrement de la map.`,
    prixCoins: 1200,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Chute', valeur: 'Annulée' },
      { libelle: 'Impact', valeur: '4 ❤ max · rayon 4' },
    ],
  },
  {
    slug: 'vampire',
    nom: 'Vampire',
    kanji: null,
    role: 'Soin',
    descriptionCourte:
      "Chaque coup porté te rend un peu de vie. Sur un combat long, l'écart devient énorme.",
    descriptionLongue: `**+0,5 ❤** rendus à chaque coup porté en mêlée. C'est peu. Sur un combat de trente secondes, c'est une dizaine de soupes économisées.

Le Vampire récompense l'agressivité continue : plus tu touches, moins tu bois, et moins tu bois plus tu peux frapper. À l'inverse, un Vampire qui rate ses coups n'a strictement aucun avantage.

Aucun effet à distance : seuls les coups d'épée déclenchent le vol de vie.`,
    prixCoins: 1200,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Vol de vie', valeur: '+0,5 ❤ par coup' },
      { libelle: 'Portée', valeur: 'Mêlée uniquement' },
    ],
  },
  {
    slug: 'switcher',
    nom: 'Switcher',
    kanji: null,
    role: 'Disruption',
    descriptionCourte:
      'Une boule de neige et vous échangez de place. Le kit troll par excellence — et le meilleur ami du vide.',
    descriptionLongue: `Seize boules de neige. Celle qui touche un joueur **échange vos deux positions**, instantanément.

Le Switcher fait très peu de dégâts et beaucoup de dégâts indirects : il place un adversaire au-dessus du vide, l'arrache à sa team pour l'envoyer au milieu de la tienne, ou te sort d'une mêlée en y jetant quelqu'un d'autre.

Seize munitions, pas une de plus : chaque échange doit servir à quelque chose.`,
    prixCoins: 1500,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Item', valeur: '16 boules de neige' },
      { libelle: 'Effet', valeur: 'Échange de position' },
    ],
  },
  {
    slug: 'berserker',
    nom: 'Berserker',
    kanji: null,
    role: 'Dernier souffle',
    descriptionCourte:
      'Sous 35 % de vie, tu frappes plus fort. Rester bas devient un choix tactique.',
    descriptionLongue: `Sous **3,5 ❤** — soit 35 % de ta vie — tu gagnes **Force I** tant que tu n'es pas remonté au-dessus du seuil.

Le Berserker inverse le réflexe du soup : boire sa soupe te fait perdre ton bonus. Bien joué, ça veut dire rester volontairement bas pour finir un adversaire avant lui. Mal joué, ça veut dire mourir avec un demi-cœur et une soupe pleine dans l'inventaire.

C'est le kit le plus risqué de la liste, et un des plus rapides à conclure un duel.`,
    prixCoins: 1500,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Effet', valeur: 'Force I' },
      { libelle: 'Seuil', valeur: 'Sous 3,5 ❤' },
    ],
  },
  {
    slug: 'thor',
    nom: 'Thor',
    kanji: null,
    role: 'Burst',
    descriptionCourte:
      "La foudre tombe où tu vises. Dégâts de zone, et tout le monde voit d'où ça vient.",
    descriptionLongue: `Une hache en fer, **25 blocs** de portée, **4 blocs** de rayon, **8 secondes** de rechargement. Tu vises, la foudre tombe.

Le Thor est le kit d'ouverture par excellence : il entame un groupe entier avant même le contact. En contrepartie, l'éclair est visible et bruyant — après le premier coup, toute l'arène sait où tu es et ce que tu joues.

Huit secondes, c'est long. Un Thor qui gâche sa foudre est un kit PvP ordinaire pendant huit secondes.`,
    prixCoins: 2000,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Hache en fer' },
      { libelle: 'Portée', valeur: '25 blocs · rayon 4' },
      { libelle: 'Cooldown', valeur: '8 s' },
    ],
  },
  {
    slug: 'gladiator',
    nom: 'Gladiator',
    kanji: null,
    role: 'Duel',
    descriptionCourte:
      'Tu enfermes ta cible avec toi dans une cage. Plus de gank, plus de fuite : un vrai 1v1.',
    descriptionLongue: `Un bâton de blaze qui vous enferme, toi et ta cible, dans une cage pendant **30 secondes**. Rechargement : **45 secondes**.

Le Gladiator isole. Il sort un joueur d'une mêlée où tu serais à trois contre un, ou coince un fuyard qui allait rejoindre sa team. Une fois la cage posée, il n'y a plus que deux joueurs, deux épées et deux inventaires de soupes.

À utiliser avec discernement : tu es enfermé aussi. Choisir la mauvaise cible, c'est offrir trente secondes de duel perdu d'avance.`,
    prixCoins: 2500,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Bâton de blaze' },
      { libelle: 'Durée', valeur: '30 s en cage' },
      { libelle: 'Cooldown', valeur: '45 s' },
    ],
  },
  {
    slug: 'ninja',
    nom: 'Ninja',
    kanji: null,
    role: 'Chasse',
    descriptionCourte:
      'Speed II en permanence, et un sneak te téléporte sur le dernier joueur frappé. Personne ne décroche.',
    descriptionLongue: `**Vitesse II** en permanence, et un sneak qui te téléporte sur le dernier joueur que tu as frappé. La marque reste valable **15 secondes**, la téléportation se recharge en **10 secondes**.

Le Ninja est le kit de poursuite du serveur. Un adversaire qui décroche à un cœur ne s'en sort pas : tu le marques, tu le laisses partir, tu le rejoins.

La vitesse permanente est aussi son défaut — elle rend la gestion du knockback 1.8 plus délicate, et il est facile de dépasser sa cible en pleine mêlée.`,
    prixCoins: 2500,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Passif', valeur: 'Vitesse II' },
      { libelle: 'Marque', valeur: 'Valable 15 s' },
      { libelle: 'Cooldown', valeur: '10 s' },
    ],
  },
  {
    slug: 'phantom',
    nom: 'Phantom',
    kanji: null,
    role: 'Furtif',
    descriptionCourte:
      "Invisible tant que tu ne touches à rien. Frapper te révèle : c'est un kit d'approche, pas de combat.",
    descriptionLongue: `**Invisibilité** permanente, tant que tu ne fais rien. Frapper te révèle pendant **8 secondes**, être touché pendant **5 secondes**.

Le Phantom ne gagne pas les combats, il choisit quand ils commencent. Tu traverses l'arène sans être vu, tu te places, et tu ouvres sur la cible la plus faible — après quoi tu es un kit PvP ordinaire pendant huit secondes.

Attention : l'invisibilité ne cache ni les particules ni les objets que tu tiens. Les joueurs attentifs te repèrent quand même.`,
    prixCoins: 3500,
    prixEurosCentimes: null,
    type: 'GRATUIT',
    achetable: false,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Passif', valeur: 'Invisibilité' },
      { libelle: 'Révélé', valeur: '8 s si tu frappes' },
      { libelle: 'Révélé', valeur: '5 s si tu es touché' },
    ],
  },

  // ----------------------------- KITS EXCLUSIFS -----------------------------

  {
    slug: 'yumi',
    nom: 'Yumi',
    kanji: '弓',
    role: 'Contrôle',
    descriptionCourte:
      'Des flèches qui font à peine mal mais ralentissent net. Tu ne tues pas : tu livres tes cibles aux autres.',
    descriptionLongue: `Un arc et soixante-quatre flèches, mais des dégâts **très réduits** — et **Lenteur I pendant 3 secondes** sur chaque touche.

Le Yumi est l'anti-Archer : là où l'Archer finit les blessés, le Yumi prépare les vivants. Une cible ralentie ne décroche plus, n'esquive plus, et devient le problème de ta team plutôt que le tien.

C'est un kit qui ne monte pas au classement des kills. C'est aussi celui qui décide le plus de combats.`,
    prixCoins: 12000,
    prixEurosCentimes: 400,
    type: 'EXCLUSIF',
    achetable: true,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Item', valeur: 'Arc + 64 flèches' },
      { libelle: 'Dégâts', valeur: 'Très réduits' },
      { libelle: 'Effet', valeur: 'Lenteur I · 3 s' },
    ],
  },
  {
    slug: 'kitsune',
    nom: 'Kitsune',
    kanji: '狐',
    role: 'Tromperie',
    descriptionCourte:
      "Tu laisses un leurre à ton image et tu décroches. Aucun dégât — juste le doute, au bon moment.",
    descriptionLongue: `Un leurre **à ton skin**, qui reste **5 secondes** avant de partir en fumée. Zéro dégât, zéro effet.

Le Kitsune n'achète que du temps, et seulement contre des adversaires qui regardent l'écran. En mêlée confuse, le leurre absorbe deux ou trois coups pendant que tu contournes ; en duel contre un joueur attentif, il ne trompe personne.

C'est le kit le plus dépendant du niveau d'en face — et le plus satisfaisant quand il marche.`,
    prixCoins: 15000,
    prixEurosCentimes: 400,
    type: 'EXCLUSIF',
    achetable: true,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Effet', valeur: 'Leurre à ton skin' },
      { libelle: 'Durée', valeur: '5 s puis fumée' },
    ],
  },
  {
    slug: 'tanuki',
    nom: 'Tanuki',
    kanji: '狸',
    role: 'Embuscade',
    descriptionCourte:
      "Tu te déguises en bloc de la map, à condition de ne plus bouger d'un pixel. Pour piéger ou disparaître.",
    descriptionLongue: `Tu prends l'apparence d'un **bloc de la map** pendant **4 secondes**, à la stricte condition de rester **parfaitement immobile**. Le moindre déplacement rompt le déguisement.

Le Tanuki sert à deux choses : disparaître d'une poursuite en se figeant dans un décor, et tendre une embuscade sur un couloir de passage.

Les quatre secondes passent vite, et l'immobilité totale est plus difficile à tenir qu'il n'y paraît en plein combat.`,
    prixCoins: 15000,
    prixEurosCentimes: 400,
    type: 'EXCLUSIF',
    achetable: true,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Effet', valeur: 'Déguisement en bloc' },
      { libelle: 'Durée', valeur: '4 s · immobile' },
    ],
  },
  {
    slug: 'kenshi',
    nom: 'Kenshi',
    kanji: '剣士',
    role: 'Duelliste',
    descriptionCourte:
      "Tes trois premiers coups sur une cible frappent plus fort. Après, la lame s'émousse : il faut décrocher pour la ré-aiguiser.",
    descriptionLongue: `**+15 % de dégâts** sur les **trois premiers coups** portés à une cible donnée. Passé ces trois coups, la lame s'émousse contre elle, et il faut **10 secondes sans la toucher** pour retrouver le bonus.

Le Kenshi récompense un jeu de duelliste : entrer, placer trois coups nets, décrocher, revenir. C'est exactement l'inverse du Vampire, qui veut rester collé.

Le compteur est par cible : en combat de groupe, alterner les adversaires te garde en permanence sur des coups bonifiés.`,
    prixCoins: 18000,
    prixEurosCentimes: 400,
    type: 'EXCLUSIF',
    achetable: true,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Bonus', valeur: '+15 % de dégâts' },
      { libelle: 'Portée', valeur: '3 coups par cible' },
      { libelle: 'Recharge', valeur: '10 s sans la toucher' },
    ],
  },
  {
    slug: 'onryo',
    nom: 'Onryo',
    kanji: '怨霊',
    role: 'Rancune',
    descriptionCourte:
      "À ta mort, ton fantôme s'accroche à ton tueur et le ralentit. Ça ne te sauve pas — ça se paie.",
    descriptionLongue: `Le seul kit du serveur dont la capacité se déclenche à **ta mort** : ton fantôme s'accroche à ton tueur et lui applique **Lenteur pendant 5 secondes**.

L'Onryo ne t'aide jamais à survivre. Il fait de ta mort un problème pour celui qui te l'a infligée — cinq secondes de lenteur en pleine arène, c'est souvent le temps qu'il faut à quelqu'un d'autre pour le finir.

En team, c'est un kit de sacrifice assumé. En solo, c'est surtout une question de principe.`,
    prixCoins: 18000,
    prixEurosCentimes: 400,
    type: 'EXCLUSIF',
    achetable: true,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Déclencheur', valeur: 'Ta mort' },
      { libelle: 'Effet', valeur: 'Lenteur sur le tueur' },
      { libelle: 'Durée', valeur: '5 s' },
    ],
  },
  {
    slug: 'sakura',
    nom: 'Sakura',
    kanji: '桜',
    role: 'Soutien',
    descriptionCourte:
      'Tu soignes les alliés autour de toi, en continu. Inutile en solo, décisif quand ta team tient une zone.',
    descriptionLongue: `**+1 ❤** à tous les alliés dans un rayon de **6 blocs**, **toutes les 8 secondes**, automatiquement.

Le Sakura est le seul kit purement collectif de LJKITS. Seul, il n'apporte rien : il ne se soigne pas lui-même et n'a aucune capacité offensive. Dans une team qui tient une zone ou le KOTH, il économise une soupe à chaque joueur toutes les huit secondes — et c'est énorme.

Il se joue au centre du groupe, jamais devant.`,
    prixCoins: 20000,
    prixEurosCentimes: 400,
    type: 'EXCLUSIF',
    achetable: true,
    kitDeDepart: false,
    caracteristiques: [
      { libelle: 'Effet', valeur: '+1 ❤ aux alliés' },
      { libelle: 'Rayon', valeur: '6 blocs' },
      { libelle: 'Fréquence', valeur: 'Toutes les 8 s' },
    ],
  },
]

/**
 * Les sections de règlement d'origine, reprises de la maquette reglement.html.
 * Chacune a un `id` fixe et lisible : c'est ce qui rend le seed idempotent
 * (il n'y a pas d'autre champ unique sur SectionReglement).
 */
const SECTIONS: { id: string; titre: string; contenu: string }[] = [
  {
    id: 'regle-triche',
    titre: 'Triche — tolérance zéro',
    contenu: `Tout client ou module donnant un avantage en combat est **interdit** : **killaura**, **reach**, **autoclicker**, **anti-knockback**, **velocity**, **aimbot**, **x-ray**, et assimilés.

> **Autorisés :** Optifine, les clients PvP (Lunar, Badlion, CheatBreaker…) sans modules interdits, les packs de textures.

> **Sanction :** bannissement définitif, sans avertissement. Le PvP soup repose sur le skill — un tricheur détruit l'intérêt du jeu pour tout le monde.`,
  },
  {
    id: 'regle-respect',
    titre: 'Respect',
    contenu: `Le trashtalk fait partie du PvP, les attaques personnelles non. Sont sanctionnés : **insultes ciblées et répétées**, **racisme**, **homophobie**, **harcèlement**, **menaces** — en jeu comme sur le Discord.

Pseudos et skins offensants **interdits**.`,
  },
  {
    id: 'regle-stats',
    titre: 'Stats propres',
    contenu: `Le boost de statistiques est **interdit** : **kill farming** entre amis, **double compte** pour se donner des kills, arrangements pour gonfler une série. Les classements et les primes n'ont de sens que si les chiffres sont vrais.

> **Sanction :** remise à zéro des stats, puis bannissement en cas de récidive.`,
  },
  {
    id: 'regle-bugs',
    titre: 'Bugs et exploits',
    contenu: `Tu trouves un bug ? **Signale-le sur le [Discord](https://discord.gg/9KYbUznDr7)** — les signalements utiles sont récompensés.

L'exploiter à ton avantage, c'est la **sanction assurée**.`,
  },
  {
    id: 'regle-chat',
    titre: 'Chat',
    contenu: `Pas de **publicité** pour d'autres serveurs, pas de **spam**, pas de **flood**.

Le chat est en français ou en anglais.`,
  },
  {
    id: 'regle-compte-unique',
    titre: 'Un seul joueur, un seul compte',
    contenu: `Contourner un bannissement avec un autre compte transforme un ban temporaire en **ban définitif**.`,
  },
  {
    id: 'regle-staff',
    titre: 'Le staff',
    contenu: `Les décisions du staff s'appliquent **immédiatement**.

Tu contestes une sanction ? **Ouvre un ticket sur le [Discord](https://discord.gg/9KYbUznDr7)** — pas de débat dans le chat du serveur.`,
  },
]

async function peuplerKits() {
  for (const [index, kit] of KITS.entries()) {
    const { caracteristiques, ...champsDuKit } = kit

    // Champs communs à la création et à la mise à jour : le seed fait autorité.
    const donnees = { ...champsDuKit, visible: true, bientot: false, ordre: index }

    await prisma.kit.upsert({
      where: { slug: kit.slug },
      create: donnees,
      update: donnees,
    })

    // Les caractéristiques sont remplacées en bloc : plus simple et plus sûr
    // que d'essayer de les apparier une à une.
    await prisma.caracteristiqueKit.deleteMany({ where: { kit: { slug: kit.slug } } })
    const kitEnBase = await prisma.kit.findUniqueOrThrow({ where: { slug: kit.slug } })
    await prisma.caracteristiqueKit.createMany({
      data: caracteristiques.map((carac, position) => ({
        kitId: kitEnBase.id,
        libelle: carac.libelle,
        valeur: carac.valeur,
        ordre: position,
      })),
    })
  }

  console.log(`✔ ${KITS.length} kits en base.`)
}

async function peuplerReglement() {
  for (const [index, section] of SECTIONS.entries()) {
    const donnees = {
      titre: section.titre,
      contenu: section.contenu,
      ordre: index,
      publie: true,
    }

    await prisma.sectionReglement.upsert({
      where: { id: section.id },
      create: { id: section.id, ...donnees },
      update: donnees,
    })
  }

  console.log(`✔ ${SECTIONS.length} sections de règlement en base.`)
}

async function peuplerAdmin() {
  const email = process.env.ADMIN_EMAIL
  const motDePasse = process.env.ADMIN_MOT_DE_PASSE

  if (!email || !motDePasse) {
    console.log(
      '↷ Compte admin ignoré : renseigne ADMIN_EMAIL et ADMIN_MOT_DE_PASSE dans .env.',
    )
    return
  }

  // 12 tours : le compromis habituel entre sécurité et temps de connexion.
  const motDePasseHash = await hash(motDePasse, 12)

  await prisma.admin.upsert({
    where: { email },
    create: { email, motDePasseHash },
    update: { motDePasseHash },
  })

  console.log(`✔ Compte admin prêt : ${email}`)
}

async function main() {
  await peuplerKits()
  await peuplerReglement()
  await peuplerAdmin()
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erreur) => {
    console.error('✖ Le seed a échoué :', erreur)
    await prisma.$disconnect()
    process.exit(1)
  })
