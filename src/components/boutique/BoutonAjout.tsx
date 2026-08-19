'use client'

/**
 * Le bouton d'ajout au panier, commun aux grades, aux kits et aux packs.
 *
 * C'est une bascule, comme dans la maquette : recliquer retire l'article.
 * On ne vend rien en plusieurs exemplaires — un grade acheté deux fois n'a
 * aucun sens.
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
  const base = `text-center font-mono text-[12.5px] font-bold tracking-wide transition-all rounded-[7px] px-4 py-2.5 ${
    pleineLargeur ? 'mt-auto block w-full' : 'inline-block'
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
