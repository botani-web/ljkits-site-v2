import Link from 'next/link'

import { creerKit } from '@/actions/kits'
import { FormulaireKit } from '@/components/admin/FormulaireKit'
import { lireReglages } from '@/lib/reglages'

export const metadata = { title: 'Nouveau kit' }

export default async function PageNouveauKit() {
  const { discord } = await lireReglages()

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/kits"
          className="-my-3.5 inline-flex min-h-11 items-center text-[13px] text-gris transition-colors hover:text-creme"
        >
          ← Retour aux kits
        </Link>
        <h1 className="mt-2 font-titre text-2xl">Nouveau kit</h1>
        <p className="mt-1 text-sm text-gris">
          Il sera ajouté en fin de liste ; les flèches du tableau de bord servent ensuite à
          le placer.
        </p>
      </div>

      <FormulaireKit action={creerKit} libelleBouton="Créer le kit" discord={discord} />
    </>
  )
}
