import Link from 'next/link'
import type { TypeQuestion } from '@prisma/client'

import {
  basculerQuestion,
  basculerSection,
  deplacerQuestion,
  deplacerSection,
  supprimerQuestion,
  supprimerSection,
} from '@/actions/recrutement'
import { BoutonBascule, BoutonOrdre, BoutonSupprimer } from '@/components/admin/BoutonsAction'
import { libelleType, uniteDesBornes } from '@/lib/recrutement-partage'

export type SectionAvecQuestions = {
  id: string
  nom: string
  actif: boolean
  questions: {
    id: string
    libelle: string
    type: TypeQuestion
    obligatoire: boolean
    actif: boolean
    minimum: number | null
    maximum: number | null
    /** Réponses déjà enregistrées : conditionne « supprimable » ou non. */
    reponses: number
  }[]
}

/** Résume les bornes d'une question, avec leur unité. Jamais un nombre nu. */
function resumerBornes(question: {
  type: TypeQuestion
  minimum: number | null
  maximum: number | null
}): string | null {
  const unite = uniteDesBornes(question.type)
  if (unite === null) return null

  const { minimum, maximum } = question
  if (minimum === null && maximum === null) return null
  if (minimum !== null && maximum !== null) return `${minimum} à ${maximum} ${unite}`
  if (minimum !== null) return `${minimum} ${unite} minimum`
  return `${maximum} ${unite} maximum`
}

export function ListeQuestions({ sections }: { sections: SectionAvecQuestions[] }) {
  if (sections.length === 0) {
    return (
      <p className="rounded-2xl border border-bord bg-charbon px-6 py-12 text-center text-gris">
        Aucune section. Crée-en une pour commencer le questionnaire.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section, indexSection) => (
        <section
          key={section.id}
          className={`rounded-xl border bg-charbon ${
            section.actif ? 'border-bord' : 'border-bord/50 opacity-60'
          }`}
        >
          {/* --- en-tête de section --- */}
          <header className="flex flex-wrap items-center gap-3 border-b border-bord px-4 py-3">
            <div className="flex flex-col gap-1">
              <BoutonOrdre
                action={deplacerSection.bind(null, section.id, 'haut')}
                direction="haut"
                desactive={indexSection === 0}
              />
              <BoutonOrdre
                action={deplacerSection.bind(null, section.id, 'bas')}
                direction="bas"
                desactive={indexSection === sections.length - 1}
              />
            </div>

            <div className="min-w-[160px] flex-1">
              <h3 className="font-titre text-[15px] text-creme uppercase">{section.nom}</h3>
              <p className="mt-0.5 text-[13px] text-gris">
                {section.questions.length} question
                {section.questions.length > 1 ? 's' : ''}
                {!section.actif && ' — section masquée'}
              </p>
            </div>

            <BoutonBascule
              action={basculerSection.bind(null, section.id)}
              actif={section.actif}
              label="Active"
              couleur="vert"
            />

            {/* Une section qui porte des questions est désactivée, pas
                supprimée : le libellé du bouton le dit à l'avance. */}
            <BoutonSupprimer
              action={supprimerSection.bind(null, section.id)}
              libelle={section.questions.length > 0 ? 'Désactiver' : 'Supprimer'}
            />
          </header>

          {/* --- questions de la section --- */}
          {section.questions.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-gris">
              Aucune question dans cette section.
            </p>
          ) : (
            <ul className="divide-y divide-bord">
              {section.questions.map((question, index) => {
                const bornes = resumerBornes(question)

                return (
                  <li
                    key={question.id}
                    className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
                      question.actif ? '' : 'opacity-55'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <BoutonOrdre
                        action={deplacerQuestion.bind(null, question.id, 'haut')}
                        direction="haut"
                        desactive={index === 0}
                      />
                      <BoutonOrdre
                        action={deplacerQuestion.bind(null, question.id, 'bas')}
                        direction="bas"
                        desactive={index === section.questions.length - 1}
                      />
                    </div>

                    <div className="min-w-[200px] flex-1">
                      <Link
                        href={`/admin/recrutement/questions/${question.id}`}
                        className="text-[15px] font-semibold text-creme transition-colors hover:text-soupe"
                      >
                        {question.libelle}
                      </Link>

                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11.5px] text-gris">
                        <span>{libelleType(question.type)}</span>
                        {question.obligatoire && <span className="text-soupe">obligatoire</span>}
                        {bornes && <span>{bornes}</span>}
                        {question.reponses > 0 && (
                          <span title="Des candidatures y ont répondu : la question ne peut plus être supprimée.">
                            {question.reponses} réponse{question.reponses > 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    </div>

                    <BoutonBascule
                      action={basculerQuestion.bind(null, question.id)}
                      actif={question.actif}
                      label="Active"
                      couleur="vert"
                    />

                    {/* Le libellé change selon ce qui va RÉELLEMENT se passer :
                        désactivation dès qu'une réponse existe, suppression
                        franche sinon. On ne promet jamais une suppression
                        qu'on ne fera pas. */}
                    <BoutonSupprimer
                      action={supprimerQuestion.bind(null, question.id)}
                      libelle={question.reponses > 0 ? 'Désactiver' : 'Supprimer'}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
