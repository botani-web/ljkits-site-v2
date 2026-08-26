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

/** Date → "12 mars 2026". */
export function formaterDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
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

/** Date → "Samedi 29 août · 15h30". Forme d'étiquette, autonome. */
export function formaterOuverture(date: Date): string {
  const jour = date.toLocaleDateString('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return `${majusculeInitiale(jour)} · ${formaterHeureParis(date)}`
}

/** Date → "samedi 29 août à 15h30". Forme qui s'insère dans une phrase. */
export function formaterOuvertureEnPhrase(date: Date): string {
  const jour = date.toLocaleDateString('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return `${jour} à ${formaterHeureParis(date)}`
}

/** 15:30 en heure de Paris → "15h30", la notation française. */
function formaterHeureParis(date: Date): string {
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

/** Date + heure : "12 mars 2026 à 14:32". Utilisé dans l'admin. */
export function formaterDateHeure(date: Date): string {
  return date.toLocaleString('fr-FR', {
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
