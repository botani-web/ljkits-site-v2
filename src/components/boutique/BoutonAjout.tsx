'use client'

import { classesBouton } from '@/components/ui/Bouton'

/**
 * Le bouton d'ajout au panier, commun aux grades, aux kits et aux packs.
 *
 * C'est une bascule : recliquer retire l'article. On ne vend rien en plusieurs
 * exemplaires — un grade acheté deux fois n'a aucun sens.
 *
 * Il passe par `classesBouton` comme tous les autres boutons du site ; seul
 * l'état « dans le panier » sort de ses trois variantes, parce qu'il n'est ni
 * une action principale ni une action secondaire mais une confirmation.
 */
export function BoutonAjout({
  dansLePanier,
  indisponible = false,
  libelleIndisponible = 'Bientôt disponible',
  libelle = 'Ajouter au panier',
  /** `or` pour l'article mis en avant : grade phare, pack. */
  variante = 'plein',
  pleineLargeur = true,
  onClick,
}: {
  dansLePanier: boolean
  indisponible?: boolean
  libelleIndisponible?: string
  libelle?: string
  variante?: 'plein' | 'or'
  pleineLargeur?: boolean
  onClick: () => void
}) {
  if (indisponible) {
    return (
      <span
        aria-disabled="true"
        className={classesBouton({
          variante: 'vide',
          pleineLargeur,
          className: 'cursor-default text-gris opacity-50',
        })}
      >
        {libelleIndisponible}
      </span>
    )
  }

  if (dansLePanier) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classesBouton({
          variante: 'vide',
          pleineLargeur,
          className: 'border-vert bg-braise text-vert hover:border-vert hover:bg-braise',
        })}
      >
        <span aria-hidden="true">✓</span> Dans le panier
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classesBouton({ variante, pleineLargeur })}
    >
      {libelle}
    </button>
  )
}
