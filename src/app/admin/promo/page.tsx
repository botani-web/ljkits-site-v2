import { FormulairePromo } from '@/components/admin/FormulairePromo'
import { lireReglages } from '@/lib/reglages'

export const metadata = { title: 'Promo' }
export const dynamic = 'force-dynamic'

/** La promo de la boutique (16/10/2026) : affichage seulement, la réduction réelle est faite par Tebex. */
export default async function PagePromo() {
  const { promo } = await lireReglages()
  return (
    <>
      <div className="mb-6">
        <h1 className="font-titre text-2xl">Promo de la boutique</h1>
        <p className="mt-1 text-sm text-gris">
          Une bulle à côté de « Boutique » dans la barre, un bandeau en haut de la boutique, et les prix barrés.
        </p>
      </div>
      <FormulairePromo promo={promo} />
    </>
  )
}
