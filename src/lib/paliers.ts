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

/**
 * L'ÉTAT DE PALIER RECOPIÉ PAR LE PLUGIN (table `elo_palier_etat`, 19/10/2026).
 *
 *   - 'promotion'  : l'Elo a passé le seuil de `palier` (index VISÉ), mais il
 *                    faut gagner un match pour le valider ; on affiche encore
 *                    le palier d'en dessous ;
 *   - 'relegation' : l'Elo est passé sous le seuil de `palier` (index PROTÉGÉ),
 *                    il faut gagner un match pour y rester ; on l'affiche encore ;
 *   - 'global'     : `palier` est directement le palier global affiché.
 *
 * Pas d'état = le palier normal de l'Elo. Seul le palier ACTUEL en dépend :
 * l'historique (Elo après un match, courbes, saisons passées) reste à palierDe.
 */
export type EtatPalier = { statut: string; palier: number }

/** Le palier à afficher pour l'Elo actuel d'un joueur, compte tenu de son état en jeu. */
export function palierAffiche(elo: number, etat?: EtatPalier | null): Palier {
  const normal = palierDe(elo)
  if (!etat || !Number.isInteger(etat.palier) || etat.palier < 0 || etat.palier >= PALIERS.length) return normal
  const atteint = PALIERS.indexOf(normal)
  if (etat.statut === 'promotion') return etat.palier > 0 && atteint >= etat.palier ? PALIERS[etat.palier - 1] : normal
  if (etat.statut === 'relegation') return atteint < etat.palier ? PALIERS[etat.palier] : normal
  if (etat.statut === 'global') return PALIERS[etat.palier]
  return normal
}

/** Le marqueur à poser à côté du palier d'un mode : seulement si l'état change vraiment l'affichage. */
export function statutAffiche(elo: number, etat?: EtatPalier | null): 'promotion' | 'relegation' | null {
  if (!etat || (etat.statut !== 'promotion' && etat.statut !== 'relegation')) return null
  return palierAffiche(elo, etat) !== palierDe(elo) ? etat.statut : null
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
