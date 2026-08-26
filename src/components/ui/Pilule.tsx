'use client'

/**
 * Les deux pilules du système. Elles se ressemblent, elles ne disent pas la
 * même chose — d'où deux composants plutôt qu'une propriété.
 *
 * Filtre — /kits et /boutique. Restreint une liste. Plusieurs peuvent être
 *   actifs, ou aucun ; la liste reste visible dans tous les cas. C'est un
 *   interrupteur, donc `aria-pressed`. Actif : contour soupe et fond teinté.
 *
 * Onglet — /classement. Choisit LA vue affichée. Exactement un actif à la
 *   fois, et le contenu change entièrement. C'est une sélection, donc
 *   `role="tab"` et `aria-selected`. Actif : aplat soupe plein.
 *
 * Un lecteur d'écran annonce « bouton bascule, enfoncé » dans un cas et
 * « onglet, sélectionné, 2 sur 3 » dans l'autre. Les confondre effacerait
 * cette différence.
 *
 * ⚠ `min-h-11` (44px) est un ajout aux maquettes, qui s'arrêtaient à 36px.
 */
const BASE_PILULE =
  'inline-flex min-h-11 items-center justify-center rounded-controle border px-3.5 font-mono text-[11.5px] tracking-[.1em] uppercase transition duration-[.18s]'

export function Filtre({
  actif,
  onClick,
  className = '',
  children,
}: {
  actif: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={`${BASE_PILULE} font-medium ${
        actif
          ? 'border-soupe bg-soupe/7 text-soupe'
          : 'border-bord text-gris hover:border-gris hover:text-creme'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function Onglet({
  actif,
  onClick,
  /** Identifiant du panneau que cet onglet commande, pour `aria-controls`. */
  controle,
  className = '',
  children,
  ...reste
}: {
  actif: boolean
  onClick: () => void
  controle?: string
  className?: string
  children: React.ReactNode
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'className'>) {
  return (
    <button
      type="button"
      role="tab"
      onClick={onClick}
      aria-selected={actif}
      aria-controls={controle}
      // Un onglet non sélectionné sort du parcours de tabulation : dans un
      // `role="tablist"`, on entre dans le groupe par Tab puis on circule aux
      // flèches. C'est le comportement attendu du motif ARIA.
      tabIndex={actif ? 0 : -1}
      {...reste}
      className={`${BASE_PILULE} font-bold tracking-[.13em] ${
        actif
          ? 'border-soupe bg-soupe text-encre'
          : 'border-bord text-gris hover:border-gris hover:text-creme'
      } ${className}`}
    >
      {children}
    </button>
  )
}

/**
 * Le conteneur des onglets. Il porte `role="tablist"` et la navigation aux
 * flèches, que le motif ARIA impose et que le navigateur ne fournit pas.
 */
export function ListeOnglets({
  etiquette,
  /** Clés des onglets, dans l'ordre affiché. */
  cles,
  actif,
  onChange,
  className = '',
  children,
}: {
  etiquette: string
  cles: string[]
  actif: string
  onChange: (cle: string) => void
  className?: string
  children: React.ReactNode
}) {
  function auClavier(evenement: React.KeyboardEvent<HTMLDivElement>) {
    const pas =
      evenement.key === 'ArrowRight' ? 1 : evenement.key === 'ArrowLeft' ? -1 : 0
    if (pas === 0) return

    evenement.preventDefault()
    const index = cles.indexOf(actif)
    // Modulo positif : la flèche gauche depuis le premier onglet revient au
    // dernier. `%` seul renverrait -1 en JavaScript.
    const suivant = (index + pas + cles.length) % cles.length
    onChange(cles[suivant])
  }

  return (
    <div
      role="tablist"
      aria-label={etiquette}
      onKeyDown={auClavier}
      className={`flex flex-wrap gap-1.5 ${className}`}
    >
      {children}
    </div>
  )
}
