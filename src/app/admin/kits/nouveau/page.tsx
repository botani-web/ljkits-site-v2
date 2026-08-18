import Link from 'next/link'

import { creerKit } from '@/actions/kits'
import { FormulaireKit } from '@/components/admin/FormulaireKit'

export const metadata = { title: 'Nouveau kit' }

export default function PageNouveauKit() {
  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/kits"
          className="text-[13px] text-gris transition-colors hover:text-creme"
        >
          ← Retour aux kits
        </Link>
        <h1 className="mt-2 font-titre text-2xl uppercase">Nouveau kit</h1>
        <p className="mt-1 text-sm text-gris">
          Il sera ajouté en fin de liste ; les flèches du tableau de bord servent ensuite à
          le placer.
        </p>
      </div>

      <FormulaireKit action={creerKit} libelleBouton="Créer le kit" />
    </>
  )
}
