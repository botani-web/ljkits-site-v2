import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { StatutCandidature, TypeQuestion } from '@prisma/client'

import {
  changerStatutCandidature,
  enregistrerNote,
  mettreALaCorbeille,
  renvoyerSurDiscord,
  restaurerCandidature,
  supprimerDefinitivement,
} from '@/actions/recrutement'
import { BoutonFormulaire } from '@/components/admin/BoutonsAction'
import { FormulaireNote } from '@/components/admin/FormulaireNote'
import { SuppressionDefinitive } from '@/components/admin/SuppressionDefinitive'
import { formaterDate, formaterDateHeure } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { CARENCE_JOURS, afficherValeur } from '@/lib/recrutement-partage'

export const metadata = { title: 'Candidature' }

const LIBELLE_STATUT: Record<StatutCandidature, string> = {
  EN_ATTENTE: 'En attente',
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée',
}

/** Regroupe les réponses par section FIGÉE, dans l'ordre FIGÉ. */
function parSectionFigee(
  reponses: {
    id: string
    libelleFige: string
    typeFige: TypeQuestion
    sectionFigee: string
    ordreFige: number
    valeur: string
    questionId: string | null
  }[],
) {
  const blocs: { nom: string; reponses: typeof reponses }[] = []

  for (const reponse of reponses) {
    const dernier = blocs.at(-1)
    if (dernier?.nom === reponse.sectionFigee) dernier.reponses.push(reponse)
    else blocs.push({ nom: reponse.sectionFigee, reponses: [reponse] })
  }

  return blocs
}

