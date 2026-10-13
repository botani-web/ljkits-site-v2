/**
 * LES PALIERS ELO — sans accès base, donc importables côté navigateur.
 *
 * Barème du 13/10/2026 (= Palier.java de LJElo, celui de PvPRivals) : Argent jusqu'à 1499,
 * un palier tous les 100 points jusqu'à Grand Maître (2100-2999), Champion à 3000.
 * La saison 1 garde son barème (PALIERS_SAISON_1) : passer la saison à palierDe().
 *
 * Les couleurs suivent celles du jeu (Palier.java et l'hologramme des rangs) :
 * l'argent en blanc, le maître en rose, le grand maître en violet… adaptées au
 * fond sombre du site. Un Elo affiché prend TOUJOURS la couleur de son palier,
 * sur le site comme en jeu.
 *
 * `elo.ts` réexporte tout ce fichier : les anciens imports restent valides.
 */
/* BARÈME DU 13/10/2026 (saison 2 et suivantes) : exactement celui de PvPRivals.
   Tout le monde démarre à 1400, en Argent. Mêmes couleurs que le jeu (Palier.java). */
export const PALIERS = [
  { nom: 'Argent', nomEn: 'Silver', minimum: 0, couleur: '#b3b3b3' },
  { nom: 'Or', nomEn: 'Gold', minimum: 1500, couleur: '#ffaa00' },
  { nom: 'Platine', nomEn: 'Platinum', minimum: 1600, couleur: '#f2f2f2' },
  { nom: 'Émeraude', nomEn: 'Emerald', minimum: 1700, couleur: '#55ff55' },
  { nom: 'Saphir', nomEn: 'Sapphire', minimum: 1800, couleur: '#6f7dff' },
  { nom: 'Diamant', nomEn: 'Diamond', minimum: 1900, couleur: '#55ffff' },
  { nom: 'Maître', nomEn: 'Master', minimum: 2000, couleur: '#ff5555' },
  { nom: 'Grand Maître', nomEn: 'Grandmaster', minimum: 2100, couleur: '#d42a2a' },
  { nom: 'Champion', nomEn: 'Champion', minimum: 3000, couleur: '#c03ec0' },
] as const

/* LE BARÈME DE LA SAISON 1 (gelé) : Fer → Légende, départ à 1000. Ses classements et ses matchs
   gardent leurs paliers d'origine. */
export const PALIERS_SAISON_1 = [
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

/** La dernière saison au barème d'avant. */
export const DERNIERE_SAISON_ANCIEN_BAREME = 1
/** L'Elo de départ du barème actuel. */
export const ELO_DEPART = 1400

export type Palier = (typeof PALIERS)[number] | (typeof PALIERS_SAISON_1)[number]

/** Le barème d'une saison (sans saison : le barème actuel). */
function bareme(saison?: number): readonly Palier[] {
  return saison != null && saison > 0 && saison <= DERNIERE_SAISON_ANCIEN_BAREME ? PALIERS_SAISON_1 : PALIERS
}

/** Le nom du palier dans la langue demandée. Mêmes noms que Palier.java. */
export function nomPalier(palier: Palier, locale: 'en' | 'fr'): string {
  return locale === 'en' ? palier.nomEn : palier.nom
}

/** Le palier d'un Elo. Le tableau est trié, on prend le dernier atteint. */
export function palierDe(elo: number, saison?: number): Palier {
  const liste = bareme(saison)
  let trouve: Palier = liste[0]
  for (const palier of liste) {
    if (elo >= palier.minimum) trouve = palier
  }
  return trouve
}

/** Ce qu'il reste avant le palier suivant, ou null au palier maximum. */
export function resteAvantSuivant(elo: number, saison?: number): { palier: Palier; reste: number } | null {
  for (const palier of bareme(saison)) {
    if (elo < palier.minimum) return { palier, reste: palier.minimum - elo }
  }
  return null
}

/** La progression dans le palier actuel, de 0 à 1 (1 au palier maximum). */
export function progressionPalier(elo: number, saison?: number): number {
  const actuel = palierDe(elo, saison)
  const suivant = resteAvantSuivant(elo, saison)
  if (!suivant) return 1
  // Le 1er palier commence à 0 : on mesure depuis le départ réel de chaque joueur.
  const ancien = bareme(saison) === PALIERS_SAISON_1
  const bas = actuel.minimum === 0 ? (ancien ? 1000 : ELO_DEPART) : actuel.minimum
  const largeur = suivant.palier.minimum - bas
  return largeur > 0 ? Math.min(1, Math.max(0, (elo - bas) / largeur)) : 0
}
