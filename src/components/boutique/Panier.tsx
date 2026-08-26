'use client'

import { useEffect, useRef } from 'react'

import { ChampPseudo } from '@/components/boutique/ChampPseudo'
import { classesBouton } from '@/components/ui/Bouton'
import { formaterEuros } from '@/lib/format'
import type { ArticleAffiche, ArticlePanier } from '@/lib/panier'

const LIBELLE_TYPE = {
  KIT: 'Kit',
  GRADE: 'Grade',
  PACK: 'Pack',
} as const

/**
 * Le panier, en tiroir latéral.
 *
 * La maquette validée déroule la boutique sur une seule colonne : il n'y a
 * plus de place pour la colonne collante d'avant. Le panier devient donc un
 * tiroir, ouvert depuis la barre de la boutique.
 *
 * Bâti sur <dialog> natif, comme le menu mobile et la modale de paiement :
 * Échap, clic sur le fond, piégeage du focus et retour du focus au bouton
 * d'ouverture sont gérés par le navigateur. C'est ce qui permet de ne pas
 * embarquer de librairie de modale.
 *
 * Il n'affiche que ce que le serveur lui a donné : les prix viennent du
 * catalogue rendu côté serveur, jamais du localStorage.
 */
export function Panier({
  ouvert,
  articles,
  total,
  pseudo,
  pretAPayer,
  onFermer,
  onRetirer,
  onValiderPseudo,
  onChangerPseudo,
  onPayer,
}: {
  ouvert: boolean
  articles: ArticleAffiche[]
  total: number
  pseudo: string | null
  pretAPayer: boolean
  onFermer: () => void
  onRetirer: (article: ArticlePanier) => void
  onValiderPseudo: (pseudo: string) => void
  onChangerPseudo: () => void
  onPayer: () => void
}) {
  const dialogue = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialogue.current
    if (!element) return

    if (ouvert && !element.open) element.showModal()
    if (!ouvert && element.open) element.close()
  }, [ouvert])

  return (
    <dialog
      ref={dialogue}
      aria-label="Ton panier"
      onClose={onFermer}
      // Un clic sur le fond a pour cible le <dialog> lui-même.
      onClick={(evenement) => {
        if (evenement.target === dialogue.current) onFermer()
      }}
      className="fixed inset-0 m-0 max-h-none w-full max-w-none justify-end bg-transparent p-0 text-creme backdrop:bg-nuit/80 backdrop:backdrop-blur-sm open:flex"
    >
      <div className="flex h-full w-full max-w-[420px] flex-col border-l border-bord bg-charbon shadow-[0_0_80px_rgba(0,0,0,.8)]">
        <div className="flex items-center gap-3 border-b border-bord bg-braise px-5 py-4">
          <h2 className="font-mono text-[10.5px] font-bold tracking-[.2em] text-soupe uppercase">
            Ton panier
          </h2>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer le panier"
            className="-my-2 ml-auto flex size-11 shrink-0 items-center justify-center rounded-controle border border-bord text-gris transition-colors hover:border-oni hover:text-oni"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="size-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <ChampPseudo
            pseudo={pseudo}
            onValider={onValiderPseudo}
            onChanger={onChangerPseudo}
            // Le tiroir s'ouvre souvent depuis « Choisir mon pseudo » : autant
            // que le curseur soit déjà dans le champ.
            autoFocus={ouvert && pseudo === null}
          />

          <div className="mt-3.5 flex flex-col gap-2.5">
            {articles.length === 0 ? (
              <p className="rounded-carte border border-dashed border-bord px-4 py-9 text-center font-mono text-[13px] text-gris">
                Ton panier est vide.
                <br />
                Ajoute un grade ou un kit.
              </p>
            ) : (
              articles.map((article) => (
                <div
                  key={`${article.type}-${article.slug}`}
                  className="flex items-center gap-3 rounded-carte border border-bord bg-braise px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{article.nom}</p>
                    <p className="font-mono text-[10.5px] tracking-[.1em] text-gris uppercase">
                      {LIBELLE_TYPE[article.type]}
                    </p>
                  </div>

                  <span className="font-mono text-sm font-bold text-or">
                    {formaterEuros(article.prixCentimes)}
                  </span>

                  {/* -m-2 : la zone tactile fait 44px sans faire grossir la
                      ligne, qui reste compacte. */}
                  <button
                    type="button"
                    onClick={() => onRetirer(article)}
                    aria-label={`Retirer ${article.nom}`}
                    className="-m-2 flex size-11 shrink-0 items-center justify-center text-[17px] leading-none text-gris transition-colors hover:text-oni"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-bord bg-nuit/50 p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[11px] tracking-[.1em] text-gris uppercase">
              Total
            </span>
            <p className="text-right">
              <span className="font-mono text-[26px] leading-none font-bold text-or">
                {formaterEuros(total)}
              </span>
              <span className="mt-1 block font-mono text-[10.5px] text-gris">TVA incluse</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onPayer}
            disabled={!pretAPayer}
            className={classesBouton({
              variante: 'plein',
              pleineLargeur: true,
              className:
                'mt-4 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-soupe disabled:hover:shadow-none',
            })}
          >
            Passer au paiement
          </button>

          <p className="mt-3 text-center font-mono text-[10.5px] leading-relaxed text-gris">
            {articles.length === 0
              ? 'Ajoute un article pour continuer.'
              : pseudo === null
                ? 'Choisis ton pseudo pour commander.'
                : `La livraison ira à ${pseudo}.`}
          </p>
        </div>
      </div>
    </dialog>
  )
}
