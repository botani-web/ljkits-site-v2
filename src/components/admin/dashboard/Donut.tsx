/**
 * Un donut en SVG pur, rendu côté serveur — zéro kilo-octet de JavaScript.
 *
 * On a écarté une librairie de graphes exprès : même réduite à un seul type de
 * diagramme, elle dépassait le budget de poids fixé pour une consultation en 4G.
 * Un cercle et quelques `stroke-dasharray` suffisent ici et ne coûtent rien au
 * navigateur.
 */
export type SegmentDonut = {
  libelle: string
  valeur: number
  /** Couleur du segment, en variable CSS de la palette (ex. « var(--color-soupe) »). */
  couleur: string
}

export function Donut({
  segments,
  total,
  legendeCentre,
  sousLegende,
}: {
  segments: SegmentDonut[]
  total: number
  legendeCentre: string
  sousLegende?: string
}) {
  const rayon = 56
  const epaisseur = 18
  const circonference = 2 * Math.PI * rayon

  // On accumule les longueurs d'arc pour poser chaque segment à la suite du
  // précédent, via le décalage (strokeDashoffset).
  let debut = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
      <svg
        viewBox="0 0 140 140"
        className="h-36 w-36 shrink-0"
        role="img"
        aria-label={`Répartition : ${segments
          .map((s) => `${s.libelle} ${Math.round((s.valeur / total) * 100)} %`)
          .join(', ')}`}
      >
        {/* Rail de fond, visible quand un segment est minuscule ou nul. */}
        <circle
          cx="70"
          cy="70"
          r={rayon}
          fill="none"
          stroke="var(--color-bord)"
          strokeWidth={epaisseur}
        />
        {total > 0 &&
          segments.map((segment) => {
            const longueur = (segment.valeur / total) * circonference
            const element = (
              <circle
                key={segment.libelle}
                cx="70"
                cy="70"
                r={rayon}
                fill="none"
                stroke={segment.couleur}
                strokeWidth={epaisseur}
                strokeDasharray={`${longueur} ${circonference - longueur}`}
                strokeDashoffset={-debut}
                transform="rotate(-90 70 70)"
              />
            )
            debut += longueur
            return element
          })}
        <text
          x="70"
          y="64"
          textAnchor="middle"
          className="fill-creme font-mono text-[19px] font-bold"
        >
          {legendeCentre}
        </text>
        {sousLegende && (
          <text
            x="70"
            y="82"
            textAnchor="middle"
            className="fill-gris font-mono text-[9px] tracking-wide uppercase"
          >
            {sousLegende}
          </text>
        )}
      </svg>

      <ul className="flex w-full flex-col gap-2.5">
        {segments.map((segment) => (
          <li key={segment.libelle} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: segment.couleur }}
            />
            <span className="text-sm text-creme">{segment.libelle}</span>
            <span className="ml-auto font-mono text-[13px] text-gris">
              {total === 0 ? '0 %' : `${Math.round((segment.valeur / total) * 100)} %`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
