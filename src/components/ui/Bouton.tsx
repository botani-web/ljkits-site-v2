import Link from 'next/link'

/**
 * LE bouton du site. Il n'y en a qu'un.
 *
 * Avant la refonte, six définitions de bouton cohabitaient (nav, hero, footer,
 * boutique, admin, classement), toutes légèrement différentes. Tout passe
 * désormais par `classesBouton`.
 *
 * Trois variantes, telles que les maquettes les emploient :
 *   plein  — action principale, aplat soupe. Une seule par écran.
 *   or     — action d'achat de la boutique, aplat or. Se distingue du plein
 *            quand les deux sont côte à côte (grade mis en avant).
 *   vide   — action secondaire, contour seul.
 *
 * ⚠ `min-h-11` (44px) est un ajout aux maquettes, qui s'arrêtaient à 39px de
 * hauteur réelle. C'est la taille de cible tactile minimale exigée.
 */
type VarianteBouton = 'plein' | 'or' | 'vide'
type TailleBouton = 'normale' | 'grande'

export function classesBouton({
  variante = 'plein',
  taille = 'normale',
  /** Occupe toute la largeur disponible — pied de carte, panneau latéral. */
  pleineLargeur = false,
  className = '',
}: {
  variante?: VarianteBouton
  taille?: TailleBouton
  pleineLargeur?: boolean
  className?: string
} = {}) {
  const base =
    'inline-flex min-h-11 items-center justify-center gap-2.5 rounded-controle font-mono font-bold tracking-[.08em] uppercase transition-[transform,background,border-color,box-shadow] duration-150 active:translate-y-px'

  const tailles: Record<TailleBouton, string> = {
    normale: 'px-4.5 py-2.5 text-[12.5px]',
    grande: 'px-6 py-3.5 text-[13px]',
  }

  const variantes: Record<VarianteBouton, string> = {
    plein: 'bg-soupe text-encre hover:bg-or hover:shadow-[0_8px_26px_-8px_rgba(254,147,1,.7)]',
    or: 'bg-or text-encre hover:bg-[#ffd84a] hover:shadow-[0_8px_26px_-8px_rgba(253,192,3,.75)]',
    vide: 'border border-bord text-creme hover:border-soupe hover:bg-braise',
  }

  return [
    base,
    tailles[taille],
    variantes[variante],
    pleineLargeur ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

type ProprietesCommunes = {
  variante?: VarianteBouton
  taille?: TailleBouton
  pleineLargeur?: boolean
  className?: string
  children: React.ReactNode
}

/** Bouton d'action — déclenche quelque chose, ne navigue pas. */
export function Bouton({
  variante,
  taille,
  pleineLargeur,
  className,
  children,
  ...reste
}: ProprietesCommunes & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...reste}
      className={classesBouton({ variante, taille, pleineLargeur, className })}
    >
      {children}
    </button>
  )
}

/** Lien interne stylé en bouton. */
export function LienBouton({
  href,
  variante,
  taille,
  pleineLargeur,
  className,
  children,
  ...reste
}: ProprietesCommunes & { href: string } & Omit<
    React.ComponentProps<typeof Link>,
    'href' | 'className' | 'children'
  >) {
  return (
    <Link
      href={href}
      {...reste}
      className={classesBouton({ variante, taille, pleineLargeur, className })}
    >
      {children}
    </Link>
  )
}

/**
 * Lien externe stylé en bouton (Discord, sites tiers).
 * `rel="noopener noreferrer"` est posé ici plutôt que rappelé à chaque appel :
 * c'est exactement le genre d'attribut qu'on oublie une fois sur trois.
 */
export function LienExterneBouton({
  href,
  variante,
  taille,
  pleineLargeur,
  className,
  children,
  ...reste
}: ProprietesCommunes & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...reste}
      className={classesBouton({ variante, taille, pleineLargeur, className })}
    >
      {children}
    </a>
  )
}
