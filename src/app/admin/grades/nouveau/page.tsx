import Link from 'next/link'

import { creerGrade } from '@/actions/grades'
import { FormulaireGrade } from '@/components/admin/FormulaireGrade'

export const metadata = { title: 'Nouveau grade' }

export default function PageNouveauGrade() {
  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/grades"
          className="-my-3.5 inline-flex min-h-11 items-center text-[13px] text-gris transition-colors hover:text-creme"
        >
          ← Retour aux grades
        </Link>
        <h1 className="mt-2 font-titre text-2xl uppercase">Nouveau grade</h1>
        <p className="mt-1 text-sm text-gris">
          Il sera ajouté en fin de liste ; les flèches du tableau de bord servent ensuite à le
          placer.
        </p>
      </div>

      <FormulaireGrade action={creerGrade} libelleBouton="Créer le grade" />
    </>
  )
}
