/**
 * LES PALIERS ELO — sans accès base, donc importables côté navigateur.
 *
 * Barème du 13/09/2026 (= Palier.java de LJElo) : Fer de 0 à 1099, puis un
 * palier tous les 100 points, et Légende à partir de 1900.
 *
 * Les couleurs suivent celles du jeu (Palier.java et l'hologramme des rangs) :
 * l'argent en blanc, le maître en rose, le grand maître en violet… adaptées au
 * fond sombre du site. Un Elo affiché prend TOUJOURS la couleur de son palier,
 * sur le site comme en jeu.
 *
 * `elo.ts` réexporte tout ce fichier : les anciens imports restent valides.
 */
export const PALIERS = [
  { nom: 'Fer', nomEn: 'Iron', minimum: 0, couleur: '#9e93ac' },
  { nom: 'Bronze', nomEn: 'Bronze', minimum: 1100, couleur: '#c07a3e' },
  { nom: 'Argent', nomEn: 'Silver', minimum: 1200, couleur: '#f2e8d9' },
  { nom: 'Or', nomEn: 'Gold', minimum: 1300, couleur: '#fdc003' },
  { nom: 'Platine', nomEn: 'Platinum', minimum: 1400, couleur: '#5b8dd9' },
  { nom: 'Émeraude', nomEn: 'Emerald', minimum: 1500, couleur: '#3bd16f' },
  { nom: 'Diamant', nomEn: 'Diamond', minimum: 1600, couleur: '#4fd6e0' },
  { nom: 'Maître', nomEn: 'Master', minimum: 1700, couleur: '#d977d9' },
  { nom: 'Grand Maître', nomEn: 'Grandmaster', minimum: 1800, couleur: '#9b3be0' },
  { nom: 'Légende', nomEn: 'Legend', minimum: 1900, couleur: '#e92813' },
] as const

export type Palier = (typeof PALIERS)[number]

/** Le nom du palier dans la langue demandée. Mêmes noms que Palier.java. */
export function nomPalier(palier: Palier, locale: 'en' | 'fr'): string {
  return locale === 'en' ? palier.nomEn : palier.nom
}

/** Le palier d'un Elo. Le tableau est trié, on prend le dernier atteint. */
export function palierDe(elo: number): Palier {
  let trouve: Palier = PALIERS[0]
  for (const palier of PALIERS) {
    if (elo >= palier.minimum) trouve = palier
  }
  return trouve
}

/** Ce qu'il reste avant le palier suivant, ou null au palier maximum. */
export function resteAvantSuivant(elo: number): { palier: Palier; reste: number } | null {
  for (const palier of PALIERS) {
    if (elo < palier.minimum) return { palier, reste: palier.minimum - elo }
  }
  return null
}

/** La progression dans le palier actuel, de 0 à 1 (1 au palier maximum). */
export function progressionPalier(elo: number): number {
  const actuel = palierDe(elo)
  const suivant = resteAvantSuivant(elo)
  if (!suivant) return 1
  // Fer commence à 0 : on mesure depuis 1000, le départ réel de chaque joueur.
  const bas = actuel.minimum === 0 ? 1000 : actuel.minimum
  const largeur = suivant.palier.minimum - bas
  return largeur > 0 ? Math.min(1, Math.max(0, (elo - bas) / largeur)) : 0
}
