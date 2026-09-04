'use client'

import { formaterEuros } from '@/lib/format'

/**
 * La barre de la boutique, collante sous la navigation : les rayons à gauche,
 * le pseudo de livraison au milieu, le panier à droite.
 *
 * Les liens de rayon sont des ancres : depuis la refonte du 03/09/2026, les
 * grades et les coins sont tous deux affichés, l'un sous l'autre. On ne
 * choisit plus un rayon, on y descend.
 *
 * ⚠ VOCABULAIRE. Pas un mot de « compte » ni de « connexion » : il n'y a pas
 * de comptes sur ce site. Chaque libellé dit la même chose — c'est le pseudo
 * qui reçoit la livraison.
 */
const RAYONS = [
  { href: '#grades', nom: 'Grades' },
  { href: '#coins', nom: 'Coins' },
  { href: '#aide', nom: 'Aide' },
]

export function BarreBoutique({
  pseudo,
  nombreArticles,
  total,
  onOuvrirPanier,
}: {
  pseudo: string | null
  nombreArticles: number
  total: number
  onOuvrirPanier: () => void
}) {
  return (
    <div className="sticky top-nav z-50 border-y border-bord bg-nuit/95 py-2.5 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-contenu items-center gap-3 px-gouttiere">
        <nav aria-label="Rayons" className="hidden shrink-0 items-center gap-1 lg:flex">
          {RAYONS.map((rayon) => (
            <a
              key={rayon.href}
              href={rayon.href}
              className="rounded-controle px-3 py-2 font-mono text-[11.5px] font-bold tracking-[.1em] text-gris uppercase transition-colors hover:bg-braise hover:text-creme"
            >
              {rayon.nom}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={onOuvrirPanier}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-controle border border-bord px-3 text-left transition-colors hover:border-soupe"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-4 shrink-0 text-gris"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
          </svg>
          {pseudo === null ? (
            <span className="truncate font-mono text-[11.5px] tracking-[.08em] text-soupe uppercase">
              Choisir mon pseudo
            </span>
          ) : (
            <span className="min-w-0 truncate font-mono text-[11.5px] tracking-[.04em]">
              <span className="text-gris">Livraison à </span>
              <span className="font-bold text-creme">{pseudo}</span>
            </span>
          )}
          <span className="ml-auto hidden shrink-0 font-mono text-[10.5px] text-gris underline underline-offset-2 min-[560px]:inline">
            {pseudo === null ? 'Renseigner' : 'Changer'}
          </span>
        </button>

        <button
          type="button"
          onClick={onOuvrirPanier}
          className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-controle bg-soupe px-3.5 font-mono text-[12.5px] font-bold tracking-[.08em] text-encre uppercase transition-colors hover:bg-or"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-4 shrink-0"
          >
            <path d="M4.5 8h15l-1.2 11.4a1.6 1.6 0 0 1-1.6 1.4H7.3a1.6 1.6 0 0 1-1.6-1.4Z" />
            <path d="M8.8 10.5V7a3.2 3.2 0 0 1 6.4 0v3.5" />
          </svg>
          <span className="max-[400px]:hidden">Panier</span>
          <span>({nombreArticles})</span>
          {nombreArticles > 0 && (
            <span className="hidden border-l border-encre/25 pl-2.5 min-[560px]:inline">
              {formaterEuros(total)}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
