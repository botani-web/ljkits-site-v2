import Link from 'next/link'
import { notFound } from 'next/navigation'

import { changerStatutCommande } from '@/actions/commandes'
import { BoutonFormulaire } from '@/components/admin/BoutonsAction'
import { EtiquetteStatut } from '@/components/admin/EtiquetteStatut'
import { formaterDateHeure, formaterEuros, formaterNumeroCommande } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { urlAvatar } from '@/lib/panier'

export const metadata = { title: 'Détail d’une commande' }

export default async function PageCommande({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const commande = await prisma.commande.findUnique({
    where: { id },
    include: {
      lignes: true,
    },
  })

  if (!commande) notFound()


  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/commandes"
          className="-my-3.5 inline-flex min-h-11 items-center text-[13px] text-gris transition-colors hover:text-creme"
        >
          ← Retour aux commandes
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-titre text-2xl uppercase">
            {formaterNumeroCommande(commande.numero)}
          </h1>
          <EtiquetteStatut statut={commande.statut} />
        </div>
      </div>

      {/* -------------------------- ALERTES EN TÊTE -------------------------- */}
      {commande.statut === 'LITIGE' && (
        <div className="mb-5 rounded-xl border border-oni border-l-[3px] border-l-oni bg-oni/10 px-6 py-4">
          <h2 className="mb-1 text-[15.5px] font-bold text-oni">Litige ouvert</h2>
          <p className="text-[14px] text-gris">
            Le client conteste ce paiement auprès de sa banque. Rien n’a été retiré :
            l’arbitrage n’est pas tranché.{' '}
            {commande.livreeAt
              ? `La commande avait été livrée le ${formaterDateHeure(commande.livreeAt)}.`
              : 'Elle n’avait pas encore été livrée.'}{' '}
            Si le litige est perdu, Tebex enverra un second évènement, la commande passera en
            remboursée et le plugin retirera le contenu en jeu.
          </p>
        </div>
      )}

      {commande.derniereErreur && (
        <div className="mb-5 rounded-xl border border-rouge/40 bg-rouge/10 px-6 py-4">
          <h2 className="mb-1 text-[15.5px] font-bold text-rouge">Dernière erreur technique</h2>
          <p className="font-mono text-[13px] text-gris">{commande.derniereErreur}</p>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          {/* --------------------------- CONTENU --------------------------- */}
          <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
            <h2 className="mb-4 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
              Contenu de la commande
            </h2>

            <dl className="flex flex-col gap-2.5">
              {commande.lignes.map((ligne) => (
                <div
                  key={ligne.id}
                  className="flex justify-between gap-3 border-b border-bord pb-2.5 last:border-b-0 last:pb-0"
                >
                  <dt className="text-sm">
                    {ligne.libelle}
                    <span className="ml-2 font-mono text-[10.5px] tracking-wide text-gris uppercase">
                      {ligne.type}
                    </span>
                  </dt>
                  <dd className="font-mono text-sm text-gris">
                    {formaterEuros(ligne.prixCentimes)}
                  </dd>
                </div>
              ))}

              <div className="flex items-baseline justify-between gap-3 border-t border-bord pt-3">
                <dt className="text-sm text-gris">Total</dt>
                <dd className="font-titre text-xl text-or">
                  {formaterEuros(commande.montantTotalCentimes)}
                </dd>
              </div>
            </dl>
          </section>

          {/* --------------------------- ACTIONS --------------------------- */}
          <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
            <h2 className="mb-1.5 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
              Intervenir à la main
            </h2>
            <p className="mb-4 text-[13px] text-gris">
              En temps normal, tout est automatique : Tebex confirme le paiement, la commande
              passe en livrée, et le plugin Tebex applique le contenu en jeu. Ces boutons
              servent quand quelque chose coince.
            </p>

            <div className="flex flex-wrap gap-3">
              {commande.statut !== 'LIVREE' && (
                <BoutonFormulaire
                  action={changerStatutCommande.bind(null, commande.id, 'LIVREE')}
                  variante="principal"
                >
                  Marquer comme livrée
                </BoutonFormulaire>
              )}

              {commande.statut === 'EN_ATTENTE' && (
                <BoutonFormulaire
                  action={changerStatutCommande.bind(null, commande.id, 'PAYEE')}
                >
                  Marquer comme payée
                </BoutonFormulaire>
              )}

              {commande.statut !== 'ECHOUEE' && commande.statut !== 'REMBOURSEE' && (
                <BoutonFormulaire
                  action={changerStatutCommande.bind(null, commande.id, 'ECHOUEE')}
                  variante="danger"
                >
                  Annuler la commande
                </BoutonFormulaire>
              )}

              {(commande.statut === 'LIVREE' || commande.statut === 'LITIGE') && (
                <BoutonFormulaire
                  action={changerStatutCommande.bind(null, commande.id, 'REMBOURSEE')}
                  variante="danger"
                >
                  Marquer comme remboursée
                </BoutonFormulaire>
              )}
            </div>

            <p className="mt-3 text-[13px] text-gris">
              Ces boutons ne changent que le statut côté site. Ils ne remettent rien au joueur
              en jeu : la livraison et le retrait appartiennent au plugin Tebex.
            </p>
          </section>
        </div>

        {/* ---------------------------- COLONNE ---------------------------- */}
        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-bord bg-charbon px-6 py-5.5">
            <h2 className="mb-4 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
              Compte de livraison
            </h2>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlAvatar(commande.pseudoMinecraft, 104)}
                alt=""
                width={52}
                height={52}
                className="size-13 rounded-md border border-bord [image-rendering:pixelated]"
              />
              <div className="min-w-0">
                <div className="truncate font-mono text-[15px] font-bold">
                  {commande.pseudoMinecraft}
                </div>
                <div className="text-[12.5px] text-gris">Pseudo saisi à l’achat</div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-bord bg-charbon px-6 py-5.5">
            <h2 className="mb-4 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
              Suivi
            </h2>
            <dl className="flex flex-col gap-2.5 text-sm">
              <Etape label="Créée" date={commande.createdAt} />
              <Etape label="Payée" date={commande.payeeAt} />
              <Etape label="Livrée" date={commande.livreeAt} />
            </dl>
          </section>

          <section className="rounded-2xl border border-bord bg-charbon px-6 py-5.5">
            <h2 className="mb-4 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
              Références Tebex
            </h2>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between gap-3 border-b border-bord pb-2.5">
                <dt className="text-gris">Panier</dt>
                <dd className="font-mono text-xs break-all">
                  {commande.referenceExterne ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gris">Transaction</dt>
                <dd className="font-mono text-xs break-all">
                  {commande.transactionTebex ?? '—'}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </>
  )
}

function Etape({ label, date }: { label: string; date: Date | null }) {
  return (
    <div className="flex justify-between gap-3 border-b border-bord pb-2.5 last:border-b-0 last:pb-0">
      <dt className="text-gris">{label}</dt>
      <dd className={date ? 'text-right text-[13px]' : 'text-[13px] text-gris'}>
        {date ? formaterDateHeure(date) : '—'}
      </dd>
    </div>
  )
}
