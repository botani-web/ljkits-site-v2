import { t, type Locale } from '@/lib/i18n'
import { nomPalier, palierDe } from '@/lib/paliers'
import { infosMode, type Resultat } from '@/lib/practice-commun'

/**
 * Les petites pièces du classement et des profils. Aucun état, aucun hook :
 * elles s'affichent aussi bien dans une page serveur que dans un composant client.
 */

/** Le palier d'un Elo, dans sa couleur. */
export function BadgePalier({
  elo,
  locale,
  petit = false,
  className = '',
}: {
  elo: number
  locale: Locale
  petit?: boolean
  className?: string
}) {
  const palier = palierDe(elo)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-micro border px-2 py-[3px] font-mono leading-none tracking-[.12em] whitespace-nowrap uppercase ${
        petit ? 'text-[9.5px]' : 'text-[11px]'
      } ${className}`}
      style={{ color: palier.couleur, borderColor: `${palier.couleur}55`, background: `${palier.couleur}12` }}
    >
      <span aria-hidden className="size-[5px] rotate-45" style={{ background: palier.couleur }} />
      {nomPalier(palier, locale)}
    </span>
  )
}

/** Un Elo, toujours dans la couleur de son palier. */
export function Elo({ valeur, className = '' }: { valeur: number; className?: string }) {
  return (
    <span className={`font-mono font-bold tabular-nums ${className}`} style={{ color: palierDe(valeur).couleur }}>
      {valeur}
    </span>
  )
}

/** Les derniers résultats, le plus récent à gauche. */
export function FormeRecente({
  forme,
  locale,
  taille = 'normal',
  className = '',
}: {
  forme: Resultat[]
  locale: Locale
  taille?: 'petit' | 'normal'
  className?: string
}) {
  if (forme.length === 0) return <span className="font-mono text-[11px] text-gris">—</span>
  const cote = taille === 'petit' ? 'size-[18px] text-[9px]' : 'size-[26px] text-[11px]'
  return (
    <span
      className={`inline-flex gap-1 ${className}`}
      aria-label={`${t(locale, 'pr.forme')} : ${forme.map((r) => t(locale, r === 'V' ? 'pr.v' : 'pr.d')).join(' ')}`}
    >
      {forme.map((r, i) => (
        <span
          key={i}
          aria-hidden
          className={`grid place-items-center rounded-micro border font-mono font-bold ${cote} ${
            r === 'V' ? 'border-vert/40 bg-vert/15 text-vert' : 'border-rouge/40 bg-rouge/15 text-rouge'
          }`}
        >
          {t(locale, r === 'V' ? 'pr.v' : 'pr.d')}
        </span>
      ))}
    </span>
  )
}

/** La couleur d'un winrate : vert au-dessus de 60 %, or au-dessus de 45 %, sinon rouge. */
export function couleurWinrate(valeur: number): string {
  if (valeur >= 60) return 'var(--color-vert)'
  if (valeur >= 45) return 'var(--color-or)'
  return 'var(--color-rouge)'
}

/** Un anneau de winrate, le pourcentage au centre. */
export function AnneauWinrate({
  valeur,
  libelle,
  taille = 132,
}: {
  valeur: number
  libelle: string
  taille?: number
}) {
  const rayon = 42
  const perimetre = 2 * Math.PI * rayon
  const plein = (Math.min(100, Math.max(0, valeur)) / 100) * perimetre
  const couleur = couleurWinrate(valeur)
  return (
    <div className="relative grid place-items-center" style={{ width: taille, height: taille }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={rayon} fill="none" stroke="var(--color-bord)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={rayon}
          fill="none"
          stroke={couleur}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${plein} ${perimetre}`}
        />
      </svg>
      <div className="relative text-center">
        <p className="font-titre text-[clamp(22px,2.6vw,30px)] leading-none" style={{ color: couleur }}>
          {valeur}%
        </p>
        <p className="mt-1 font-mono text-[9.5px] tracking-[.16em] text-gris uppercase">{libelle}</p>
      </div>
    </div>
  )
}

/** Une barre de winrate fine, avec son pourcentage. */
export function BarreWinrate({ valeur, className = '' }: { valeur: number; className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="h-1.5 w-full min-w-10 overflow-hidden rounded-full bg-bord" aria-hidden>
        <span className="block h-full rounded-full" style={{ width: `${valeur}%`, background: couleurWinrate(valeur) }} />
      </span>
      <span className="w-9 shrink-0 text-right font-mono text-[12px] tabular-nums text-creme">{valeur}%</span>
    </span>
  )
}

/** Une statistique en tuile. */
export function TuileStat({
  libelle,
  valeur,
  detail,
  couleur,
  className = '',
}: {
  libelle: React.ReactNode
  valeur: React.ReactNode
  detail?: React.ReactNode
  couleur?: string
  className?: string
}) {
  return (
    <div className={`rounded-carte border border-bord bg-braise px-4.5 py-4 ${className}`}>
      <p className="font-mono text-[10.5px] tracking-[.16em] text-gris uppercase">{libelle}</p>
      <p className="mt-2 font-titre text-[clamp(20px,2.4vw,27px)] leading-none" style={couleur ? { color: couleur } : undefined}>
        {valeur}
      </p>
      {detail && <p className="mt-2 text-[12.5px] leading-snug text-gris">{detail}</p>}
    </div>
  )
}

/** Le nom d'un mode, précédé de sa pastille de couleur. */
export function PastilleMode({ mode, className = '' }: { mode: string; className?: string }) {
  const infos = infosMode(mode)
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[.08em] whitespace-nowrap text-creme uppercase ${className}`}>
      <span aria-hidden className="size-2 rounded-full" style={{ background: infos.couleur }} />
      {infos.nom}
    </span>
  )
}
