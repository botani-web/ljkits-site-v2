import Link from 'next/link'
import { notFound } from 'next/navigation'

import { modifierPack } from '@/actions/packs'
import { FormulairePack } from '@/components/admin/FormulairePack'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Modifier un pack' }

export default async function PageModifierPack({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [pack, kits] = await Promise.all([
    prisma.pack.findUnique({
      where: { id },
      include: { kits: { select: { id: true } } },
    }),
    prisma.kit.findMany({
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
      select: { id: true, nom: true, slug: true, prixEurosCentimes: true },
    }),
  ])

  if (!pack) notFound()

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/packs"
          className="-my-3.5 inline-flex min-h-11 items-center text-[13px] text-gris transition-colors hover:text-creme"
        >
          ← Retour aux packs
        </Link>
        <h1 className="mt-2 font-titre text-2xl uppercase">Modifier « {pack.nom} »</h1>
      </div>

      <FormulairePack
        action={modifierPack.bind(null, pack.id)}
        kitsDisponibles={kits}
        pack={{
          slug: pack.slug,
          nom: pack.nom,
          description: pack.description,
          prixEurosCentimes: pack.prixEurosCentimes,
          prixBarreCentimes: pack.prixBarreCentimes,
          visible: pack.visible,
          achetable: pack.achetable,
          tebexPackageId: pack.tebexPackageId,
          kitIds: pack.kits.map((kit) => kit.id),
        }}
        libelleBouton="Enregistrer les modifications"
      />
    </>
  )
}
