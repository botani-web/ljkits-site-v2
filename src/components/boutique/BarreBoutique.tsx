'use client'

import { formaterEuros } from '@/lib/format'

/**
 * La barre de la boutique : le pseudo de livraison à gauche, le panier à
 * droite. Collante sous la barre de navigation, et propre à /boutique.
 *
 * Elle remplace la colonne latérale d'avant, que la mise en page à une seule
 * colonne de la maquette ne permet plus. Elle s'arrime par `top-nav`, comme la
 * barre d'outils de /kits.
 *
 * ⚠ VOCABULAIRE. Pas un mot de « compte », de « connexion » ou de
 * « déconnexion », pas d'avatar, pas de pastille d'état. Il n'y a pas de
 * comptes sur ce site, et une barre qui en a l'air ferait réclamer un mot de
 * passe qui n'existe pas. Chaque libellé dit la même chose : c'est le pseudo
 * qui reçoit la livraison.
 *
 * Les deux contrôles ouvrent le même tiroir — on y choisit son pseudo ET on y
 * voit son panier. Deux panneaux séparés pour deux boutons voisins n'auraient
 * fait qu'ajouter un choix à faire.
 *
 * À 360px, le mot « Panier » disparaît : il ne reste que l'icône et le
 * compteur. Le bloc de gauche, lui, tronque le pseudo plutôt que de pousser le
 * bouton hors de l'écran.
 */
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
        {/* ----------------------- pseudo de livraison ---------------------- */}
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

        {/* ---------------------------- panier ---------------------------- */}
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

          {/* Le total n'apparaît qu'à partir de 560px : à 360, il pousserait
              le pseudo hors de la barre. */}
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
