import Link from 'next/link'

import { creerQuestion } from '@/actions/recrutement'
import { FormulaireQuestion } from '@/components/admin/FormulaireQuestion'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Nouvelle question' }

export default async function PageNouvelleQuestion() {
  const sections = await prisma.sectionRecrutement.findMany({
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    select: { id: true, nom: true, actif: true },
  })

  return (
    <>
      <Link
        href="/admin/recrutement?onglet=questions"
        className="mb-6 inline-flex min-h-11 items-center text-sm text-gris transition-colors hover:text-creme"
      >
        ← Le questionnaire
      </Link>

      <h1 className="mb-6 font-titre text-2xl uppercase">Nouvelle question</h1>

      {sections.length === 0 ? (
        <p className="rounded-2xl border border-bord bg-charbon px-6 py-12 text-center text-gris">
          Crée d’abord une section : une question doit vivre quelque part.
        </p>
      ) : (
        <FormulaireQuestion action={creerQuestion} sections={sections} />
      )}
    </>
  )
}
