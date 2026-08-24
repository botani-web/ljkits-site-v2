import Link from 'next/link'
import { notFound } from 'next/navigation'

import { modifierGrade } from '@/actions/grades'
import { FormulaireGrade } from '@/components/admin/FormulaireGrade'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Modifier un grade' }

export default async function PageModifierGrade({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const grade = await prisma.grade.findUnique({
    where: { id },
    include: { avantages: { orderBy: { ordre: 'asc' } } },
  })

  if (!grade) notFound()

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/grades"
          className="-my-3.5 inline-flex min-h-11 items-center text-[13px] text-gris transition-colors hover:text-creme"
        >
          ← Retour aux grades
        </Link>
        <h1 className="mt-2 font-titre text-2xl uppercase">Modifier « {grade.nom} »</h1>
      </div>

      <FormulaireGrade
        action={modifierGrade.bind(null, grade.id)}
        grade={{
          slug: grade.slug,
          nom: grade.nom,
          kanji: grade.kanji,
          sousTitre: grade.sousTitre,
          etiquette: grade.etiquette,
          prixEurosCentimes: grade.prixEurosCentimes,
          visible: grade.visible,
          achetable: grade.achetable,
          heriteDuPrecedent: grade.heriteDuPrecedent,
          tebexPackageId: grade.tebexPackageId,
          avantages: grade.avantages.map((avantage) => avantage.texte),
        }}
        libelleBouton="Enregistrer les modifications"
      />
    </>
  )
}
