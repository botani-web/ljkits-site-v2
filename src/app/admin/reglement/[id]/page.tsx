import Link from 'next/link'
import { notFound } from 'next/navigation'

import { modifierSection } from '@/actions/reglement'
import { FormulaireSection } from '@/components/admin/FormulaireSection'
import { formaterDate } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { lireReglages } from '@/lib/reglages'

export const metadata = { title: 'Modifier une section' }

export default async function PageModifierSection({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const section = await prisma.sectionReglement.findUnique({ where: { id } })
  if (!section) notFound()

  const { discord } = await lireReglages()

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/reglement"
          className="-my-3.5 inline-flex min-h-11 items-center text-[13px] text-gris transition-colors hover:text-creme"
        >
          ← Retour au règlement
        </Link>
        <h1 className="mt-2 font-titre text-2xl uppercase">Modifier « {section.titre} »</h1>
        <p className="mt-1 text-sm text-gris">
          {section.publie ? 'Publiée' : 'Brouillon'} · dernière modification le{' '}
          {formaterDate(section.updatedAt)}
        </p>
      </div>

      <FormulaireSection
        action={modifierSection.bind(null, section.id)}
        section={{
          titre: section.titre,
          contenu: section.contenu,
          publie: section.publie,
        }}
        libelleBouton="Enregistrer les modifications"
        discord={discord}
      />
    </>
  )
}
