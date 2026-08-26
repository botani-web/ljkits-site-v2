import Link from 'next/link'

import { basculerPack, deplacerPack, supprimerPack } from '@/actions/packs'
import {
  BoutonBascule,
  BoutonOrdre,
  BoutonSupprimer,
} from '@/components/admin/BoutonsAction'
import { formaterEuros } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { classesBouton } from '@/components/ui/Bouton'

export const metadata = { title: 'Packs' }

export default async function TableauDeBordPacks() {
  const packs = await prisma.pack.findMany({
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    include: { _count: { select: { kits: true } } },
  })

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titre text-2xl">Les packs</h1>
          <p className="mt-1 text-sm text-gris">
            {packs.length} pack{packs.length > 1 ? 's' : ''}. Ils s’affichent sous les kits
            exclusifs, dans l’onglet Kits de la boutique.
          </p>
        </div>

        <Link
          href="/admin/packs/nouveau"
          className={classesBouton({ variante: 'plein' })}
        >
          + Nouveau pack
        </Link>
      </div>

      {packs.length === 0 ? (
        <p className="rounded-carte border border-bord bg-charbon px-6 py-12 text-center text-gris">
          Aucun pack pour l’instant.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {packs.map((pack, index) => (
            <article
              key={pack.id}
              className={`flex flex-wrap items-center gap-4 rounded-carte border bg-charbon px-4 py-3.5 ${
                pack.visible ? 'border-bord' : 'border-bord/50 opacity-60'
              }`}
            >
              <div className="flex flex-col gap-1">
                <BoutonOrdre
                  action={deplacerPack.bind(null, pack.id, 'haut')}
                  direction="haut"
                  desactive={index === 0}
                />
                <BoutonOrdre
                  action={deplacerPack.bind(null, pack.id, 'bas')}
                  direction="bas"
                  desactive={index === packs.length - 1}
                />
              </div>

              <div className="min-w-[200px] flex-1">
                <h2 className="font-titre text-[17px]">{pack.nom}</h2>
                <p className="font-mono text-[11px] tracking-wide text-gris">
                  {pack.slug} · {pack._count.kits} kit{pack._count.kits > 1 ? 's' : ''} inclus
                  {pack.achetable && pack.tebexPackageId === null && (
                    <span className="text-rouge"> · pas d’ID Tebex</span>
                  )}
                </p>
              </div>

              <div className="text-right">
                <div className="font-titre text-sm text-or">
                  {formaterEuros(pack.prixEurosCentimes)}
                </div>
                {pack.prixBarreCentimes !== null && (
                  <div className="font-mono text-[11px] text-gris line-through">
                    {formaterEuros(pack.prixBarreCentimes)}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <BoutonBascule
                  action={basculerPack.bind(null, pack.id, 'visible')}
                  actif={pack.visible}
                  label="Visible"
                  couleur="vert"
                />
                <BoutonBascule
                  action={basculerPack.bind(null, pack.id, 'achetable')}
                  actif={pack.achetable}
                  label="Achetable"
                  couleur="violet"
                />
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/packs/${pack.id}`}
                  className="inline-flex min-h-11 items-center rounded-controle border border-bord px-3 text-[13px] font-semibold text-gris transition-colors hover:border-soupe hover:text-soupe sm:min-h-0 sm:py-1.5"
                >
                  Modifier
                </Link>
                <BoutonSupprimer action={supprimerPack.bind(null, pack.id)} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
