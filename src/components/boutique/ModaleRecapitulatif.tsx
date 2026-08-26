'use client'

import { useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'

import { classesBouton } from '@/components/ui/Bouton'
import { LignesLore } from '@/components/ui/LignesLore'
import { Panneau, SectionPanneau } from '@/components/ui/Panneau'
import { formaterEuros } from '@/lib/format'
import type { ArticleAffiche } from '@/lib/panier'

/**
 * Récapitulatif avant paiement — le dernier écran avant de quitter le site.
 *
 * Bâti sur l'élément <dialog> natif : Échap, clic sur le fond, piège de focus
 * et retour du focus au bouton d'origine sont gérés par le navigateur. C'est
 * ce qui permet de ne pas embarquer de librairie de modale.
 *
 * ⚠ Le formulaire ne bouge pas. Les deux champs cachés `pseudoMinecraft` et
 * `articles` sont le contrat avec creerCommande ; le panier y voyage en JSON
 * parce que c'est un état React et non une suite de champs. Le serveur ne lui
 * fait aucune confiance et relit les prix en base
 * (cf. src/actions/commandes.ts).
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
      className="m-auto w-full max-w-[440px] bg-transparent p-4 text-creme backdrop:bg-nuit/80 backdrop:backdrop-blur-sm"
    >
      <Panneau
        ombre
        titre={<span id="titre-recapitulatif">Récapitulatif</span>}
        pied={
          <>
            {/*
              Le formulaire et ses deux champs cachés : contrat inchangé avec
              creerCommande. Seul l'habillage du bouton a bougé.
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
              className="mt-3 block w-full text-center font-mono text-[10.5px] tracking-[.08em] text-gris uppercase transition-colors hover:text-creme"
            >
              Revenir au panier
            </button>
          </>
        }
      >
        <SectionPanneau>
          <p className="font-mono text-[10.5px] font-bold tracking-[.18em] text-gris uppercase">
            Pseudo de livraison
          </p>
          <p className="mt-2 truncate font-mono text-[17px] font-bold text-creme">{pseudo}</p>
          <p className="mt-1.5 text-[12.5px] text-gris">
            Vérifie-le : c’est lui qui recevra la livraison en jeu.
          </p>
        </SectionPanneau>

        {/*
          La liste défile au-delà d'une certaine hauteur. Le panier accepte dix
          articles : sans ce plafond, la modale dépassait la hauteur d'écran des
          portables et le bouton de paiement devenait inatteignable — le même
          défaut que celui du tiroir, sous une autre forme.
        */}
        <SectionPanneau className="max-h-[38dvh] overflow-y-auto">
          <LignesLore
            separateur={false}
            lignes={articles.map((article) => ({
              libelle: article.nom,
              valeur: formaterEuros(article.prixCentimes),
            }))}
          />
        </SectionPanneau>

        {/* Le total vit HORS de la zone défilante : c'est le chiffre qu'on
            vérifie avant de payer, il ne doit jamais partir vers le haut. */}
        <SectionPanneau>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-[11px] tracking-[.1em] text-gris uppercase">
              Total
            </span>
            <span className="font-mono text-[22px] leading-none font-bold text-or">
              {formaterEuros(total)}
            </span>
          </div>
        </SectionPanneau>

        {erreur && (
          <SectionPanneau dernier>
            <p
              role="alert"
              className="rounded-controle border border-oni/40 bg-oni/10 px-3.5 py-2.5 text-[13.5px] text-oni"
            >
              {erreur}
            </p>
          </SectionPanneau>
        )}
      </Panneau>
    </dialog>
  )
}

function BoutonPaiement() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={classesBouton({
        variante: 'plein',
        pleineLargeur: true,
        className:
          'disabled:cursor-default disabled:opacity-60 disabled:hover:bg-soupe disabled:hover:shadow-none',
      })}
    >
      {pending ? 'Création de la commande…' : 'Aller au paiement'}
    </button>
  )
}
