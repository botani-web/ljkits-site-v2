import type { StatutCommande } from '@prisma/client'
import Link from 'next/link'

import { EtiquetteStatut, STATUTS } from '@/components/admin/EtiquetteStatut'
import { formaterDateHeure, formaterEuros, formaterNumeroCommande } from '@/lib/format'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Commandes' }

/** Les statuts existants, plus l'entrée « Toutes ». */
const FILTRES = ['TOUTES', ...(Object.keys(STATUTS) as StatutCommande[])] as const

/** Le filtre passe par l'URL : un lien vers /admin/commandes?statut=PAYEE marche. */
function filtreValide(valeur: string | undefined): StatutCommande | null {
  if (!valeur || !(valeur in STATUTS)) return null
  return valeur as StatutCommande
}

export default async function TableauDeBordCommandes({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>
}) {
  const { statut } = await searchParams
  const filtre = filtreValide(statut)

  const [commandes, comptes] = await Promise.all([
    prisma.commande.findMany({
      where: filtre ? { statut: filtre } : undefined,
      orderBy: { createdAt: 'desc' },
      // 100 dernières : au-delà, il faudra paginer — pas avant un moment.
      take: 100,
      include: { lignes: { select: { libelle: true } } },
    }),
    prisma.commande.groupBy({ by: ['statut'], _count: true }),
  ])

  const total = comptes.reduce((somme, entree) => somme + entree._count, 0)
  const compteParStatut = new Map(comptes.map((entree) => [entree.statut, entree._count]))

  return (
    <>
      <div className="mb-6">
        <h1 className="font-titre text-2xl">Les commandes</h1>
        <p className="mt-1 text-sm text-gris">
          {total} commande{total > 1 ? 's' : ''} au total. Tant que le paiement n’est pas
          branché, elles restent en attente et se livrent à la main.
        </p>
      </div>

      {/* ------------------------------ FILTRES ------------------------------ */}
      <div className="mb-5 flex flex-wrap gap-2 border-b border-bord pb-4">
        {FILTRES.map((cle) => {
          const actif = cle === 'TOUTES' ? filtre === null : filtre === cle
          const nombre = cle === 'TOUTES' ? total : (compteParStatut.get(cle) ?? 0)

          return (
            <Link
              key={cle}
              href={cle === 'TOUTES' ? '/admin/commandes' : `/admin/commandes?statut=${cle}`}
              className={`rounded-controle border px-3.5 py-2 font-mono text-[12.5px] font-bold tracking-wide uppercase transition-colors ${
                actif
                  ? 'border-soupe bg-soupe text-encre'
                  : 'border-bord text-gris hover:border-soupe hover:text-creme'
              }`}
            >
              {cle === 'TOUTES' ? 'Toutes' : STATUTS[cle].label} ({nombre})
            </Link>
          )
        })}
      </div>

      {commandes.length === 0 ? (
        <p className="rounded-carte border border-bord bg-charbon px-6 py-12 text-center text-gris">
          {filtre === null
            ? 'Aucune commande pour l’instant.'
            : `Aucune commande avec le statut « ${STATUTS[filtre].label} ».`}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {commandes.map((commande) => (
            <Link
              key={commande.id}
              href={`/admin/commandes/${commande.id}`}
              className="flex flex-wrap items-center gap-4 rounded-carte border border-bord bg-charbon px-4 py-3.5 transition-colors hover:border-soupe"
            >
              <div className="font-mono text-[13px] font-bold text-or">
                {formaterNumeroCommande(commande.numero)}
              </div>

              <div className="min-w-[160px] flex-1">
                <div className="font-mono text-sm font-bold">{commande.pseudoMinecraft}</div>
                <p className="truncate text-[12.5px] text-gris">
                  {commande.lignes.map((ligne) => ligne.libelle).join(' · ')}
                </p>
              </div>

              <div className="font-titre text-sm text-or">
                {formaterEuros(commande.montantTotalCentimes)}
              </div>

              <EtiquetteStatut statut={commande.statut} />

              <div className="font-mono text-[11px] text-gris">
                {formaterDateHeure(commande.createdAt)}
              </div>
            </Link>
          ))}
        </div>
      )}

      {commandes.length === 100 && (
        <p className="mt-4 text-center text-[13px] text-gris">
          Seules les 100 dernières commandes sont affichées.
        </p>
      )}
    </>
  )
}
