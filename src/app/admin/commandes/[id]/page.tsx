import Link from 'next/link'
import { notFound } from 'next/navigation'

import { changerStatutCommande } from '@/actions/commandes'
import { BoutonCopier } from '@/components/admin/BoutonCopier'
import { BoutonFormulaire } from '@/components/admin/BoutonsAction'
import { EtiquetteStatut } from '@/components/admin/EtiquetteStatut'
import { commandesAPlat, construireCommandes } from '@/lib/livraison'
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
    include: { lignes: true },
  })

  if (!commande) notFound()

  // Les commandes console sont reconstruites à partir des instantanés pris à
  // l'achat : elles restent justes même si un kit a été renommé ou supprimé
  // depuis. Même fonction que celle qu'utilisera le worker RCON en phase 3.
  const parLigne = construireCommandes(commande.lignes, commande.pseudoMinecraft)
  const toutesLesCommandes = commandesAPlat(commande.lignes, commande.pseudoMinecraft)
  const lignesSansCommande = parLigne.filter((ligne) => ligne.commandes.length === 0)

  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/commandes"
          className="text-[13px] text-gris transition-colors hover:text-creme"
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

          {/* ------------------------- LIVRAISON --------------------------- */}
          <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
                Commandes à exécuter
              </h2>
              {toutesLesCommandes.length > 0 && (
                <BoutonCopier
                  texte={toutesLesCommandes.join('\n')}
                  libelle="Tout copier"
                />
              )}
            </div>

            <p className="mb-4 text-[13px] text-gris">
              À coller dans la console du serveur. Le pseudo y est déjà substitué.
            </p>

            {toutesLesCommandes.length === 0 ? (
              <p className="rounded-lg border border-rouge/40 bg-rouge/10 px-4 py-3 text-sm text-rouge">
                Aucune commande de livraison n’est configurée pour les articles de cette
                commande. Renseigne-les sur les fiches concernées avant de livrer.
              </p>
            ) : (
              <>
                <pre className="overflow-x-auto rounded-lg border border-bord bg-nuit px-4 py-3.5 font-mono text-[13px] leading-relaxed text-creme">
                  {toutesLesCommandes.join('\n')}
                </pre>

                {lignesSansCommande.length > 0 && (
                  <p className="mt-3 rounded-lg border border-soupe/40 bg-soupe/10 px-4 py-2.5 text-[13px] text-soupe">
                    Sans commande configurée :{' '}
                    {lignesSansCommande.map((ligne) => ligne.libelle).join(', ')}.
                  </p>
                )}
              </>
            )}
          </section>

          {/* --------------------------- ACTIONS --------------------------- */}
          <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
            <h2 className="mb-1.5 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
              Faire avancer la commande
            </h2>
            <p className="mb-4 text-[13px] text-gris">
              Tant que le prestataire de paiement n’est pas branché, c’est ici que tout se
              passe : exécute les commandes ci-dessus, puis marque la commande comme livrée.
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

              {commande.statut === 'LIVREE' && (
                <BoutonFormulaire
                  action={changerStatutCommande.bind(null, commande.id, 'REMBOURSEE')}
                  variante="danger"
                >
                  Marquer comme remboursée
                </BoutonFormulaire>
              )}
            </div>
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
              <div className="flex justify-between gap-3 pt-1">
                <dt className="text-gris">Référence prestataire</dt>
                <dd className="font-mono text-xs text-gris">
                  {commande.referenceExterne ?? '—'}
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
    <div className="flex justify-between gap-3 border-b border-bord pb-2.5">
      <dt className="text-gris">{label}</dt>
      <dd className={date ? 'text-right text-[13px]' : 'text-[13px] text-gris'}>
        {date ? formaterDateHeure(date) : '—'}
      </dd>
    </div>
  )
}
