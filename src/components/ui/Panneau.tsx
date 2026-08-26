/**
 * Le panneau cloisonné, façon tooltip d'item.
 *
 * Une tête sur fond braise avec son étiquette monospace, un corps, un pied
 * facultatif sur fond nuit translucide. Les cloisons sont des filets de 1px ;
 * `overflow-hidden` sur le cadre les fait mourir proprement dans les angles
 * arrondis.
 *
 * Employé par le panneau latéral de la fiche kit (prix + caractéristiques +
 * bouton), le compte à rebours du classement, et l'encart de récompenses.
 */
export function Panneau({
  titre,
  pied,
  /** Bordure oni au lieu de neutre — contexte exclusif. */
  ton = 'defaut',
  /** Ombre portée profonde. Réservée aux panneaux qui flottent sur un halo. */
  ombre = false,
  className = '',
  children,
}: {
  titre?: React.ReactNode
  pied?: React.ReactNode
  ton?: 'defaut' | 'oni'
  ombre?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`overflow-hidden rounded-carte border bg-charbon ${
        ton === 'oni' ? 'border-oni/35' : 'border-bord'
      } ${ombre ? 'shadow-[0_30px_70px_-34px_rgba(0,0,0,.9)]' : ''} ${className}`}
    >
      {titre && (
        <div className="border-b border-bord bg-braise px-5 py-3.5 font-mono text-[10.5px] font-bold tracking-[.2em] text-soupe uppercase">
          {titre}
        </div>
      )}

      {children}

      {pied && (
        <div className="border-t border-bord bg-nuit/50 px-5 py-4">{pied}</div>
      )}
    </div>
  )
}

/**
 * Une section interne du panneau, séparée de la suivante par un filet.
 * `dernier` coupe le filet du bas — sans quoi il doublerait celui du pied.
 */
export function SectionPanneau({
  dernier = false,
  className = '',
  children,
}: {
  dernier?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`px-5 py-4 ${dernier ? '' : 'border-b border-bord'} ${className}`}>
      {children}
    </div>
  )
}
