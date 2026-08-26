/**
 * L'étiquette monospace en majuscules — la signature du système.
 *
 * Elle surtitre toutes les sections des maquettes, et sert aussi seule
 * (en-tête de panneau, tag de carte). Toujours en soupe, sauf indication
 * contraire via `className` : les blocs exclusifs la passent en oni.
 */
export function Etiquette({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <p
      className={`font-mono text-[11px] font-bold tracking-[.22em] text-soupe uppercase ${className}`}
    >
      {children}
    </p>
  )
}

/**
 * L'en-tête de section des maquettes : étiquette, titre, chapeau.
 *
 * Les trois éléments arrivent toujours dans cet ordre et avec ces écarts ;
 * les répéter page par page, c'est se garantir cinq variantes divergentes au
 * bout de trois semaines.
 *
 * Le titre est un ReactNode et non une chaîne : les maquettes accentuent
 * systématiquement un mot (`<span className="text-or">`), et parfois coupent
 * la ligne au <br/> choisi.
 */
export function TeteSection({
  etiquette,
  titre,
  chapeau,
  /** Aligne le bloc au centre — les blocs d'appel de fin de page. */
  centre = false,
  /** Niveau du titre. h2 par défaut ; h1 sur les hero de page. */
  niveau = 2,
  className = '',
}: {
  etiquette?: React.ReactNode
  titre: React.ReactNode
  chapeau?: React.ReactNode
  centre?: boolean
  niveau?: 1 | 2
  className?: string
}) {
  const Titre = niveau === 1 ? 'h1' : 'h2'

  return (
    <div className={`${centre ? 'text-center' : ''} ${className}`}>
      {etiquette && <Etiquette>{etiquette}</Etiquette>}

      <Titre
        className={`font-titre ${niveau === 1 ? 'text-h1 mt-4' : 'text-h2 mt-3'} ${
          etiquette ? '' : 'mt-0'
        }`}
      >
        {titre}
      </Titre>

      {chapeau && (
        <p
          className={`mt-3.5 max-w-[62ch] text-[clamp(15px,1.6vw,16.5px)] text-gris ${
            centre ? 'mx-auto' : ''
          }`}
        >
          {chapeau}
        </p>
      )}
    </div>
  )
}
