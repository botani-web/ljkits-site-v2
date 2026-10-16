import Link from 'next/link'

import type { Grade } from '@/lib/grades-commun'
import { lien, type Locale } from '@/lib/i18n'
import { ts } from '@/lib/i18n-s2'
import { nomPalier, palierDe } from '@/lib/paliers'
import { cheminProfil, infosMode, type Resultat, urlTete } from '@/lib/practice-commun'

/**
 * LES BRIQUES DE LA REFONTE SAISON 2 (16/10/2026).
 *
 * Toutes rendues côté serveur, sans une ligne de JavaScript envoyée au
 * navigateur : c'est ce qui permet aux pages de s'afficher d'un coup depuis le
 * cache du CDN. Les images (têtes, items) ont leur taille écrite en dur pour
 * que rien ne saute pendant le chargement.
 */

/** Le conteneur de page : 1200 px au plus, gouttière de 16 px sur téléphone. */
export function Conteneur({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 ${className}`}>{children}</div>
}

/** L'icône d'un mode : la texture 1.8.9 de l'item du menu, en pixels nets. */
/** Les textures presque noires (obsidienne, œuf de dragon) : éclaircies pour rester lisibles sur le fond nuit. */
const ICONES_SOMBRES = new Set(['blocks-obsidian', 'blocks-dragon_egg'])

export function IconeMode({ mode, taille = 20, className = '' }: { mode: string; taille?: number; className?: string }) {
  const infos = infosMode(mode)
  const sombre = ICONES_SOMBRES.has(infos.icone)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/items/${infos.icone}.png`}
      alt=""
      width={taille}
      height={taille}
      loading="lazy"
      decoding="async"
      className={`shrink-0 [image-rendering:pixelated] ${sombre ? 'brightness-[2.6] saturate-150' : ''} ${className}`}
    />
  )
}

/** La tête d'un joueur (mc-heads), carrée, avec un fond pendant le chargement. */
export function Tete({ pseudo, taille = 24, className = '' }: { pseudo: string; taille?: number; className?: string }) {
  // On demande le double pour les écrans haute densité, plafonné à ce que mc-heads sert vite.
  const source = Math.min(128, Math.max(16, taille * 2))
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={urlTete(pseudo, source)}
      alt=""
      width={taille}
      height={taille}
      loading="lazy"
      decoding="async"
      className={`shrink-0 rounded-[3px] bg-braise [image-rendering:pixelated] ${className}`}
    />
  )
}

/**
 * Un nombre qui défile de 0 à sa valeur quand il arrive à l'écran (compteur CSS,
 * globals.css). La vraie valeur reste dans le texte pour les lecteurs d'écran et
 * le copier-coller ; sans support, c'est elle qu'on voit, directement.
 */
export function Compteur({
  valeur,
  className = '',
  defilement = false,
}: {
  valeur: number
  className?: string
  /** Plus bas dans la page : défile quand il arrive à l'écran plutôt qu'au chargement. */
  defilement?: boolean
}) {
  return (
    <span className={`compteur ${defilement ? 'au-defilement' : ''} ${className}`} style={{ ['--fin' as string]: Math.round(valeur) }}>
      <span className="sr-only">{valeur}</span>
    </span>
  )
}

/** Un Elo, toujours à la couleur de son palier (règle du jeu, cf. Palier.java). `anime` : il défile en arrivant. */
export function Elo({
  valeur,
  className = '',
  anime = false,
  defilement = false,
}: {
  valeur: number
  className?: string
  anime?: boolean
  defilement?: boolean
}) {
  return (
    <span className={`font-mono font-bold tabular-nums ${className}`} style={{ color: palierDe(valeur).couleur }}>
      {anime ? <Compteur valeur={valeur} defilement={defilement} /> : valeur}
    </span>
  )
}

/** Le nom du palier, en petites capitales, à la couleur du palier. */
export function NomPalier({ elo, locale, className = '' }: { elo: number; locale: Locale; className?: string }) {
  const palier = palierDe(elo)
  return (
    <span className={`text-[11px] font-semibold uppercase tracking-[.08em] ${className}`} style={{ color: palier.couleur }}>
      {nomPalier(palier, locale)}
    </span>
  )
}

/** Le grade d'un joueur (LJ+, MOD…), en étiquette compacte. */
export function BadgeGrade({ grade, className = '' }: { grade: Grade | null | undefined; className?: string }) {
  if (!grade) return null
  return (
    <span
      className={`inline-flex h-[18px] shrink-0 items-center rounded-[3px] px-1.5 font-mono text-[10px] font-bold leading-none tracking-[.04em] ${className}`}
      style={{ color: grade.couleur, backgroundColor: `${grade.couleur}1f`, boxShadow: `inset 0 0 0 1px ${grade.couleur}55` }}
    >
      {grade.libelle}
    </span>
  )
}

