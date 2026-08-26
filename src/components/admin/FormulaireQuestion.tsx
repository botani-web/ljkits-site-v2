'use client'

import { useActionState, useState } from 'react'
import type { TypeQuestion } from '@prisma/client'

import { ETAT_VIDE, type EtatFormulaire } from '@/actions/etat'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import { ChampCase, ChampTexte, ChampZoneTexte } from '@/components/admin/Champs'
import { libelleType, uniteDesBornes } from '@/lib/recrutement-partage'

const TYPES: TypeQuestion[] = [
  'TEXTE_COURT',
  'TEXTE_LONG',
  'NOMBRE',
  'OUI_NON',
  'CHOIX_UNIQUE',
]

export type QuestionAEditer = {
  id: string
  sectionId: string
  libelle: string
  aide: string | null
  type: TypeQuestion
  options: string[]
  obligatoire: boolean
  minimum: number | null
  maximum: number | null
  actif: boolean
}

/**
 * Création et modification d'une question.
 *
 * Le TYPE commande le reste du formulaire, en direct : les options
 * n'apparaissent que pour un choix unique, et les bornes disparaissent là où
 * elles n'ont pas de sens. C'est ce qui évite qu'un « Oui / Non » traîne un
 * minimum de 200 caractères hérité d'un ancien réglage — la Server Action les
 * neutralise de toute façon, mais l'admin ne doit pas avoir à le deviner.
 */
export function FormulaireQuestion({
  action,
  sections,
  question,
  reponsesRattachees = 0,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
  sections: { id: string; nom: string; actif: boolean }[]
  question?: QuestionAEditer
  /** Nombre de réponses déjà enregistrées pour cette question. */
  reponsesRattachees?: number
}) {
  const [etat, envoyer] = useActionState(action, ETAT_VIDE)
  const [type, setType] = useState<TypeQuestion>(question?.type ?? 'TEXTE_COURT')

  const unite = uniteDesBornes(type)

  return (
    <form action={envoyer} className="flex max-w-2xl flex-col gap-6">
      {etat.erreur && (
        <p role="alert" className="rounded-controle border border-rouge/40 bg-rouge/10 px-4 py-3 text-sm text-rouge">
          {etat.erreur}
        </p>
      )}

      {reponsesRattachees > 0 && (
        <p className="rounded-controle border border-bord bg-braise px-4 py-3 text-[13px] text-gris">
          {reponsesRattachees} réponse{reponsesRattachees > 1 ? 's' : ''} déjà
          enregistrée{reponsesRattachees > 1 ? 's' : ''} pour cette question. Les
          modifier ici ne change <strong className="text-creme">rien</strong> aux
          candidatures reçues : elles ont figé le libellé et le type au moment de
          l’envoi.
        </p>
      )}

      <div>
        <label htmlFor="sectionId" className="mb-1.5 block text-sm font-semibold text-creme">
          Section
        </label>
        <select
          id="sectionId"
          name="sectionId"
          defaultValue={question?.sectionId ?? sections[0]?.id}
          className="w-full rounded-controle border border-bord bg-nuit px-3.5 py-2.5 text-[15px] text-creme focus:border-soupe focus:outline-none"
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.nom}
              {section.actif ? '' : ' (inactive)'}
            </option>
          ))}
        </select>
        {etat.champs?.sectionId && (
          <p className="mt-1.5 text-[13px] text-rouge">{etat.champs.sectionId[0]}</p>
        )}
      </div>

      <ChampZoneTexte
        nom="libelle"
        label="Libellé"
        aide="La question telle que le candidat la lira."
        rows={2}
        maxLength={300}
        defaultValue={question?.libelle}
        erreurs={etat.champs?.libelle}
      />

      <ChampZoneTexte
        nom="aide"
        label="Texte d’aide (facultatif)"
        aide="Affiché sous le champ, en petit."
        rows={2}
        maxLength={300}
        defaultValue={question?.aide ?? ''}
        erreurs={etat.champs?.aide}
      />

      <div>
        <label htmlFor="type" className="mb-1.5 block text-sm font-semibold text-creme">
          Type de champ
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(evenement) => setType(evenement.target.value as TypeQuestion)}
          className="w-full rounded-controle border border-bord bg-nuit px-3.5 py-2.5 text-[15px] text-creme focus:border-soupe focus:outline-none"
        >
          {TYPES.map((valeur) => (
            <option key={valeur} value={valeur}>
              {libelleType(valeur)}
            </option>
          ))}
        </select>
      </div>

      {type === 'CHOIX_UNIQUE' && (
        <ChampZoneTexte
          nom="options"
          label="Options"
          aide="Une par ligne. Deux au minimum."
          rows={5}
          defaultValue={question?.options.join('\n') ?? ''}
          erreurs={etat.champs?.options}
        />
      )}

      {/* Les bornes ne s'affichent JAMAIS nues : leur unité dépend du type, et
          « Minimum » tout seul ne dit pas si on parle de caractères ou de
          valeur. Pas d'unité = pas de bornes à régler. */}
      {unite !== null && (
        <div className="grid gap-5 sm:grid-cols-2">
          <ChampTexte
            nom="minimum"
            label={`Minimum (${unite})`}
            type="number"
            min={0}
            aide="Vide = pas de minimum."
            defaultValue={question?.minimum ?? ''}
            erreurs={etat.champs?.minimum}
          />
          <ChampTexte
            nom="maximum"
            label={`Maximum (${unite})`}
            type="number"
            min={0}
            aide={
              unite === 'caractères'
                ? `Vide = plafond par défaut (${type === 'TEXTE_LONG' ? '5000' : '300'}).`
                : 'Vide = pas de maximum.'
            }
            defaultValue={question?.maximum ?? ''}
            erreurs={etat.champs?.maximum}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <ChampCase
          nom="obligatoire"
          label="Réponse obligatoire"
          defaultChecked={question?.obligatoire ?? true}
        />
        <ChampCase
          nom="actif"
          label="Affichée dans le formulaire"
          defaultChecked={question?.actif ?? true}
        />
      </div>

      <div className="flex items-center gap-3">
        <BoutonSoumettre>
          {question ? 'Enregistrer' : 'Créer la question'}
        </BoutonSoumettre>
      </div>
    </form>
  )
}
