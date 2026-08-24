import Link from 'next/link'

import { creerSection } from '@/actions/reglement'
import { FormulaireSection } from '@/components/admin/FormulaireSection'
import { lireReglages } from '@/lib/reglages'

export const metadata = { title: 'Nouvelle section' }

export default async function PageNouvelleSection() {
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
        <h1 className="mt-2 font-titre text-2xl uppercase">Nouvelle section</h1>
        <p className="mt-1 text-sm text-gris">
          Elle sera ajoutée en fin de règlement ; les flèches servent ensuite à la placer.
        </p>
      </div>

      <FormulaireSection action={creerSection} libelleBouton="Créer la section" discord={discord} />
    </>
  )
}
