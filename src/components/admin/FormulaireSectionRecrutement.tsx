'use client'

import { useActionState, useState } from 'react'

import { ETAT_VIDE, type EtatFormulaire } from '@/actions/etat'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'

/**
 * Création d'une section, repliée par défaut.
 *
 * On crée une section trois fois dans la vie du formulaire : le bouton ne doit
 * pas occuper la place d'une action courante.
 */
export function FormulaireSectionRecrutement({
  action,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
}) {
  const [etat, envoyer] = useActionState(action, ETAT_VIDE)
  const [ouvert, setOuvert] = useState(false)

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="self-start rounded-controle border border-bord px-4 py-2.5 text-sm font-semibold text-gris transition-colors hover:border-soupe hover:text-soupe"
      >
        + Nouvelle section
      </button>
    )
  }

  return (
    <form
      action={envoyer}
      className="flex flex-wrap items-end gap-3 rounded-carte border border-bord bg-charbon p-4"
    >
      <div className="min-w-[200px] flex-1">
        <label htmlFor="nom" className="mb-1.5 block text-sm font-semibold text-creme">
          Nom de la section
        </label>
        <input
          id="nom"
          name="nom"
          type="text"
          maxLength={60}
          autoFocus
          className="w-full rounded-controle border border-bord bg-nuit px-3.5 py-2.5 text-[15px] text-creme focus:border-soupe focus:outline-none"
        />
        {etat.champs?.nom && (
          <p className="mt-1.5 text-[13px] text-rouge">{etat.champs.nom[0]}</p>
        )}
        {etat.succes && <p className="mt-1.5 text-[13px] text-vert">{etat.succes}</p>}
      </div>

      {/* Cochée d'office : on ne crée pas une section pour la laisser masquée. */}
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-gris">
        <input
          name="actif"
          type="checkbox"
          defaultChecked
          className="size-4 accent-soupe"
        />
        Active
      </label>

      <BoutonSoumettre enCours="Création…">Créer</BoutonSoumettre>

      <button
        type="button"
        onClick={() => setOuvert(false)}
        className="inline-flex min-h-11 items-center rounded-controle border border-bord px-3 text-[13px] text-gris transition-colors hover:text-creme"
      >
        Annuler
      </button>
    </form>
  )
}
