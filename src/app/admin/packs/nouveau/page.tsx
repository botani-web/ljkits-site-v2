import Link from 'next/link'

import { creerPack } from '@/actions/packs'
import { FormulairePack } from '@/components/admin/FormulairePack'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Nouveau pack' }

export default async function PageNouveauPack() {
  // Tous les kits, masqués compris : un pack peut contenir un kit pas encore
  // publié, c'est même le cas courant à la préparation d'une nouveauté.
  const kits = await prisma.kit.findMany({
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    select: { id: true, nom: true, slug: true, prixEurosCentimes: true },
  })

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/packs"
          className="-my-3.5 inline-flex min-h-11 items-center text-[13px] text-gris transition-colors hover:text-creme"
        >
          ← Retour aux packs
        </Link>
        <h1 className="mt-2 font-titre text-2xl uppercase">Nouveau pack</h1>
      </div>

      <FormulairePack
        action={creerPack}
        kitsDisponibles={kits}
        libelleBouton="Créer le pack"
      />
    </>
  )
}
