/**
 * Configuration du site — l'équivalent de l'objet CONFIG des maquettes HTML.
 *
 * Tout ce qui change au fil du temps mais ne mérite pas une table en base
 * se règle ICI, et nulle part ailleurs. Aucune de ces valeurs ne doit être
 * réécrite en dur dans un composant.
 */
export const SITE = {
  nom: 'LJKITS',
  /**
   * VALEURS DE REPLI UNIQUEMENT.
   *
   * L'adresse du serveur et le lien Discord se modifient dans /admin/reglages
   * et sont lus en base — cf. src/lib/reglages.ts. Ce qui suit ne sert que
   * tant que la ligne de réglages n'existe pas : base fraîche, seed pas encore
   * lancé. Modifier ces valeurs ici n'a aucun effet sur un site déjà en
   * service.
   */
  ip: 'mc.ljkits.eu',
  discord: 'https://discord.gg/ljkits',

  /**
   * URL publique du site. Sert à construire les URL absolues des
   * métadonnées Open Graph (obligatoirement absolues pour Discord/Twitter).
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ljkits.eu',

  /**
   * Ouverture officielle de la SAISON 1 : vendredi 11 septembre 2026, 18h00,
   * heure de Paris.
   *
   * Le décalage `+02:00` est écrit en toutes lettres exprès. Sans lui, la date
   * serait interprétée dans le fuseau de la machine — donc en UTC sur Vercel,
   * et le compte à rebours afficherait deux heures de trop en production.
   *
   * L'encart d'ouverture de l'accueil bascule tout seul sur cette date : avant,
   * c'est un décompte ; après, le nombre de joueurs en ligne. Rien à toucher
   * le jour J.
   *
   * ⚠ LA MÊME DATE VIT DANS LE BOT DISCORD (botljk/textes.js, `OUVERTURE`,
   * sous forme d'horodatage Unix : 1789142400). Les deux doivent bouger
   * ensemble — c'est le seul doublon assumé du projet, faute d'une source
   * partageable entre un bot Node et un déploiement Vercel.
   */
  ouverture: '2026-09-12T14:30:00+02:00',

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
  { cle: 'soupe', valeur: '3,5 ❤', label: 'Une soupe', labelEn: 'One soup' },
  { cle: 'epee', valeur: '2 ❤', label: 'Épée en pierre', labelEn: 'Stone sword' },
  { cle: 'cooldown', valeur: '0', label: 'Cooldown d’attaque', labelEn: 'Attack cooldown' },
  { cle: 'armure', valeur: 'Aucune', valeurEn: 'None', label: 'Armure', labelEn: 'Armour' },
  { cle: 'knockback', valeur: '1.8', label: 'Knockback d’époque', labelEn: '1.8 knockback' },
] as const

/**
 * Renvoie les repères demandés, dans l'ordre des clés fournies et dans la
 * langue demandée. `label` et `valeur` sortent déjà traduits : les pages qui
 * les affichent n'ont rien à savoir de la langue.
 */
export function reperes(locale: 'en' | 'fr', ...cles: string[]) {
  return cles
    .map((cle) => REPERES_DE_JEU.find((repere) => repere.cle === cle)!)
    .map((repere) => ({
      cle: repere.cle,
      valeur:
        locale === 'en' && 'valeurEn' in repere && repere.valeurEn
          ? repere.valeurEn
          : repere.valeur,
      label: locale === 'en' ? repere.labelEn : repere.label,
    }))
}

/**
 * LE CLASSEMENT DU SITE EST FERMÉ (12/09/2026).
 *
 * Le serveur est passé du FFA classé au Practice 1v1 (Elo par mode + Elo
 * global) : les tableaux du site décrivent encore l'ancien système. Tant que
 * ce drapeau est faux, /classement affiche un message d'attente et l'accueil
 * masque son aperçu du top. Le classement reste consultable en jeu
 * (/leaderboard). Repasser à `true` quand la page aura été refaite.
 */
// ROUVERT le 16/09/2026 : classement ranked practice (global + par mode), profils détaillés.
export const CLASSEMENT_OUVERT = true
