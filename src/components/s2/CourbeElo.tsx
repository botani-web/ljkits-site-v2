import { IconeMode } from '@/components/s2/Briques'
import type { Locale } from '@/lib/i18n'
import { infosMode } from '@/lib/practice-commun'

/**
 * LA COURBE D'ELO, DESSINÉE CÔTÉ SERVEUR (16/10/2026).
 *
 * Un SVG pur, une ligne par mode, sans bibliothèque ni JavaScript : rien à
 * télécharger, rien à attendre. L'axe horizontal est le TEMPS (les modes joués
 * en parallèle restent alignés), l'axe vertical l'Elo, avec trois repères.
 */
export function CourbeElo({
  courbes,
  locale,
}: {
  courbes: { mode: string; points: { instant: Date | string; elo: number }[] }[]
  locale: Locale
}) {
  const series = courbes
    .map((c) => ({ ...c, points: c.points.map((p) => ({ t: new Date(p.instant).getTime(), elo: p.elo })) }))
    .filter((c) => c.points.length >= 2)
  if (series.length === 0) return null

  const tous = series.flatMap((s) => s.points)
  const tMin = Math.min(...tous.map((p) => p.t))
  const tMax = Math.max(...tous.map((p) => p.t))
  const eMin = Math.floor((Math.min(...tous.map((p) => p.elo)) - 15) / 50) * 50
  const eMax = Math.ceil((Math.max(...tous.map((p) => p.elo)) + 15) / 50) * 50

  const L = 640
  const H = 220
  const G = 38 // marge gauche (étiquettes)
  const x = (t: number) => G + ((t - tMin) / Math.max(1, tMax - tMin)) * (L - G - 8)
  const y = (e: number) => 10 + (1 - (e - eMin) / Math.max(1, eMax - eMin)) * (H - 28)
  const reperes = [eMin, Math.round((eMin + eMax) / 2 / 10) * 10, eMax]
  const date = (t: number) =>
    new Date(t).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })

  return (
    <figure>
      <svg viewBox={`0 0 ${L} ${H}`} className="h-auto w-full" role="img" aria-label="Elo">
        {reperes.map((e) => (
          <g key={e}>
            <line x1={G} x2={L - 4} y1={y(e)} y2={y(e)} stroke="#2e2245" strokeDasharray="3 5" />
            <text x={G - 6} y={y(e) + 4} textAnchor="end" fontSize="11" fill="#9e93ac" fontFamily="var(--police-mono)">
              {e}
            </text>
          </g>
        ))}
        <text x={G} y={H - 4} fontSize="11" fill="#9e93ac">
          {date(tMin)}
        </text>
        <text x={L - 4} y={H - 4} fontSize="11" fill="#9e93ac" textAnchor="end">
          {date(tMax)}
        </text>
        {series.map((s) => {
          const couleur = infosMode(s.mode).couleur
          const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.elo).toFixed(1)}`).join(' ')
          const dernier = s.points[s.points.length - 1]
          return (
            <g key={s.mode}>
              <path d={d} pathLength={1} className="tracer" fill="none" stroke={couleur} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" opacity=".95" />
              <circle cx={x(dernier.t)} cy={y(dernier.elo)} r="3.6" fill={couleur} className="pop" style={{ ['--delai' as string]: '1.6s' }}>
                <title>{`${infosMode(s.mode).nom} · ${dernier.elo}`}</title>
              </circle>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-gris">
        {series.map((s) => (
          <span key={s.mode} className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 rounded-full" style={{ backgroundColor: infosMode(s.mode).couleur }} aria-hidden />
            <IconeMode mode={s.mode} taille={14} />
            {infosMode(s.mode).nom}
            <span className="font-mono text-creme">{s.points[s.points.length - 1].elo}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
