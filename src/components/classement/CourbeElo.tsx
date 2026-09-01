/**
 * La courbe d'Elo d'un joueur, en SVG pur.
 *
 * AUCUNE BIBLIOTHÈQUE. Une courbe à une seule série, sans interaction, ne
 * justifie pas d'embarquer un moteur de graphiques de 50 ko dans le bundle
 * de chaque visiteur — c'est une polyligne et deux repères.
 *
 * Composant serveur : il n'a aucun état et se rend une fois.
 */
export function CourbeElo({
  points,
  className = '',
}: {
  points: number[]
  className?: string
}) {
  if (points.length < 2) return null

  const LARGEUR = 600
  const HAUTEUR = 120
  const MARGE = 6

  const minimum = Math.min(...points)
  const maximum = Math.max(...points)
  // Une amplitude nulle (Elo constant) diviserait par zéro : on force une
  // plage minimale, ce qui dessine alors une ligne plate au milieu.
  const amplitude = Math.max(maximum - minimum, 20)
  const base = (minimum + maximum) / 2 - amplitude / 2

  const enX = (index: number) =>
    MARGE + (index / (points.length - 1)) * (LARGEUR - MARGE * 2)
  const enY = (valeur: number) =>
    HAUTEUR - MARGE - ((valeur - base) / amplitude) * (HAUTEUR - MARGE * 2)

  const ligne = points.map((valeur, index) => `${enX(index)},${enY(valeur)}`).join(' ')
  // Le remplissage referme la courbe sur le bas du cadre.
  const aire = `${enX(0)},${HAUTEUR} ${ligne} ${enX(points.length - 1)},${HAUTEUR}`

  const dernier = points[points.length - 1]
  const premier = points[0]
  const progresse = dernier >= premier
  const couleur = progresse ? 'var(--color-vert)' : 'var(--color-oni)'

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Progression de ${premier} à ${dernier} Elo sur ${points.length} combats`}
      >
        <defs>
          <linearGradient id="degradeElo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={couleur} stopOpacity="0.28" />
            <stop offset="100%" stopColor={couleur} stopOpacity="0" />
          </linearGradient>
        </defs>

        <polygon points={aire} fill="url(#degradeElo)" />
        <polyline
          points={ligne}
          fill="none"
          stroke={couleur}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={enX(points.length - 1)} cy={enY(dernier)} r="3.5" fill={couleur} />
      </svg>

      <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-gris">
        <span>{premier} Elo</span>
        <span style={{ color: couleur }}>
          {progresse ? '+' : ''}
          {dernier - premier} sur la période
        </span>
        <span className="text-creme">{dernier} Elo</span>
      </div>
    </div>
  )
}
