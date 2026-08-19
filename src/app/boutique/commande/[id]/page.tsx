import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PagePublique } from '@/components/public/PagePublique'
import { formaterEuros, formaterNumeroCommande } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Commande enregistrée',
  // Une page de commande n'a rien à faire dans un moteur de recherche.
  robots: { index: false, follow: false },
}

/**
 * Confirmation de commande.
 *
 * L'URL utilise le cuid, pas le numéro séquentiel : un numéro incrémental
 * dans l'adresse laisserait n'importe qui parcourir les commandes des autres.
 *
 * Phase 3 : cette page deviendra la page de RETOUR après paiement. Le
 * prestataire redirigera ici, et le statut affiché sera PAYEE (ou encore
 * EN_ATTENTE si le webhook n'est pas encore arrivé).
 */
export default async function PageCommande({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const commande = await prisma.commande.findUnique({
    where: { id },
    include: { lignes: { orderBy: { libelle: 'asc' } } },
  })

  if (!commande) notFound()

  return (
    <PagePublique>
      <main className="halo-hero mx-auto max-w-lecture px-6 pt-[150px] pb-24">
        <div className="text-center">
          <p className="mb-3.5 font-mono text-xs font-bold tracking-[3px] text-vert uppercase">
            Commande enregistrée
          </p>
          <h1 className="font-titre text-[clamp(26px,4.5vw,44px)] leading-[1.06] uppercase">
            Merci <span className="texte-accent">{commande.pseudoMinecraft}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[520px] text-gris">
            Ta commande est enregistrée sous le numéro{' '}
            <strong className="font-mono font-bold text-or">
              {formaterNumeroCommande(commande.numero)}
            </strong>
            . Garde-le : c’est lui qu’on te demandera sur le Discord en cas de souci.
          </p>
        </div>

        <div className="mt-9 rounded-2xl border border-bord bg-charbon px-7 py-6">
          <h2 className="mb-4 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
            Le détail
          </h2>

          <dl className="flex flex-col gap-2.5">
            <div className="flex justify-between gap-3 border-b border-bord pb-2.5">
              <dt className="text-sm text-gris">Compte de livraison</dt>
              <dd className="font-mono text-sm font-bold">{commande.pseudoMinecraft}</dd>
            </div>

            {commande.lignes.map((ligne) => (
              <div key={ligne.id} className="flex justify-between gap-3 border-b border-bord pb-2.5">
                <dt className="text-sm">{ligne.libelle}</dt>
                <dd className="font-mono text-sm text-gris">
                  {formaterEuros(ligne.prixCentimes)}
                </dd>
              </div>
            ))}

            <div className="flex items-baseline justify-between gap-3 pt-1">
              <dt className="text-sm text-gris">Total</dt>
              <dd className="font-titre text-2xl text-or">
                {formaterEuros(commande.montantTotalCentimes)}
              </dd>
            </div>
          </dl>
        </div>

        {/*
          Phase 2 : aucun prestataire de paiement n'est branché. La commande
          existe en base au statut EN_ATTENTE, et la livraison est faite à la
          main depuis l'admin. Ce bandeau dit la vérité au joueur plutôt que
          de laisser croire à un paiement abouti.
        */}
        <div className="mt-4 rounded-[10px] border border-soupe/40 border-l-[3px] border-l-soupe bg-linear-[100deg] from-soupe/8 to-transparent px-6 py-5">
          <h2 className="mb-1.5 text-[15.5px] font-bold">Le paiement n’est pas encore en ligne</h2>
          <p className="text-[14.5px] text-gris">
            La boutique ouvre bientôt. Ta commande est bien enregistrée, mais rien ne t’a été
            débité et rien n’est encore livré. Passe sur le{' '}
            <a
              href={SITE.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="text-soupe underline underline-offset-2"
            >
              Discord
            </a>{' '}
            avec ton numéro de commande, on la traitera à la main.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/boutique"
            className="rounded-lg border border-bord px-5 py-2.5 text-sm font-semibold text-gris transition-colors hover:text-creme"
          >
            Retour à la boutique
          </Link>
          <a
            href={SITE.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-discord px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#6a76f5]"
          >
            Rejoindre le Discord
          </a>
        </div>
      </main>
    </PagePublique>
  )
}
