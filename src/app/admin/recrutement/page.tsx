import Link from 'next/link'
import type { Prisma, StatutCandidature } from '@prisma/client'

import { creerSectionRecrutement } from '@/actions/recrutement'
import { AlerteBudget } from '@/components/admin/AlerteBudget'
import { BoutonCopier } from '@/components/admin/BoutonCopier'
import { FormulaireSectionRecrutement } from '@/components/admin/FormulaireSectionRecrutement'
import { InterrupteurRecrutement } from '@/components/admin/InterrupteurRecrutement'
import { ListeQuestions } from '@/components/admin/ListeQuestions'
import { FormulaireCandidature } from '@/components/public/FormulaireCandidature'
import { estimerBudget } from '@/lib/discord'
import { formaterDateHeure } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { lireQuestionsActives } from '@/lib/recrutement'
import { LIEN_FORMULAIRE } from '@/lib/recrutement-partage'
import { lireReglages } from '@/lib/reglages'
import { classesBouton } from '@/components/ui/Bouton'

export const metadata = { title: 'Recrutement' }

type Filtre = 'toutes' | 'attente' | 'acceptees' | 'refusees' | 'corbeille'

const FILTRES: { cle: Filtre; label: string }[] = [
  { cle: 'toutes', label: 'Toutes' },
  { cle: 'attente', label: 'En attente' },
  { cle: 'acceptees', label: 'Acceptées' },
  { cle: 'refusees', label: 'Refusées' },
  { cle: 'corbeille', label: 'Corbeille' },
]

/**
 * Traduit un filtre en clause Prisma.
 *
 * `supprimeeAt: null` PARTOUT sauf sur la corbeille : une candidature mise à
 * la corbeille disparaît de toutes les autres vues, sans quoi la corbeille ne
 * servirait à rien.
 */
function clauseDuFiltre(filtre: Filtre): Prisma.CandidatureWhereInput {
  if (filtre === 'corbeille') return { supprimeeAt: { not: null } }

  const statuts: Partial<Record<Filtre, StatutCandidature>> = {
    attente: 'EN_ATTENTE',
    acceptees: 'ACCEPTEE',
    refusees: 'REFUSEE',
  }

  const statut = statuts[filtre]
  return { supprimeeAt: null, ...(statut ? { statut } : {}) }
}

const COULEUR_STATUT: Record<StatutCandidature, string> = {
  EN_ATTENTE: 'border-or/50 bg-or/10 text-or',
  ACCEPTEE: 'border-vert/50 bg-vert/10 text-vert',
  REFUSEE: 'border-rouge/50 bg-rouge/10 text-rouge',
}

const LIBELLE_STATUT: Record<StatutCandidature, string> = {
  EN_ATTENTE: 'En attente',
  ACCEPTEE: 'Acceptée',
  REFUSEE: 'Refusée',
}

export default async function PageRecrutementAdmin({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string; filtre?: string }>
}) {
  const params = await searchParams
  const onglet = params.onglet === 'questions' ? 'questions' : 'candidatures'
  const filtre = (FILTRES.find((f) => f.cle === params.filtre)?.cle ?? 'toutes') as Filtre

  const { recrutementOuvert } = await lireReglages()

  return (
    <>
      <div className="mb-6">
        <h1 className="font-titre text-2xl">Recrutement staff</h1>
        <p className="mt-1 text-sm text-gris">
          Un formulaire accessible par lien direct uniquement. Il n’apparaît nulle part
          sur le site.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <InterrupteurRecrutement ouvert={recrutementOuvert} />

        {/* Le lien ne se trouve QUE d'ici. */}
        <div className="flex flex-wrap items-center gap-3 rounded-carte border border-bord bg-charbon px-5 py-4">
          <div className="min-w-[200px] flex-1">
            <p className="font-mono text-[10.5px] tracking-[1.4px] text-gris uppercase">
              Lien à partager
            </p>
            <p className="mt-1 font-mono text-[13px] break-all text-creme">
              {LIEN_FORMULAIRE}
            </p>
          </div>
          <BoutonCopier texte={LIEN_FORMULAIRE} libelle="Copier le lien" />
        </div>
      </div>

      {/* --- onglets --- */}
      <nav className="mb-6 flex gap-1 border-b border-bord">
        {(
          [
            { cle: 'candidatures', label: 'Candidatures' },
            { cle: 'questions', label: 'Questions' },
          ] as const
        ).map((entree) => (
          <Link
            key={entree.cle}
            href={`/admin/recrutement?onglet=${entree.cle}`}
            aria-current={onglet === entree.cle ? 'page' : undefined}
            className={`-mb-px flex min-h-11 items-center border-b-2 px-4 text-sm font-semibold transition-colors ${
              onglet === entree.cle
                ? 'border-soupe text-soupe'
                : 'border-transparent text-gris hover:text-creme'
            }`}
          >
            {entree.label}
          </Link>
        ))}
      </nav>

      {onglet === 'candidatures' ? (
        <OngletCandidatures filtre={filtre} />
      ) : (
        <OngletQuestions />
      )}
    </>
  )
}

/* ========================================================================== */
/* Onglet Candidatures                                                        */
/* ========================================================================== */

