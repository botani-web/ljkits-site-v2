'use client'

import { useMemo, useRef, useState } from 'react'

import { t, type Locale } from '@/lib/i18n'
import { infosMode } from '@/lib/practice-commun'

type Point = { instant: string; elo: number }
type Courbe = { mode: string; points: Point[] }
type Seuil = { minimum: number; couleur: string; nom: string }

const LARGEUR = 820
const HAUTEUR = 290
const MARGE = { haut: 18, droite: 88, bas: 26, gauche: 46 }

/**
 * L'Elo de chaque mode dans le temps, sur un même graphique.
 *
 * Les seuils de palier traversent le graphique en pointillés, dans leur
 * couleur : on voit d'un coup d'œil quand un joueur a franchi l'Or ou le
 * Diamant. Chaque mode s'affiche ou se masque depuis la légende, et le survol
 * donne la valeur exacte du match le plus proche.
 */
export function CourbeModes({
  courbes,
  seuils,
  locale,
}: {
  courbes: Courbe[]
  seuils: Seuil[]
  locale: Locale
}) {
  const [masques, setMasques] = useState<Set<string>>(new Set())
  const [survol, setSurvol] = useState<{ x: number; y: number; mode: string; elo: number; instant: string } | null>(null)
  const svg = useRef<SVGSVGElement>(null)

  const utiles = courbes.filter((c) => c.points.length >= 2)
  const visibles = utiles.filter((c) => !masques.has(c.mode))

  const echelles = useMemo(() => {
    const tous = visibles.flatMap((c) => c.points)
    if (tous.length === 0) return null
    const temps = tous.map((p) => new Date(p.instant).getTime())
    const elos = tous.map((p) => p.elo)
    const t0 = Math.min(...temps)
    const t1 = Math.max(...temps)
    const bas = Math.floor((Math.min(...elos) - 20) / 10) * 10
    const haut = Math.ceil((Math.max(...elos) + 20) / 10) * 10
    const enX = (ms: number) =>
      MARGE.gauche + (t1 === t0 ? 0.5 : (ms - t0) / (t1 - t0)) * (LARGEUR - MARGE.gauche - MARGE.droite)
    const enY = (elo: number) =>
      HAUTEUR - MARGE.bas - ((elo - bas) / Math.max(1, haut - bas)) * (HAUTEUR - MARGE.haut - MARGE.bas)
    return { enX, enY, bas, haut }
  }, [visibles])

  if (utiles.length === 0 || !echelles) {
    return (
      <p className="rounded-carte border border-dashed border-bord px-6 py-12 text-center font-mono text-[13px] text-gris">
        {t(locale, 'pr.progression-vide')}
      </p>
    )
  }

  const { enX, enY, bas, haut } = echelles
  const graduations = Array.from({ length: 5 }, (_, i) => Math.round(bas + ((haut - bas) * i) / 4))
  const seuilsVisibles = seuils.filter((s) => s.minimum > bas && s.minimum < haut)

  const auSurvol = (evenement: React.PointerEvent<SVGSVGElement>) => {
    const cadre = svg.current?.getBoundingClientRect()
    if (!cadre) return
    const x = ((evenement.clientX - cadre.left) / cadre.width) * LARGEUR
    const y = ((evenement.clientY - cadre.top) / cadre.height) * HAUTEUR
    let meilleur: typeof survol = null
    let distance = Infinity
    for (const courbe of visibles) {
      for (const point of courbe.points) {
        const px = enX(new Date(point.instant).getTime())
        const py = enY(point.elo)
        const d = Math.hypot(px - x, (py - y) * 0.6)
        if (d < distance) {
          distance = d
          meilleur = { x: px, y: py, mode: courbe.mode, elo: point.elo, instant: point.instant }
        }
      }
    }
    setSurvol(distance < 60 ? meilleur : null)
  }

  const basculer = (mode: string) => {
    setMasques((actuels) => {
      const suivants = new Set(actuels)
      if (suivants.has(mode)) suivants.delete(mode)
      // On ne masque jamais la dernière courbe visible : le graphique resterait vide.
      else if (utiles.length - suivants.size > 1) suivants.add(mode)
      return suivants
    })
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {utiles.map((courbe) => {
          const infos = infosMode(courbe.mode)
          const actif = !masques.has(courbe.mode)
          const dernier = courbe.points[courbe.points.length - 1]
          return (
            <button
              key={courbe.mode}
              type="button"
              aria-pressed={actif}
              onClick={() => basculer(courbe.mode)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-controle border px-3 font-mono text-[11.5px] tracking-[.08em] uppercase transition ${
                actif ? 'border-bord bg-braise text-creme' : 'border-bord/60 text-gris opacity-55'
              }`}
            >
              <span aria-hidden className="h-[3px] w-4 rounded-full" style={{ background: infos.couleur }} />
              {infos.nom}
              <span className="tabular-nums text-gris">{dernier.elo}</span>
            </button>
          )
        })}
      </div>

      <div className="relative overflow-hidden rounded-carte border border-bord bg-charbon">
        <svg
          ref={svg}
          viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
          className="block h-auto w-full touch-pan-y"
          onPointerMove={auSurvol}
          onPointerLeave={() => setSurvol(null)}
          role="img"
          aria-label={t(locale, 'pr.progression-titre')}
        >
          {graduations.map((g) => (
            <g key={`g${g}`}>
              <line x1={MARGE.gauche} x2={LARGEUR - MARGE.droite} y1={enY(g)} y2={enY(g)} stroke="var(--color-bord)" strokeWidth="1" />
              <text x={MARGE.gauche - 8} y={enY(g) + 4} textAnchor="end" className="fill-gris font-mono text-[11px]">
                {g}
              </text>
            </g>
          ))}

          {seuilsVisibles.map((s) => (
            <g key={`s${s.minimum}`}>
              <line
                x1={MARGE.gauche}
                x2={LARGEUR - MARGE.droite}
                y1={enY(s.minimum)}
                y2={enY(s.minimum)}
                stroke={s.couleur}
                strokeOpacity="0.55"
                strokeDasharray="5 5"
                strokeWidth="1.2"
              />
              <text x={LARGEUR - MARGE.droite + 8} y={enY(s.minimum) + 4} className="font-mono text-[10.5px] uppercase" fill={s.couleur}>
                {s.nom}
              </text>
            </g>
          ))}

          {visibles.map((courbe) => {
            const infos = infosMode(courbe.mode)
            const trace = courbe.points
              .map((p) => `${enX(new Date(p.instant).getTime()).toFixed(1)},${enY(p.elo).toFixed(1)}`)
              .join(' ')
            const dernier = courbe.points[courbe.points.length - 1]
            return (
              <g key={courbe.mode}>
                <polyline points={trace} fill="none" stroke={infos.couleur} strokeWidth="3" strokeOpacity="0.18" strokeLinejoin="round" />
                <polyline points={trace} fill="none" stroke={infos.couleur} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={enX(new Date(dernier.instant).getTime())} cy={enY(dernier.elo)} r="4.5" fill={infos.couleur} stroke="var(--color-charbon)" strokeWidth="2" />
              </g>
            )
          })}

          {survol && (
            <g pointerEvents="none">
              <line x1={survol.x} x2={survol.x} y1={MARGE.haut} y2={HAUTEUR - MARGE.bas} stroke="var(--color-creme)" strokeOpacity="0.25" />
              <circle cx={survol.x} cy={survol.y} r="6" fill={infosMode(survol.mode).couleur} stroke="var(--color-creme)" strokeWidth="2" />
            </g>
          )}
        </svg>

        {survol && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-controle border border-bord bg-nuit/95 px-3 py-2 font-mono text-[11.5px] whitespace-nowrap shadow-lg"
            style={{ left: `${(survol.x / LARGEUR) * 100}%`, top: `${(survol.y / HAUTEUR) * 100}%` }}
          >
            <span className="text-gris">{infosMode(survol.mode).nom} · </span>
            <span className="font-bold text-creme">{survol.elo}</span>
            <span className="block text-[10px] text-gris">
              {new Date(survol.instant).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
