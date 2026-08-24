'use client'

/**
 * Le bouton d'ajout au panier, commun aux grades, aux kits et aux packs.
 *
 * C'est une bascule, comme dans la maquette : recliquer retire l'article.
 * On ne vend rien en plusieurs exemplaires — un grade acheté deux fois n'a
 * aucun sens.
 *
 * `min-h-11` partout : 44 px est le plancher d'une zone tactile confortable,
 * et ce bouton est le geste principal de la page sur mobile.
 */
export function BoutonAjout({
  dansLePanier,
  indisponible = false,
  libelleIndisponible = 'Bientôt disponible',
  libelle = 'Ajouter au panier',
  pleineLargeur = true,
  onClick,
}: {
  dansLePanier: boolean
  indisponible?: boolean
  libelleIndisponible?: string
  libelle?: string
  pleineLargeur?: boolean
  onClick: () => void
}) {
  const base = `flex min-h-11 items-center justify-center rounded-[7px] px-4 py-2.5 text-center font-mono text-[12.5px] font-bold tracking-wide transition-all ${
    pleineLargeur ? 'mt-auto w-full' : 'inline-flex'
  }`

  if (indisponible) {
    return (
      <span
        aria-disabled="true"
        className={`${base} cursor-default border border-bord text-gris opacity-50`}
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
        className={`${base} border border-vert bg-braise text-vert`}
      >
        ✓ Dans le panier
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} bg-soupe text-[#1a0f00] hover:-translate-y-px hover:bg-or`}
    >
      {libelle}
    </button>
  )
}