async function OngletCandidatures({ filtre }: { filtre: Filtre }) {
  const candidatures = await prisma.candidature.findMany({
    where: clauseDuFiltre(filtre),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      numero: true,
      pseudoMinecraft: true,
      pseudoDiscord: true,
      age: true,
      statut: true,
      createdAt: true,
      supprimeeAt: true,
      webhookEnvoyeAt: true,
      webhookErreur: true,
    },
  })

  // Les compteurs des onglets se lisent en une passe plutôt qu'en cinq.
  const parStatut = await prisma.candidature.groupBy({
    by: ['statut'],
    where: { supprimeeAt: null },
    _count: true,
  })
  const corbeille = await prisma.candidature.count({ where: { supprimeeAt: { not: null } } })

  const compte = (cle: Filtre): number => {
    if (cle === 'corbeille') return corbeille
    if (cle === 'toutes') return parStatut.reduce((total, ligne) => total + ligne._count, 0)
    const statut = { attente: 'EN_ATTENTE', acceptees: 'ACCEPTEE', refusees: 'REFUSEE' }[
      cle as 'attente' | 'acceptees' | 'refusees'
    ]
    return parStatut.find((ligne) => ligne.statut === statut)?._count ?? 0
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTRES.map((entree) => (
          <Link
            key={entree.cle}
            href={`/admin/recrutement?onglet=candidatures&filtre=${entree.cle}`}
            className={`inline-flex min-h-11 items-center rounded-controle border px-3 text-[13px] font-semibold transition-colors sm:min-h-0 sm:py-1.5 ${
              filtre === entree.cle
                ? 'border-soupe bg-soupe/10 text-soupe'
                : 'border-bord text-gris hover:text-creme'
            }`}
          >
            {entree.label}
            <span className="ml-2 font-mono text-[11.5px] opacity-70">{compte(entree.cle)}</span>
          </Link>
        ))}
      </div>

      {candidatures.length === 0 ? (
        <p className="rounded-carte border border-bord bg-charbon px-6 py-12 text-center text-gris">
          Aucune candidature ici.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {candidatures.map((candidature) => (
            <Link
              key={candidature.id}
              href={`/admin/recrutement/${candidature.id}`}
              className="flex flex-wrap items-center gap-4 rounded-carte border border-bord bg-charbon px-4 py-3.5 transition-colors hover:border-soupe/50"
            >
              <span className="font-mono text-[12.5px] text-gris">
                #{String(candidature.numero).padStart(6, '0')}
              </span>

              <div className="min-w-[180px] flex-1">
                <p className="font-mono text-[15px] font-bold text-creme">
                  {candidature.pseudoMinecraft}
                </p>
                <p className="mt-0.5 text-[13px] text-gris">
                  {candidature.pseudoDiscord} · {candidature.age} ans ·{' '}
                  {formaterDateHeure(candidature.createdAt)}
                </p>
              </div>

              {candidature.supprimeeAt && (
                <span className="rounded-micro border border-bord px-2 py-0.5 font-mono text-[10.5px] font-bold tracking-wide text-gris uppercase">
                  Corbeille
                </span>
              )}

              {/* Une candidature en base mais pas partie sur Discord doit se
                  voir depuis la liste : c'est là qu'on la cherche. */}
              {!candidature.webhookEnvoyeAt && candidature.webhookErreur && (
                <span
                  title={candidature.webhookErreur}
                  className="rounded-micro border border-rouge/50 bg-rouge/10 px-2 py-0.5 font-mono text-[10.5px] font-bold tracking-wide text-rouge uppercase"
                >
                  Discord ✕
                </span>
              )}

              <span
                className={`rounded-micro border px-2 py-0.5 font-mono text-[10.5px] font-bold tracking-wide uppercase ${
                  COULEUR_STATUT[candidature.statut]
                }`}
              >
                {LIBELLE_STATUT[candidature.statut]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

/* ========================================================================== */
/* Onglet Questions                                                           */
/* ========================================================================== */

async function OngletQuestions() {
  const sections = await prisma.sectionRecrutement.findMany({
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    include: {
      questions: {
        orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
        include: { _count: { select: { reponses: true } } },
      },
    },
  })

  // L'aperçu et le budget se calculent sur les questions ACTIVES : c'est ce que
  // le candidat verra et ce qui partira sur Discord.
  const actives = await lireQuestionsActives()
  const budget = estimerBudget(actives)

  const pourListe = sections.map((section) => ({
    id: section.id,
    nom: section.nom,
    actif: section.actif,
    questions: section.questions.map((question) => ({
      id: question.id,
      libelle: question.libelle,
      type: question.type,
      obligatoire: question.obligatoire,
      actif: question.actif,
      minimum: question.minimum,
      maximum: question.maximum,
      reponses: question._count.reponses,
    })),
  }))

  return (
    <div className="flex flex-col gap-6">
      <AlerteBudget budget={budget} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gris">
          {actives.length} question{actives.length > 1 ? 's' : ''} active
          {actives.length > 1 ? 's' : ''} sur {sections.reduce((n, s) => n + s.questions.length, 0)}.
        </p>
        <Link
          href="/admin/recrutement/questions/nouvelle"
          className={classesBouton({ variante: 'plein' })}
        >
          + Nouvelle question
        </Link>
      </div>

      <ListeQuestions sections={pourListe} />

      <FormulaireSectionRecrutement action={creerSectionRecrutement} />

      {/* L'aperçu rend LE VRAI composant public, pas une maquette : c'est la
          seule façon qu'il ne mente jamais sur ce que le candidat verra. */}
      <section>
        <h2 className="mb-3 font-titre text-lg text-creme">
          Aperçu du formulaire
        </h2>
        {actives.length === 0 ? (
          <p className="rounded-carte border border-bord bg-charbon px-6 py-12 text-center text-gris">
            Aucune question active : le formulaire afficherait un message
            d’indisponibilité.
          </p>
        ) : (
          <div className="rounded-carte border border-bord bg-nuit p-6">
            <FormulaireCandidature questions={actives} apercu />
          </div>
        )}
      </section>
    </div>
  )
}