/** Un pseudo cliquable avec sa tête (et son grade s'il en a un). */
export function LienJoueur({
  pseudo,
  locale,
  grade,
  taille = 22,
  className = '',
  gras = true,
}: {
  pseudo: string
  locale: Locale
  grade?: Grade | null
  taille?: number
  className?: string
  gras?: boolean
}) {
  return (
    <Link
      href={lien(locale, cheminProfil(pseudo))}
      className={`group/joueur inline-flex min-w-0 items-center gap-2 ${className}`}
    >
      <Tete pseudo={pseudo} taille={taille} />
      <span className={`truncate group-hover/joueur:text-or ${gras ? 'font-semibold' : ''}`}>{pseudo}</span>
      <BadgeGrade grade={grade} />
    </Link>
  )
}

/** Les derniers résultats, du plus ancien au plus récent (le plus récent à droite, comme partout). */
export function Forme({ resultats, locale }: { resultats: Resultat[]; locale: Locale }) {
  if (resultats.length === 0) return <span className="text-gris/60">—</span>
  return (
    <span className="cascade inline-flex gap-[3px]" aria-label={resultats.join(' ')}>
      {[...resultats].reverse().map((r, i) => (
        <span
          key={i}
          className={`grid size-[17px] place-items-center rounded-[3px] font-mono text-[9.5px] font-bold ${
            r === 'V' ? 'bg-vert/15 text-vert' : 'bg-rouge/15 text-rouge'
          }`}
        >
          {r === 'V' ? ts(locale, 'c.v') : ts(locale, 'c.d')}
        </span>
      ))}
    </span>
  )
}

/** Un gain ou une perte d'Elo : +12 en vert, −9 en rouge, barré si le match a été annulé. */
export function Delta({ valeur, annule = false, className = '' }: { valeur: number; annule?: boolean; className?: string }) {
  const signe = valeur > 0 ? '+' : valeur < 0 ? '−' : '±'
  return (
    <span
      className={`font-mono font-bold tabular-nums ${annule ? 'text-gris line-through' : valeur >= 0 ? 'text-vert' : 'text-rouge'} ${className}`}
    >
      {signe}
      {Math.abs(valeur)}
    </span>
  )
}

/** Une barre de winrate fine, verte au-dessus de 50 %. */
export function BarreWinrate({ valeur, className = '' }: { valeur: number; className?: string }) {
  return (
    <span className={`relative block h-1 overflow-hidden rounded-full bg-bord ${className}`}>
      <span
        className={`remplir-x absolute inset-y-0 left-0 rounded-full ${valeur >= 50 ? 'bg-vert' : 'bg-rouge/80'}`}
        style={{ width: `${Math.max(2, Math.min(100, valeur))}%` }}
      />
    </span>
  )
}

/** Le titre d'une section : un intitulé court et, à droite, un lien ou une info. */
export function TitreSection({
  titre,
  sous,
  droite,
  id,
}: {
  titre: string
  sous?: string
  droite?: React.ReactNode
  id?: string
}) {
  return (
    <div className="apparition mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <h2 id={id} className="text-[19px] font-bold tracking-[-.01em] text-creme sm:text-[21px]">
          {titre}
        </h2>
        {sous && <p className="mt-0.5 text-[14px] text-gris">{sous}</p>}
      </div>
      {droite}
    </div>
  )
}

/** Un panneau : le fond des blocs de contenu. */
export function Panneau({
  children,
  className = '',
  as: Balise = 'div',
  style,
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'aside'
  style?: React.CSSProperties
}) {
  return (
    <Balise className={`rounded-[8px] border border-bord bg-charbon ${className}`} style={style}>
      {children}
    </Balise>
  )
}

/** Une petite statistique : libellé discret au-dessus, valeur en avant. */
export function Chiffre({
  libelle,
  children,
  sous,
  className = '',
}: {
  libelle: string
  children: React.ReactNode
  sous?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="text-[11.5px] font-medium uppercase tracking-[.08em] text-gris">{libelle}</div>
      <div className="mt-1 truncate text-[20px] font-bold leading-tight text-creme">{children}</div>
      {sous && <div className="mt-0.5 truncate text-[12.5px] text-gris">{sous}</div>}
    </div>
  )
}

/** Le lien « Tout voir → » des en-têtes de section. */
export function LienVoirTout({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-or hover:text-soupe">
      {children}
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 3l5 5-5 5" />
      </svg>
    </Link>
  )
}
