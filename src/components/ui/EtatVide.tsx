'use client'

/**
 * L'état vide : « aucun kit ne correspond », « aucun joueur sur cette
 * période ».
 *
 * Bordure en POINTILLÉS, et c'est le seul endroit du site où on en trouve.
 * C'est ce qui distingue d'un coup d'œil « il n'y a rien ici » de « voici une
 * carte » — sans avoir à lire le message.
 *
 * L'action de réinitialisation est facultative mais fortement recommandée
 * quand le vide résulte d'un filtre : sinon le visiteur doit deviner lequel de
 * ses trois filtres l'a mis dans cette impasse.
 */
export function EtatVide({
  message,
  action,
  className = '',
}: {
  message: React.ReactNode
  action?: { libelle: string; onClick: () => void }
  className?: string
}) {
  return (
    <div
      className={`rounded-carte border border-dashed border-bord px-6 py-12 text-center ${className}`}
    >
      <p className="font-mono text-[13px] text-gris">{message}</p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 inline-flex min-h-11 items-center border-b border-soupe font-mono text-xs font-bold tracking-[.1em] text-soupe uppercase"
        >
          {action.libelle}
        </button>
      )}
    </div>
  )
}
