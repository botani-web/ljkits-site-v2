'use client'

import { ChampPseudo } from '@/components/boutique/ChampPseudo'
import { formaterEuros } from '@/lib/format'
import type { ArticleAffiche, ArticlePanier } from '@/lib/panier'

const LIBELLE_TYPE = {
  KIT: 'Kit',
  GRADE: 'Grade',
  PACK: 'Pack',
} as const

/**
 * Le panier, collé en haut à droite au scroll.
 *
 * Il n'affiche que ce que le serveur lui a donné : les prix viennent du
 * catalogue rendu côté serveur, jamais du localStorage.
 */
export function Panier({
  articles,
  total,
  pseudo,
  pretAPayer,
  onRetirer,
  onValiderPseudo,
  onChangerPseudo,
  onPayer,
}: {
  articles: ArticleAffiche[]
  total: number
  pseudo: string | null
  pretAPayer: boolean
  onRetirer: (article: ArticlePanier) => void
  onValiderPseudo: (pseudo: string) => void
  onChangerPseudo: () => void
  onPayer: () => void
}) {
  return (
    <aside
      id="panier"
      className="rounded-xl border border-bord bg-charbon p-5.5 lg:sticky lg:top-22"
    >
      <h2 className="font-titre text-[17px] uppercase">Ton panier</h2>
      <p className="mt-1 mb-4 text-[13px] text-gris">
        La livraison se fait sur le compte indiqué ci-dessous.
      </p>

      <ChampPseudo pseudo={pseudo} onValider={onValiderPseudo} onChanger={onChangerPseudo} />

      <div className="mb-4 flex flex-col gap-2.5">
        {articles.length === 0 ? (
          <p className="rounded-[9px] border border-dashed border-bord px-2.5 py-6.5 text-center text-sm text-gris">
            Ton panier est vide.
            <br />
            Ajoute un grade ou un kit.
          </p>
        ) : (
          articles.map((article) => (
            <div
              key={`${article.type}-${article.slug}`}
              className="flex items-center gap-3 rounded-[9px] border border-bord bg-braise px-3.5 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{article.nom}</div>
                <div className="font-mono text-[10.5px] tracking-[1px] text-gris uppercase">
                  {LIBELLE_TYPE[article.type]}
                </div>
              </div>
              <div className="font-mono text-sm font-bold text-or">
                {formaterEuros(article.prixCentimes)}
              </div>
              <button
                type="button"
                onClick={() => onRetirer(article)}
                aria-label={`Retirer ${article.nom}`}
                className="px-0.5 text-[17px] leading-none text-gris transition-colors hover:text-oni"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-baseline justify-between border-t border-bord pt-3.5">
        <span className="text-sm text-gris">Total</span>
        <div className="text-right">
          <div className="font-titre text-[26px] text-or">{formaterEuros(total)}</div>
          <div className="mt-0.5 text-[11.5px] text-gris">TVA incluse</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onPayer}
        disabled={!pretAPayer}
        className="mt-4 block w-full rounded-[7px] bg-soupe px-4 py-2.5 text-center font-mono text-[12.5px] font-bold tracking-wide text-[#1a0f00] transition-all hover:-translate-y-px hover:bg-or disabled:cursor-default disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-soupe"
      >
        Passer au paiement
      </button>

      <p className="mt-3 text-center text-xs text-gris">
        {articles.length === 0
          ? 'Ajoute un article pour continuer.'
          : pseudo === null
            ? 'Entre ton pseudo pour commander.'
            : `Livraison sur le compte ${pseudo}.`}
      </p>
    </aside>
  )
}