export default async function FicheCandidature({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const candidature = await prisma.candidature.findUnique({
    where: { id },
    include: {
      /**
       * ⚠ L'AFFICHAGE NE RELIT JAMAIS `QuestionRecrutement`.
       *
       * Tout ce qui est nécessaire est figé dans la réponse : le libellé, le
       * type, la section et le rang tels qu'ils étaient à l'envoi. C'est ce qui
       * rend cette fiche insensible à tout ce qui a pu arriver au questionnaire
       * depuis — renommage, changement de type, réordonnancement, suppression.
       * `questionId` ne sert qu'à signaler une question disparue.
       */
      reponses: { orderBy: { ordreFige: 'asc' } },
    },
  })

  if (!candidature) notFound()

  const blocs = parSectionFigee(candidature.reponses)

  // Le nombre de questions actives aujourd'hui, pour signaler l'écart. Un
  // simple compte : on ne cherche pas à deviner lesquelles ont été ajoutées.
  const questionsAujourdHui = await prisma.questionRecrutement.count({
    where: { actif: true, section: { actif: true } },
  })
  const ajoutees = questionsAujourdHui - candidature.reponses.length

  const finDeCarence =
    candidature.statut === 'REFUSEE' && candidature.decideeAt
      ? new Date(candidature.decideeAt.getTime() + CARENCE_JOURS * 24 * 60 * 60 * 1_000)
      : null

  return (
    <>
      <Link
        href="/admin/recrutement"
        className="mb-6 inline-flex min-h-11 items-center text-sm text-gris transition-colors hover:text-creme"
      >
        ← Toutes les candidatures
      </Link>

      {candidature.supprimeeAt && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-carte border border-bord bg-braise px-5 py-4">
          <p className="min-w-[200px] flex-1 text-[14px] text-gris">
            Cette candidature est à la corbeille depuis le{' '}
            {formaterDate(candidature.supprimeeAt)}. Elle continue de compter pour le
            délai de carence.
          </p>
          <BoutonFormulaire action={restaurerCandidature.bind(null, candidature.id)}>
            Restaurer
          </BoutonFormulaire>
        </div>
      )}

      {/* --- identité : les trois champs système --------------------------- */}
      <header className="mb-6 rounded-carte border border-bord bg-charbon p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[12.5px] text-gris">
              #{String(candidature.numero).padStart(6, '0')} ·{' '}
              {formaterDateHeure(candidature.createdAt)}
            </p>
            <h1 className="mt-1 font-mono text-2xl font-bold text-creme">
              {candidature.pseudoMinecraft}
            </h1>
            <p className="mt-1 text-[15px] text-gris">
              Discord : <span className="font-mono text-creme">{candidature.pseudoDiscord}</span>{' '}
              · {candidature.age} ans
            </p>
          </div>

          <div className="text-right">
            <p className="font-mono text-[10.5px] tracking-[1.4px] text-gris uppercase">
              Statut
            </p>
            <p className="mt-1 text-[15px] font-bold text-creme">
              {LIBELLE_STATUT[candidature.statut]}
            </p>
            {finDeCarence && (
              <p className="mt-1 text-[13px] text-gris">
                Peut repostuler le {formaterDate(finDeCarence)}
              </p>
            )}
          </div>
        </div>

        {/* --- changement de statut --- */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-bord pt-4">
          {(['ACCEPTEE', 'REFUSEE', 'EN_ATTENTE'] as const).map((statut) => (
            <BoutonFormulaire
              key={statut}
              action={changerStatutCandidature.bind(null, candidature.id, statut)}
              variante={
                statut === 'ACCEPTEE' ? 'principal' : statut === 'REFUSEE' ? 'danger' : 'neutre'
              }
            >
              {statut === 'EN_ATTENTE' ? 'Remettre en attente' : LIBELLE_STATUT[statut]}
            </BoutonFormulaire>
          ))}
        </div>
      </header>

      {/* --- état Discord --------------------------------------------------- */}
      <section className="mb-6 flex flex-wrap items-center gap-4 rounded-carte border border-bord bg-charbon px-5 py-4">
        <div className="min-w-[220px] flex-1">
          <p className="font-mono text-[10.5px] tracking-[1.4px] text-gris uppercase">
            Discord
          </p>
          {candidature.webhookEnvoyeAt ? (
            <p className="mt-1 text-[14px] text-vert">
              Transmis le {formaterDateHeure(candidature.webhookEnvoyeAt)}.
            </p>
          ) : (
            <>
              <p className="mt-1 text-[14px] text-rouge">Non transmis au salon Discord.</p>
              {candidature.webhookErreur && (
                <p className="mt-1 font-mono text-[12px] break-words text-gris">
                  {candidature.webhookErreur}
                </p>
              )}
            </>
          )}
        </div>
        <BoutonFormulaire action={renvoyerSurDiscord.bind(null, candidature.id)}>
          {candidature.webhookEnvoyeAt ? 'Renvoyer' : 'Réessayer'}
        </BoutonFormulaire>
      </section>

      {/* --- les réponses, telles qu'envoyées -------------------------------- */}
      {blocs.map((bloc) => (
        <section key={bloc.nom} className="mb-6">
          <h2 className="mb-3 font-titre text-lg text-creme">{bloc.nom}</h2>

          <div className="flex flex-col gap-3">
            {bloc.reponses.map((reponse) => {
              const vide = reponse.valeur.trim() === ''

              return (
                <article
                  key={reponse.id}
                  className="rounded-carte border border-bord bg-charbon p-4"
                >
                  <h3 className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-gris">
                    {reponse.libelleFige}
                    {/* Le libellé reste lisible même si la question a disparu :
                        c'est tout l'intérêt de la photographie. */}
                    {reponse.questionId === null && (
                      <span
                        title="La question a été supprimée depuis. La réponse reste intacte."
                        className="rounded-micro border border-bord px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-gris uppercase"
                      >
                        question supprimée
                      </span>
                    )}
                  </h3>

                  <p
                    className={`mt-2 text-[15px] whitespace-pre-wrap ${
                      vide ? 'text-gris/60 italic' : 'text-creme'
                    }`}
                  >
                    {afficherValeur(reponse.valeur, reponse.typeFige)}
                  </p>
                </article>
              )
            })}
          </div>
        </section>
      ))}

      {/* Une candidature ancienne n'a pas répondu aux questions ajoutées
          depuis. On le dit, plutôt que de laisser croire à un oubli. */}
      {ajoutees > 0 && (
        <p className="mb-6 rounded-controle border border-bord bg-braise px-4 py-3 text-[13px] text-gris">
          Le questionnaire compte {ajoutees} question{ajoutees > 1 ? 's' : ''} de plus
          aujourd’hui qu’au moment de cet envoi. Ce candidat ne pouvait pas y répondre.
        </p>
      )}

      {/* --- note interne ---------------------------------------------------- */}
      <section className="mb-6">
        <h2 className="mb-3 font-titre text-lg text-creme">Note interne</h2>
        <FormulaireNote
          action={enregistrerNote.bind(null, candidature.id)}
          note={candidature.noteAdmin}
        />
      </section>

      {/* --- consentement et suppression -------------------------------------- */}
      <section className="rounded-carte border border-bord bg-charbon p-5">
        <h2 className="font-mono text-[10.5px] tracking-[1.4px] text-gris uppercase">
          Consentement et conservation
        </h2>
        <p className="mt-2 text-[13px] text-gris">
          Recueilli le {formaterDateHeure(candidature.consentementAt)}, dans ces termes :
        </p>
        <p className="mt-2 border-l-2 border-bord pl-3 text-[13px] text-creme italic">
          {candidature.consentementTexte}
        </p>

        <div className="mt-5 flex flex-wrap items-start gap-3 border-t border-bord pt-4">
          {!candidature.supprimeeAt && (
            <BoutonFormulaire
              action={mettreALaCorbeille.bind(null, candidature.id)}
              variante="danger"
            >
              Mettre à la corbeille
            </BoutonFormulaire>
          )}

          <SuppressionDefinitive
            action={supprimerDefinitivement.bind(null, candidature.id)}
            pseudoMinecraft={candidature.pseudoMinecraft}
            reponses={candidature.reponses.length}
            consentementAt={formaterDate(candidature.consentementAt)}
          />
        </div>
      </section>
    </>
  )
}
