import type { StatutLigneLivraison } from '@prisma/client'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { changerStatutCommande } from '@/actions/commandes'
import { regenererLignesLivraison, relancerLigneLivraison } from '@/actions/livraison'
import { BoutonCopier } from '@/components/admin/BoutonCopier'
import { BoutonFormulaire } from '@/components/admin/BoutonsAction'
import { EtiquetteStatut } from '@/components/admin/EtiquetteStatut'
import { formaterDateHeure, formaterEuros, formaterNumeroCommande } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { urlAvatar } from '@/lib/panier'

export const metadata = { title: 'Détail d’une commande' }

/** Au-delà, la ligne sort de la file (même valeur que /api/livraison/file). */
const TENTATIVES_MAX = 5

const STATUT_LIGNE: Record<StatutLigneLivraison, { label: string; classes: string }> = {
  EN_ATTENTE: { label: 'En attente', classes: 'border-soupe/50 bg-soupe/12 text-soupe' },
  EXECUTEE: { label: 'Exécutée', classes: 'border-vert/50 bg-vert/12 text-vert' },
  ECHOUEE: { label: 'Échouée', classes: 'border-rouge/50 bg-rouge/12 text-rouge' },
}

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
      lignesLivraison: { orderBy: [{ type: 'asc' }, { createdAt: 'asc' }] },
    },
  })

  if (!commande) notFound()

  const enAttente = commande.lignesLivraison.filter((l) => l.statut === 'EN_ATTENTE')
  const echouees = commande.lignesLivraison.filter((l) => l.statut === 'ECHOUEE')
  const executees = commande.lignesLivraison.filter((l) => l.statut === 'EXECUTEE')
  const bloquees = enAttente.filter((l) => l.tentatives >= TENTATIVES_MAX)

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
            Si le litige est perdu, Tebex enverra un second évènement et les commandes de
            retrait partiront automatiquement en file.
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

          {/* ----------------------- FILE DE LIVRAISON --------------------- */}
          <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
                File de livraison
              </h2>
              {commande.lignesLivraison.length > 0 && (
                <BoutonCopier
                  texte={commande.lignesLivraison.map((l) => l.commande).join('\n')}
                  libelle="Tout copier"
                />
              )}
            </div>

            {commande.lignesLivraison.length === 0 ? (
              <p className="rounded-lg border border-bord bg-nuit px-4 py-3 text-sm text-gris">
                Rien en file. Les lignes sont créées automatiquement quand Tebex confirme le
                paiement — ou le remboursement.
              </p>
            ) : (
              <>
                <p className="mb-4 text-[13px] text-gris">
                  {executees.length} exécutée{executees.length > 1 ? 's' : ''} ·{' '}
                  {enAttente.length} en attente · {echouees.length} en échec. Le bot vient les
                  chercher tout seul ; le pseudo y est déjà substitué.
                </p>

                <div className="flex flex-col gap-2">
                  {commande.lignesLivraison.map((ligne) => {
                    const style = STATUT_LIGNE[ligne.statut]
                    const bloquee =
                      ligne.statut !== 'EXECUTEE' && ligne.tentatives >= TENTATIVES_MAX

                    return (
                      <div
                        key={ligne.id}
                        className="rounded-lg border border-bord bg-nuit px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <code className="min-w-0 flex-1 font-mono text-[13px] break-all text-creme">
                            {ligne.commande}
                          </code>

                          {ligne.type === 'RETRAIT' && (
                            <span className="rounded border border-oni/50 bg-oni/12 px-2 py-1 font-mono text-[10px] font-bold tracking-wide text-oni uppercase">
                              Retrait
                            </span>
                          )}

                          <span
                            className={`rounded border px-2.5 py-1 font-mono text-[10.5px] font-bold tracking-[1.2px] uppercase ${style.classes}`}
                          >
                            {style.label}
                          </span>

                          {ligne.statut !== 'EXECUTEE' && (
                            <BoutonFormulaire
                              action={relancerLigneLivraison.bind(null, ligne.id)}
                              variante="neutre"
                            >
                              Relancer
                            </BoutonFormulaire>
                          )}
                        </div>

                        {(ligne.tentatives > 0 || ligne.executeeAt || ligne.derniereErreur) && (
                          <p className="mt-2 font-mono text-[11px] text-gris">
                            {ligne.tentatives} tentative{ligne.tentatives > 1 ? 's' : ''}
                            {ligne.executeeAt && ` · exécutée le ${formaterDateHeure(ligne.executeeAt)}`}
                            {bloquee && (
                              <span className="text-rouge">
                                {' '}
                                · sortie de la file, relance manuelle nécessaire
                              </span>
                            )}
                          </p>
                        )}

                        {ligne.derniereErreur && (
                          <p className="mt-1.5 font-mono text-[11.5px] text-rouge">
                            {ligne.derniereErreur}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>

                {bloquees.length > 0 && (
                  <p className="mt-3 rounded-lg border border-rouge/40 bg-rouge/10 px-4 py-2.5 text-[13px] text-rouge">
                    {bloquees.length} ligne{bloquees.length > 1 ? 's' : ''} a atteint{' '}
                    {TENTATIVES_MAX} tentatives et ne sera plus servie au bot. Corrige la
                    commande sur la fiche de l’article, puis relance.
                  </p>
                )}
              </>
            )}
          </section>

          {/* --------------------------- ACTIONS --------------------------- */}
          <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
            <h2 className="mb-1.5 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
              Intervenir à la main
            </h2>
            <p className="mb-4 text-[13px] text-gris">
              En temps normal, tout est automatique : Tebex confirme le paiement, les lignes
              partent en file, le bot les exécute. Ces boutons servent quand quelque chose
              coince.
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

              {commande.lignes.length > 0 && (
                <BoutonFormulaire
                  action={regenererLignesLivraison.bind(null, commande.id)}
                  variante="neutre"
                >
                  Régénérer la file
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
              « Régénérer la file » repart des articles de la commande et remplace les lignes
              en attente ou en échec. Les lignes déjà exécutées ne sont pas touchées.
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
