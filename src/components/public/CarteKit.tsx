import Link from 'next/link'

import { formaterCoins, formaterEuros } from '@/lib/format'

/**
 * Les champs d'un kit nécessaires à l'affichage d'une carte.
 * Type explicite plutôt que dérivé de Prisma : ces données transitent vers un
 * composant client, autant que la frontière soit lisible.
 */
export type KitEnCarte = {
  slug: string
  nom: string
  kanji: string | null
  role: string
  descriptionCourte: string
  prixCoins: number
  prixEurosCentimes: number | null
  type: 'GRATUIT' | 'EXCLUSIF'
  bientot: boolean
  kitDeDepart: boolean
  caracteristiques: { libelle: string; valeur: string }[]
}

export function CarteKit({ kit }: { kit: KitEnCarte }) {
  const exclusif = kit.type === 'EXCLUSIF'

  return (
    <Link
      href={`/kits/${kit.slug}`}
      className={`flex flex-col rounded-xl border p-5 transition-all hover:-translate-y-[3px] hover:border-[#3d2f5c] ${
        exclusif
          ? 'border-[#3a2a55] bg-linear-[168deg] from-[#1d1233] to-charbon'
          : 'border-bord bg-charbon'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <h2
            className={`font-titre text-[19px] leading-[1.15] uppercase ${
              exclusif ? 'text-violet' : 'text-white'
            }`}
          >
            {kit.nom}
          </h2>
          <div
            className={`mt-1.5 font-mono text-[10.5px] tracking-[1.4px] uppercase ${
              exclusif ? 'text-violet' : 'text-oni'
            }`}
          >
            {kit.role}
          </div>
        </div>
        {kit.kanji && (
          <div className="shrink-0 font-mono text-[15px] text-bord" aria-hidden="true">
            {kit.kanji}
          </div>
        )}
      </div>

      <p className="my-3 grow text-sm text-gris">{kit.descriptionCourte}</p>

      {kit.caracteristiques.length > 0 && (
        <dl className="mb-3.5 flex flex-col gap-1.5 rounded-lg border border-bord bg-nuit px-3.5 py-3">
          {kit.caracteristiques.map((carac, index) => (
            <div key={index} className="flex justify-between gap-2.5">
              <dt className="shrink-0 font-mono text-[10.5px] tracking-[1px] text-gris uppercase">
                {carac.libelle}
              </dt>
              <dd className="text-right font-mono text-xs text-[#d8d2e2]">{carac.valeur}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex items-center justify-between gap-2.5 border-t border-bord pt-3">
        <PrixKit prixCoins={kit.prixCoins} />

        <div className="flex flex-wrap justify-end gap-1.5">
          {kit.bientot && <Badge variante="bientot">Bientôt</Badge>}
          {kit.kitDeDepart && <Badge variante="depart">Kit de départ</Badge>}
          {kit.prixEurosCentimes !== null && (
            <Badge variante="euro">ou {formaterEuros(kit.prixEurosCentimes)}</Badge>
          )}
        </div>
      </div>
    </Link>
  )
}

/** Le prix en coins, ou « Gratuit » en vert quand il vaut zéro. */
export function PrixKit({
  prixCoins,
  taille = 'carte',
}: {
  prixCoins: number
  taille?: 'carte' | 'detail'
}) {
  const classeTaille = taille === 'detail' ? 'text-2xl' : 'text-[17px]'

  if (prixCoins === 0) {
    return <span className={`font-titre text-vert ${classeTaille}`}>Gratuit</span>
  }

  return (
    <span className={`font-titre text-or ${classeTaille}`}>
      {formaterCoins(prixCoins)}
      <small className="ml-1 font-corps text-[11px] font-normal text-gris">coins</small>
    </span>
  )
}

/** Les pastilles du pied de carte : « ou 4 € », « Kit de départ », « Bientôt ». */
export function Badge({
  variante,
  children,
}: {
  variante: 'euro' | 'depart' | 'bientot'
  children: React.ReactNode
}) {
  const styles = {
    euro: 'border-[#3a2a55] bg-violet/13 text-violet',
    depart: 'border-[#28442c] bg-vert/11 text-vert',
    bientot: 'border-soupe/35 bg-soupe/11 text-soupe',
  }[variante]

  return (
    <span
      className={`rounded border px-2.5 py-1 font-mono text-[10px] font-bold tracking-[1.2px] uppercase ${styles}`}
    >
      {children}
    </span>
  )
}
