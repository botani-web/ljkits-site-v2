import Link from 'next/link'
import { notFound } from 'next/navigation'

import { modifierKit } from '@/actions/kits'
import { FormulaireKit } from '@/components/admin/FormulaireKit'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Modifier un kit' }

export default async function PageModifierKit({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const kit = await prisma.kit.findUnique({
    where: { id },
    include: { caracteristiques: { orderBy: { ordre: 'asc' } } },
  })

  if (!kit) notFound()

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/kits"
          className="text-[13px] text-gris transition-colors hover:text-creme"
        >
          ← Retour aux kits
        </Link>
        <h1 className="mt-2 font-titre text-2xl uppercase">Modifier « {kit.nom} »</h1>
        <p className="mt-1 text-sm text-gris">
          Page publique :{' '}
          <Link
            href={`/kits/${kit.slug}`}
            className="text-or underline underline-offset-2"
            target="_blank"
          >
            /kits/{kit.slug} ↗
          </Link>
        </p>
      </div>

      {/*
        L'id est pré-lié à l'action : le formulaire n'a pas à le transporter
        dans un champ caché que quelqu'un pourrait modifier.
      */}
      <FormulaireKit
        action={modifierKit.bind(null, kit.id)}
        kit={{
          slug: kit.slug,
          nom: kit.nom,
          kanji: kit.kanji,
          role: kit.role,
          descriptionCourte: kit.descriptionCourte,
          descriptionLongue: kit.descriptionLongue,
          prixCoins: kit.prixCoins,
          prixEurosCentimes: kit.prixEurosCentimes,
          type: kit.type,
          visible: kit.visible,
          achetable: kit.achetable,
          bientot: kit.bientot,
          kitDeDepart: kit.kitDeDepart,
          commandeLivraison: kit.commandeLivraison,
          caracteristiques: kit.caracteristiques.map((carac) => ({
            libelle: carac.libelle,
            valeur: carac.valeur,
          })),
        }}
        libelleBouton="Enregistrer les modifications"
      />
    </>
  )
}
