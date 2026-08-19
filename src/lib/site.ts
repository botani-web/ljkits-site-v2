/**
 * Configuration du site — l'équivalent de l'objet CONFIG des maquettes HTML.
 *
 * Tout ce qui change au fil du temps mais ne mérite pas une table en base
 * se règle ICI, et nulle part ailleurs. Aucune de ces valeurs ne doit être
 * réécrite en dur dans un composant.
 */
export const SITE = {
  nom: 'LJKITS',
  /** Adresse du serveur Minecraft, affichée et copiée un peu partout. */
  ip: 'mc.ljkits.eu',
  discord: 'https://discord.gg/9KYbUznDr7',

  /**
   * URL publique du site. Sert à construire les URL absolues des
   * métadonnées Open Graph (obligatoirement absolues pour Discord/Twitter).
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ljkits.eu',

  /**
   * Sites de vote. Tant que l'URL vaut '#', le serveur n'y est pas encore
   * inscrit : le bouton reste affiché mais inerte.
   */
  sitesDeVote: [
    { cle: 'serveurPrive', sigle: 'SP', nom: 'Serveur-Privé.net', url: '#' },
    { cle: 'topServeurs', sigle: 'TS', nom: 'Top-Serveurs.net', url: '#' },
    { cle: 'serveursMinecraft', sigle: 'SM', nom: 'Serveurs-Minecraft.org', url: '#' },
  ],

  /** API publique de statut du serveur (joueurs en ligne). */
  apiStatut: 'https://api.mcstatus.io/v2/status/java/',
  /** Intervalle de rafraîchissement du statut, en millisecondes. */
  statutRefreshMs: 60_000,

  /** API des avatars de skins pour le classement. */
  apiAvatar: 'https://mc-heads.net/avatar/',
} as const

/*
 * NOTE — la durée de revalidation des pages publiques (`export const
 * revalidate = 3600`) est écrite en toutes lettres dans chaque page et non
 * ici : Next.js analyse cette valeur statiquement au build et refuse une
 * constante importée. Les quatre pages concernées sont /, /kits,
 * /kits/[slug] et /reglement.
 */

/**
 * Image Open Graph par défaut (le logo carré 1080×1080).
 *
 * ⚠ À répéter dans le bloc `openGraph` de CHAQUE page qui en définit un :
 * Next.js REMPLACE l'objet openGraph du layout parent au lieu de le fusionner
 * champ par champ. Sans ça, les pages filles partent sans image et les liens
 * partagés sur Discord s'affichent nus.
 */
export const IMAGE_OG = [{ url: '/og.png', width: 1080, height: 1080 }]

/**
 * Les repères chiffrés du soup 1.8, partagés par /kits et /kits/[slug].
 *
 * Ce ne sont pas des données de configuration mais des constantes de jeu :
 * elles ne changeraient que si l'équilibrage du serveur changeait. Chaque page
 * choisit les repères qu'elle affiche via `cle`, parce que la grille de /kits
 * n'en tient que quatre (celle de la maquette d'origine).
 */
export const REPERES_DE_JEU = [
  { cle: 'soupe', valeur: '3,5 ❤', label: 'Une soupe' },
  { cle: 'epee', valeur: '2 ❤', label: 'Épée en pierre' },
  { cle: 'cooldown', valeur: '0', label: 'Cooldown d’attaque' },
  { cle: 'armure', valeur: 'Aucune', label: 'Armure' },
  { cle: 'knockback', valeur: '1.8', label: 'Knockback d’époque' },
] as const

/** Renvoie les repères demandés, dans l'ordre des clés fournies. */
export function reperes(...cles: string[]) {
  return cles.map((cle) => REPERES_DE_JEU.find((repere) => repere.cle === cle)!)
}
