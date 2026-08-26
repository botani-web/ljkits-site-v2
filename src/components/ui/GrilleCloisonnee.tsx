/**
 * La grille cloisonnée : des cases séparées par des filets de 1px.
 *
 * Elle porte le bandeau de constantes de /kits et /kits/[slug], le bandeau de
 * confiance de /boutique, et la bande des règles de l'accueil.
 *
 * ── Comment les filets sont tracés ──────────────────────────────────────────
 * Les maquettes les posaient en `border-right` sur chaque case, puis les
 * rattrapaient à coups de `:nth-child(2n){border-right:0}` à chaque point de
 * rupture. Une règle par palier et par nombre de colonnes : illisible, et faux
 * dès qu'on change le nombre de cases.
 *
 * Ici le conteneur est peint en `bord`, les cases en `charbon`, et un
 * `gap-px` laisse le fond transparaître. Les filets apparaissent donc
 * exactement là où deux cases se touchent — horizontalement comme
 * verticalement, quel que soit le nombre de colonnes du palier courant. Rien à
 * rattraper.
 *
 * Rendu identique aux maquettes, sans les exceptions.
 */
export function GrilleCloisonnee({
  /** Classes de colonnes par palier. Ex. « grid-cols-2 md:grid-cols-4 ». */
  colonnes = 'grid-cols-1 min-[560px]:grid-cols-2 lg:grid-cols-4',
  /**
   * Bande pleine largeur, filet en haut et en bas, sans rayon — la bande des
   * règles de l'accueil. Par défaut, c'est un bloc encadré et arrondi.
   */
  pleineLargeur = false,
  className = '',
  children,
}: {
  colonnes?: string
  pleineLargeur?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`grid gap-px bg-bord ${colonnes} ${
        pleineLargeur ? 'border-y border-bord' : 'overflow-hidden rounded-carte border border-bord'
      } ${className}`}
    >
      {children}
    </div>
  )
}

/** Une case de la grille cloisonnée. Le fond opaque est ce qui dessine le filet. */
export function CaseCloisonnee({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={`bg-charbon p-5.5 ${className}`}>{children}</div>
}

/**
 * Le bandeau de repères chiffrés : une valeur en gros, son libellé en dessous.
 * C'est l'usage le plus courant de la grille cloisonnée, d'où ce raccourci.
 */
export function BandeauChiffres({
  reperes,
  colonnes,
  pleineLargeur,
  className,
}: {
  reperes: {
    valeur: React.ReactNode
    label: React.ReactNode
    /** `oni` pour les valeurs qui disent une absence : « 0 armure ». */
    ton?: 'or' | 'oni'
  }[]
  colonnes?: string
  pleineLargeur?: boolean
  className?: string
}) {
  return (
    <GrilleCloisonnee colonnes={colonnes} pleineLargeur={pleineLargeur} className={className}>
      {reperes.map((repere, index) => (
        <CaseCloisonnee key={index}>
          <div
            className={`font-mono text-[clamp(19px,2.4vw,25px)] leading-tight font-bold ${
              repere.ton === 'oni' ? 'text-oni' : 'text-or'
            }`}
          >
            {repere.valeur}
          </div>
          <div className="mt-2 font-mono text-[11px] tracking-[.06em] text-gris">
            {repere.label}
          </div>
        </CaseCloisonnee>
      ))}
    </GrilleCloisonnee>
  )
}
