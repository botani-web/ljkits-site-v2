/**
 * La colonne de contenu du site : largeur maximale et gouttières.
 *
 * Un seul endroit décide de la largeur du site. Avant la refonte, chaque page
 * répétait `mx-auto max-w-contenu px-6` — et la gouttière était figée à 24px
 * quelle que soit la largeur d'écran. Les maquettes la font respirer :
 * 18px sur un téléphone, 44px sur un grand écran (--spacing-gouttiere).
 *
 * `w-full` est nécessaire : sans lui, une enveloppe posée dans un conteneur
 * flex se rétracte à la largeur de son contenu au lieu d'occuper la ligne.
 */
export function Enveloppe({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`mx-auto w-full max-w-contenu px-gouttiere ${className}`}>{children}</div>
  )
}
