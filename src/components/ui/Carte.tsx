import Link from 'next/link'

/**
 * La carte : le conteneur le plus répandu du site.
 *
 * Fond charbon, bordure de 1px, rayon de 5px. Au survol — uniquement quand
 * elle est cliquable — elle se soulève de 2px, sa bordure passe en soupe et
 * son fond s'éclaircit en braise.
 *
 * Deux tons :
 *   defaut — bordure neutre.
 *   oni    — bordure rouge translucide, pour les kits exclusifs. Le rouge
 *            plein est réservé au survol : à pleine opacité en permanence,
 *            une grille de six cartes vire au sapin de Noël.
 */
type TonCarte = 'defaut' | 'oni'

export function classesCarte({
  ton = 'defaut',
  /** Ajoute les effets de survol. À ne poser que si la carte est cliquable. */
  interactive = false,
  /** Fond braise au lieu de charbon — carte posée sur une section charbon. */
  surCharbon = false,
  className = '',
}: {
  ton?: TonCarte
  interactive?: boolean
  surCharbon?: boolean
  className?: string
} = {}) {
  const base = `rounded-carte border ${surCharbon ? 'bg-braise' : 'bg-charbon'}`

  const tons: Record<TonCarte, string> = {
    defaut: 'border-bord',
    oni: 'border-oni/35',
  }

  const survol: Record<TonCarte, string> = {
    defaut: 'hover:border-soupe hover:bg-braise',
    oni: 'hover:border-oni hover:bg-braise',
  }

  return [
    base,
    tons[ton],
    interactive
      ? `transition-[border-color,transform,background] duration-[.18s] hover:-translate-y-0.5 ${survol[ton]}`
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

/** Carte non cliquable. */
export function Carte({
  ton,
  surCharbon,
  className,
  children,
}: {
  ton?: TonCarte
  surCharbon?: boolean
  className?: string
  children: React.ReactNode
}) {
  return <div className={classesCarte({ ton, surCharbon, className })}>{children}</div>
}

/**
 * Carte cliquable.
 *
 * `relative overflow-hidden` est posé d'office : les cartes de kit portent un
 * kanji en filigrane qui déborde volontairement du coin bas droit, et sans ces
 * deux propriétés il s'échapperait de la carte.
 */
export function CarteLien({
  href,
  ton,
  surCharbon,
  className = '',
  children,
}: {
  href: string
  ton?: TonCarte
  surCharbon?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={classesCarte({
        ton,
        surCharbon,
        interactive: true,
        className: `relative flex flex-col overflow-hidden ${className}`,
      })}
    >
      {children}
    </Link>
  )
}

/**
 * Le kanji en filigrane du coin bas droit des cartes exclusives.
 * Purement décoratif : masqué aux lecteurs d'écran, insensible au clic et à la
 * sélection, sinon un double-clic sur la carte le surligne.
 */
export function KanjiFiligrane({
  children,
  taille = 88,
}: {
  children: React.ReactNode
  taille?: number
}) {
  return (
    <span
      aria-hidden="true"
      style={{ fontSize: `${taille}px` }}
      className="pointer-events-none absolute -right-1.5 -bottom-4 leading-none font-bold text-oni/10 select-none"
    >
      {children}
    </span>
  )
}
