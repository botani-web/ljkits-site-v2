import Link from 'next/link'
import { notFound } from 'next/navigation'

import { modifierQuestion } from '@/actions/recrutement'
import { FormulaireQuestion } from '@/components/admin/FormulaireQuestion'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Modifier une question' }

export default async function PageQuestion({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [question, sections] = await Promise.all([
    prisma.questionRecrutement.findUnique({
      where: { id },
      include: { _count: { select: { reponses: true } } },
    }),
    prisma.sectionRecrutement.findMany({
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
      select: { id: true, nom: true, actif: true },
    }),
  ])

  if (!question) notFound()

  return (
    <>
      <Link
        href="/admin/recrutement?onglet=questions"
        className="mb-6 inline-flex min-h-11 items-center text-sm text-gris transition-colors hover:text-creme"
      >
        ← Le questionnaire
      </Link>

      <h1 className="mb-6 font-titre text-2xl uppercase">Modifier la question</h1>

      <FormulaireQuestion
        action={modifierQuestion.bind(null, question.id)}
        sections={sections}
        question={{
          id: question.id,
          sectionId: question.sectionId,
          libelle: question.libelle,
          aide: question.aide,
          type: question.type,
          options: question.options,
          obligatoire: question.obligatoire,
          minimum: question.minimum,
          maximum: question.maximum,
          actif: question.actif,
        }}
        reponsesRattachees={question._count.reponses}
      />
    </>
  )
}
