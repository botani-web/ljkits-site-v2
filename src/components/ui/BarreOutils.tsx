'use client'

/**
 * La barre d'outils collante de /kits, /classement et /boutique : filtres ou
 * onglets à gauche, champ de recherche à droite.
 *
 * Elle se colle juste sous la barre de navigation (`top-nav`), avec le même
 * fond translucide et le même flou. Sous 860px, le champ de recherche passe
 * au-dessus des filtres et prend toute la largeur : c'est le contrôle qu'on
 * vise en premier au pouce.
 */
export function BarreOutils({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`sticky top-nav z-50 border-y border-bord bg-nuit/95 py-3.5 backdrop-blur-xl ${className}`}
    >
      <div className="mx-auto flex w-full max-w-contenu flex-wrap items-center gap-2.5 px-gouttiere">
        {children}
      </div>
    </div>
  )
}

/**
 * Le champ de recherche : icône loupe puis saisie, dans un cadre unique.
 *
 * `type="search"` plutôt que `text` : le clavier mobile affiche « Rechercher »
 * et le navigateur propose sa croix d'effacement native.
 * `mr-auto` sur le conteneur des filtres pousse ce champ à droite ; en dessous
 * de 860px `order-first w-full` le remonte sur sa propre ligne.
 */
export function Recherche({
  valeur,
  onChange,
  etiquette,
  placeholder = 'Rechercher…',
  className = '',
}: {
  valeur: string
  onChange: (valeur: string) => void
  /** Libellé accessible. Il n'y a pas de <label> visible dans les maquettes. */
  etiquette: string
  placeholder?: string
  className?: string
}) {
  return (
    <div
      className={`order-first flex w-full min-w-[200px] items-center gap-2.5 rounded-controle border border-bord bg-charbon px-3 min-[860px]:order-none min-[860px]:ml-auto min-[860px]:w-auto ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className="size-[15px] shrink-0 text-gris"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>

      <input
        type="search"
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        aria-label={etiquette}
        placeholder={placeholder}
        className="min-h-11 w-full border-0 bg-transparent font-mono text-[12.5px] outline-none placeholder:text-gris"
      />
    </div>
  )
}
