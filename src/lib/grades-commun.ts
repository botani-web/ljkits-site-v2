/**
 * LES GRADES AFFICHÉS SUR LE SITE (16/10/2026) — sans accès base, importable partout.
 *
 * Même table que LJTab (Grades.java) : les groupes LuckPerms gardent leurs anciens
 * noms (ronin / samourai / shogun), seul l'affichage a changé. Testés du plus fort
 * au plus faible, comme en jeu : un administrateur hérite des groupes inférieurs.
 */
export const GRADES = [
  { groupe: 'admin', libelle: 'OWNER', couleur: '#e92813' },
  { groupe: 'administrateur', libelle: 'ADMIN', couleur: '#ff5555' },
  { groupe: 'responsable', libelle: 'RESP', couleur: '#fe9301' },
  { groupe: 'moderateur', libelle: 'MOD', couleur: '#5b8dd9' },
  { groupe: 'media', libelle: 'MEDIA', couleur: '#d977d9' },
  { groupe: 'shogun', libelle: 'LJ++', couleur: '#fe9301' },
  { groupe: 'samourai', libelle: 'LJ++', couleur: '#fe9301' },
  { groupe: 'ronin', libelle: 'LJ+', couleur: '#fdc003' },
] as const

export type Grade = (typeof GRADES)[number]

/** Le grade le plus fort parmi des groupes LuckPerms, ou null pour un joueur sans grade. */
export function gradeDe(groupes: Iterable<string>): Grade | null {
  const ensemble = new Set(groupes)
  return GRADES.find((g) => ensemble.has(g.groupe)) ?? null
}

/** Les grades du staff : leur profil le dit, sans en faire un argument de classement. */
export function estStaff(grade: Grade | null): boolean {
  return grade != null && ['admin', 'administrateur', 'responsable', 'moderateur'].includes(grade.groupe)
}
