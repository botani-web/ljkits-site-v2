'use client'

import { useActionState } from 'react'

import { ETAT_VIDE, type EtatFormulaire } from '@/actions/etat'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import { ChampZoneTexte } from '@/components/admin/Champs'

/** La note interne du staff sur un candidat. Vue de l'admin uniquement. */
export function FormulaireNote({
  action,
  note,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
  note: string | null
}) {
  const [etat, envoyer] = useActionState(action, ETAT_VIDE)

  return (
    <form action={envoyer} className="flex flex-col gap-3">
      <ChampZoneTexte
        nom="noteAdmin"
        label="Ce que le staff en pense"
        aide="Visible seulement ici. Ni le candidat ni Discord ne la voient."
        rows={4}
        maxLength={2000}
        defaultValue={note ?? ''}
        erreurs={etat.champs?.noteAdmin}
      />

      <div className="flex items-center gap-3">
        <BoutonSoumettre>Enregistrer la note</BoutonSoumettre>
        {etat.succes && <span className="text-[13px] text-vert">{etat.succes}</span>}
      </div>
    </form>
  )
}
