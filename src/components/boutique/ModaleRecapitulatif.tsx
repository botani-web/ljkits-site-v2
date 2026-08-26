'use client'

import { useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'

import { formaterEuros } from '@/lib/format'
import type { ArticleAffiche } from '@/lib/panier'

/**
 * Récapitulatif avant paiement.
 *
 * Bâti sur l'élément <dialog> natif : Échap, clic sur le fond, piège de focus
 * et retour du focus au bouton d'origine sont gérés par le navigateur. C'est
 * ce qui permet de ne pas embarquer de librairie de modale.
 */
export function ModaleRecapitulatif({
  ouverte,
  articles,
  total,
  pseudo,
  erreur,
  action,
  onFermer,
}: {
  ouverte: boolean
  articles: ArticleAffiche[]
  total: number
  pseudo: string
  erreur?: string
  /** Server Action de création de commande, fournie par useActionState. */
  action: (formData: FormData) => void
  onFermer: () => void
}) {
  const dialogue = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialogue.current
    if (!element) return

    if (ouverte && !element.open) element.showModal()
    if (!ouverte && element.open) element.close()
  }, [ouverte])

  return (
    <dialog
      ref={dialogue}
      aria-labelledby="titre-recapitulatif"
      // Déclenché par Échap comme par close() : on resynchronise l'état React.
      onClose={onFermer}
      // Un clic sur le fond a pour cible le <dialog> lui-même.
      onClick={(evenement) => {
        if (evenement.target === dialogue.current) onFermer()
      }}
      className="m-auto w-full max-w-[440px] rounded-2xl border border-bord bg-charbon p-7 text-creme backdrop:bg-black/70"
    >
      <h2 id="titre-recapitulatif" className="mb-2.5 font-titre text-xl uppercase">
        Récapitulatif
      </h2>
      <p className="mb-3.5 text-[14.5px] text-gris">
        Vérifie le pseudo : c’est lui qui recevra la livraison en jeu.
      </p>

      <div className="mb-4.5 rounded-[9px] border border-bord bg-braise p-3.5 text-sm">
        <div className="flex justify-between gap-3 py-1">
          <span>Pseudo de livraison</span>
          <span className="font-mono font-bold">{pseudo}</span>
        </div>

        {articles.map((article) => (
          <div key={`${article.type}-${article.slug}`} className="flex justify-between gap-3 py-1">
            <span className="min-w-0 truncate">{article.nom}</span>
            <span className="shrink-0">{formaterEuros(article.prixCentimes)}</span>
          </div>
        ))}

        <div className="mt-2 flex justify-between gap-3 border-t border-bord pt-2.5 font-bold text-or">
          <span>Total</span>
          <span>{formaterEuros(total)}</span>
        </div>
      </div>

      {erreur && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-oni/40 bg-oni/10 px-3.5 py-2.5 text-[13.5px] text-oni"
        >
          {erreur}
        </p>
      )}

      {/*
        Le panier voyage en JSON dans un champ caché : c'est un état React,
        pas une suite de champs. Le serveur ne lui fait aucune confiance et
        relit les prix en base (cf. src/actions/commandes.ts).
      */}
      <form action={action}>
        <input type="hidden" name="pseudoMinecraft" value={pseudo} />
        <input
          type="hidden"
          name="articles"
          value={JSON.stringify(articles.map(({ type, slug }) => ({ type, slug })))}
        />
        <BoutonPaiement />
      </form>

      <button
        type="button"
        onClick={onFermer}
        className="mt-3 block w-full text-center text-[13px] text-gris transition-colors hover:text-white"
      >
        Revenir au panier
      </button>
    </dialog>
  )
}

function BoutonPaiement() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="block w-full rounded-[7px] bg-soupe px-4 py-2.5 text-center font-mono text-[12.5px] font-bold tracking-wide text-[#1a0f00] transition-all hover:-translate-y-px hover:bg-or disabled:cursor-default disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {pending ? 'Création de la commande…' : 'Aller au paiement'}
    </button>
  )
}
