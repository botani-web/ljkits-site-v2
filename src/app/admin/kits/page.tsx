import Link from 'next/link'

import { basculerKit, deplacerKit, supprimerKit } from '@/actions/kits'
import {
  BoutonBascule,
  BoutonOrdre,
  BoutonSupprimer,
} from '@/components/admin/BoutonsAction'
import { formaterCoins, formaterEuros } from '@/lib/format'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Kits' }

export default async function TableauDeBordKits() {
  // Tous les kits, masqués compris : c'est le tableau de bord.
  // Le tri (ordre, id) est le même que celui utilisé par deplacerKit(),
  // pour que les flèches déplacent bien la ligne qu'on voit.
  const kits = await prisma.kit.findMany({
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    include: { _count: { select: { caracteristiques: true } } },
  })

  const visibles = kits.filter((kit) => kit.visible).length

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titre text-2xl uppercase">Les kits</h1>
          <p className="mt-1 text-sm text-gris">
            {kits.length} kit{kits.length > 1 ? 's' : ''} au total, {visibles} visible
            {visibles > 1 ? 's' : ''} sur le site.
          </p>
        </div>

        <Link
          href="/admin/kits/nouveau"
          className="rounded-lg bg-linear-[135deg] from-soupe to-or px-4 py-2.5 text-sm font-bold text-[#1A1005] transition-shadow hover:shadow-[0_4px_18px_rgba(254,147,1,.35)]"
        >
          + Nouveau kit
        </Link>
      </div>

      {kits.length === 0 ? (
        <p className="rounded-2xl border border-bord bg-charbon px-6 py-12 text-center text-gris">
          Aucun kit pour l’instant. Lance <code className="text-or">npm run db:seed</code> ou
          crée-en un.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {kits.map((kit, index) => (
            <article
              key={kit.id}
              className={`flex flex-wrap items-center gap-4 rounded-xl border bg-charbon px-4 py-3.5 ${
                kit.visible ? 'border-bord' : 'border-bord/50 opacity-60'
              }`}
            >
              {/* --- réordonnancement --- */}
              <div className="flex flex-col gap-1">
                <BoutonOrdre
                  action={deplacerKit.bind(null, kit.id, 'haut')}
                  direction="haut"
                  desactive={index === 0}
                />
                <BoutonOrdre
                  action={deplacerKit.bind(null, kit.id, 'bas')}
                  direction="bas"
                  desactive={index === kits.length - 1}
                />
              </div>

              {/* --- identité --- */}
              <div className="min-w-[180px] flex-1">
                <div className="flex items-baseline gap-2">
                  <h2
                    className={`font-titre text-[17px] uppercase ${
                      kit.type === 'EXCLUSIF' ? 'text-violet' : 'text-creme'
                    }`}
                  >
                    {kit.nom}
                  </h2>
                  {kit.kanji && (
                    <span className="font-mono text-sm text-bord">{kit.kanji}</span>
                  )}
                </div>
                <p className="font-mono text-[11px] tracking-wide text-gris">
                  /kits/{kit.slug} · {kit.role} · {kit._count.caracteristiques} ligne
                  {kit._count.caracteristiques > 1 ? 's' : ''} de fiche
                  {kit.achetable && kit.commandeLivraison.trim() === '' && (
                    <span className="text-rouge"> · pas de commande de livraison</span>
                  )}
                  {kit.achetable && kit.tebexPackageId === null && (
                    <span className="text-rouge"> · pas d’ID Tebex</span>
                  )}
                </p>
              </div>

              {/* --- prix --- */}
              <div className="text-right">
                <div className="font-titre text-sm text-or">
                  {kit.prixCoins === 0 ? (
                    <span className="text-vert">Gratuit</span>
                  ) : (
                    `${formaterCoins(kit.prixCoins)} coins`
                  )}
                </div>
                {kit.prixEurosCentimes !== null && (
                  <div className="font-mono text-[11px] text-violet">
                    {formaterEuros(kit.prixEurosCentimes)}
                  </div>
                )}
              </div>

              {/* --- bascules --- */}
              <div className="flex flex-wrap gap-1.5">
                <BoutonBascule
                  action={basculerKit.bind(null, kit.id, 'visible')}
                  actif={kit.visible}
                  label="Visible"
                  couleur="vert"
                />
                <BoutonBascule
                  action={basculerKit.bind(null, kit.id, 'achetable')}
                  actif={kit.achetable}
                  label="Achetable"
                  couleur="violet"
                />
                <BoutonBascule
                  action={basculerKit.bind(null, kit.id, 'bientot')}
                  actif={kit.bientot}
                  label="Bientôt"
                />
                <BoutonBascule
                  action={basculerKit.bind(null, kit.id, 'kitDeDepart')}
                  actif={kit.kitDeDepart}
                  label="Départ"
                  couleur="vert"
                />
              </div>

              {/* --- actions --- */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/kits/${kit.id}`}
                  className="rounded-lg border border-bord px-3 py-1.5 text-[13px] font-semibold text-gris transition-colors hover:border-soupe hover:text-soupe"
                >
                  Modifier
                </Link>
                <BoutonSupprimer action={supprimerKit.bind(null, kit.id)} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
