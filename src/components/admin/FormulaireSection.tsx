'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { ETAT_VIDE, type EtatFormulaire } from '@/actions/etat'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import { ChampCase, ChampTexte, MessageErreurGlobale } from '@/components/admin/Champs'
import { EditeurMarkdown } from '@/components/admin/EditeurMarkdown'

export type SectionEnEdition = {
  titre: string
  contenu: string
  publie: boolean
}

export function FormulaireSection({
  action,
  section,
  libelleBouton,
  discord,
}: {
  /** Server Action déjà liée : creerSection, ou modifierSection.bind(null, id). */
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
  section?: SectionEnEdition
  libelleBouton: string
  discord: string
}) {
  const [etat, envoyer] = useActionState(action, ETAT_VIDE)

  return (
    <form action={envoyer} className="flex flex-col gap-6">
      <MessageErreurGlobale message={etat.erreur} />

      <section className="flex flex-col gap-4 rounded-carte border border-bord bg-charbon px-6 py-6">
        <ChampTexte
          nom="titre"
          label="Titre de la section"
          defaultValue={section?.titre}
          required
          maxLength={120}
          placeholder="Triche — tolérance zéro"
          erreurs={etat.champs?.titre}
        />

        <ChampCase
          nom="publie"
          label="Publiée"
          aide="Décochée, la section reste un brouillon et n’apparaît pas sur /reglement."
          defaultChecked={section?.publie ?? false}
        />
      </section>

      <section className="rounded-carte border border-bord bg-charbon px-6 py-6">
        <EditeurMarkdown
          nom="contenu"
          label="Contenu de la section"
          valeurInitiale={section?.contenu ?? ''}
          erreurs={etat.champs?.contenu}
          lignes={18}
          discord={discord}
        />
      </section>

      <div className="flex items-center gap-3">
        <BoutonSoumettre>{libelleBouton}</BoutonSoumettre>
        <Link
          href="/admin/reglement"
          className="rounded-controle border border-bord px-4 py-2.5 text-sm font-semibold text-gris transition-colors hover:text-creme"
        >
          Annuler
        </Link>
      </div>
    </form>
  )
}
