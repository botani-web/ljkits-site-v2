/** Petits formateurs d'affichage, partagés par le site public et l'admin. */

/** 12000 → "12 000" (espace insécable fine, comme dans les maquettes). */
export function formaterCoins(coins: number): string {
  return coins.toLocaleString('fr-FR').replace(/ | /g, ' ')
}

/** 400 → "4 €"  ·  450 → "4,50 €". */
export function formaterEuros(centimes: number): string {
  const euros = centimes / 100
  const texte = Number.isInteger(euros)
    ? String(euros)
    : euros.toFixed(2).replace('.', ',')
  return `${texte} €`
}

/**
 * "4" ou "4,50" ou "4.50" → 400 / 450 centimes.
 * Renvoie null si le champ est vide, NaN si la saisie est invalide
 * (c'est zod qui rejettera le NaN, cf. validations.ts).
 */
export function eurosVersCentimes(saisie: string): number | null {
  const nettoye = saisie.trim().replace(',', '.')
  if (nettoye === '') return null
  const valeur = Number(nettoye)
  if (!Number.isFinite(valeur)) return Number.NaN
  return Math.round(valeur * 100)
}

/** 400 → "4" · 450 → "4,50" — pour pré-remplir le champ du formulaire. */
export function centimesVersEuros(centimes: number | null): string {
  if (centimes === null) return ''
  const euros = centimes / 100
  return Number.isInteger(euros) ? String(euros) : euros.toFixed(2).replace('.', ',')
}

/**
 * Date → "12 mars 2026" ou "12 March 2026".
 *
 * Le français reste le défaut : l'admin, les e-mails et tout ce qui n'a pas
 * de langue de page continuent d'appeler sans second argument.
 */
export function formaterDate(date: Date, locale: 'en' | 'fr' = 'fr'): string {
  return date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/*
 * Les deux formes de la date d'ouverture.
 *
 * `timeZone: 'Europe/Paris'` est indispensable : sur Vercel, la machine tourne
 * en UTC, et sans lui l'accueil annoncerait « 13h30 » à ses visiteurs.
 */

/** Date → "Vendredi 11 septembre · 18h00" / "Friday 11 September · 6:00 PM".
 *  Forme d'étiquette, autonome. */
export function formaterOuverture(date: Date, locale: 'en' | 'fr' = 'fr'): string {
  const jour = date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return `${majusculeInitiale(jour)} · ${formaterHeureParis(date, locale)}`
}

/** Date → "vendredi 11 septembre à 18h00" / "Friday 11 September at 6:00 PM".
 *  Forme qui s'insère dans une phrase. */
export function formaterOuvertureEnPhrase(date: Date, locale: 'en' | 'fr' = 'fr'): string {
  const jour = date.toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const liaison = locale === 'en' ? 'at' : 'à'
  return `${jour} ${liaison} ${formaterHeureParis(date, locale)}`
}

/**
 * 18:00 en heure de Paris → "18h00" en français, "6:00 PM" en anglais.
 *
 * L'heure du serveur est TOUJOURS celle de Paris — c'est là que le serveur
 * ouvre. Seule sa NOTATION change de langue : un visiteur anglophone lit une
 * heure sur douze heures, mais bien la même heure.
 */
function formaterHeureParis(date: Date, locale: 'en' | 'fr' = 'fr'): string {
  if (locale === 'en') {
    return date.toLocaleTimeString('en-GB', {
      timeZone: 'Europe/Paris',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return date
    .toLocaleTimeString('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(':', 'h')
}

function majusculeInitiale(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

/** 42 → "LJK-000042". Numéro de commande lisible, pour le support. */
export function formaterNumeroCommande(numero: number): string {
  return `LJK-${String(numero).padStart(6, '0')}`
}

/** Date + heure : "12 mars 2026 à 14:32", ou l'équivalent anglais. */
export function formaterDateHeure(date: Date, locale: 'en' | 'fr' = 'fr'): string {
  return date.toLocaleString(locale === 'en' ? 'en-GB' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Ratio kills / morts, à deux décimales.
 * Les morts sont plancherées à 1 : un joueur qui n'est jamais mort donnerait
 * sinon une division par zéro.
 */
export function formaterRatio(kills: number, morts: number): string {
  return (kills / Math.max(morts, 1)).toFixed(2).replace('.', ',')
}
