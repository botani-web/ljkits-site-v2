import type { StatutCommande } from '@prisma/client'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PagePublique } from '@/components/public/PagePublique'
import { formaterEuros, formaterNumeroCommande } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Ta commande',
  // Une page de commande n'a rien à faire dans un moteur de recherche.
  robots: { index: false, follow: false },
}

/**
 * Confirmation de commande.
 *
 * L'URL utilise le cuid, pas le numéro séquentiel : un numéro incrémental
 * dans l'adresse laisserait n'importe qui parcourir les commandes des autres.
 *
 * C'est aussi la page de RETOUR après paiement : Tebex la connaît via le
 * `complete_url` transmis à la création du panier. Le statut affiché dépend
 * donc de ce que le webhook a déjà eu le temps de faire — il arrive parfois
 * quelques secondes après le retour du client, d'où le message d'attente.
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
            Commande {formaterNumeroCommande(commande.numero)}
          </p>
          <h1 className="font-titre text-[clamp(26px,4.5vw,44px)] leading-[1.06] uppercase">
            Merci <span className="texte-accent">{commande.pseudoMinecraft}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[520px] text-gris">
            Garde ce numéro : c’est lui qu’on te demandera sur le Discord en cas de souci.
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

        <EtatDeLaCommande statut={commande.statut} />

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

/**
 * Ce que voit le joueur selon l'avancement réel de sa commande.
 *
 * Le webhook de Tebex arrive parfois quelques secondes après que le client a
 * été redirigé ici : un statut encore EN_ATTENTE n'est donc pas une anomalie,
 * et le message le dit plutôt que de laisser croire à un échec.
 */
function EtatDeLaCommande({ statut }: { statut: StatutCommande }) {
  const etats: Record<StatutCommande, { titre: string; texte: string; ton: string }> = {
    EN_ATTENTE: {
      titre: 'Paiement en cours de confirmation',
      texte:
        'Si tu viens de payer, la confirmation arrive en général en quelques secondes — recharge la page. Si tu n’as pas terminé le paiement, ta commande reste en attente et rien ne t’a été débité.',
      ton: 'border-soupe/40 border-l-soupe from-soupe/8',
    },
    PAYEE: {
      titre: 'Paiement confirmé, livraison en cours',
      texte:
        'Ton contenu part vers le serveur, en général sous une minute. Reconnecte-toi si tu étais déjà en ligne.',
      ton: 'border-or/40 border-l-or from-or/8',
    },
    LIVREE: {
      titre: 'Livré',
      texte:
        'Tout est activé sur ton compte. Reconnecte-toi si tu étais en jeu pendant la livraison.',
      ton: 'border-vert/40 border-l-vert from-vert/8',
    },
    ECHOUEE: {
      titre: 'Commande annulée',
      texte:
        'Cette commande n’a pas abouti et rien ne t’a été débité. Tu peux en repasser une depuis la boutique.',
      ton: 'border-rouge/40 border-l-rouge from-rouge/8',
    },
    REMBOURSEE: {
      titre: 'Commande remboursée',
      texte:
        'Le paiement a été remboursé et le contenu correspondant retiré de ton compte.',
      ton: 'border-bord border-l-bord from-braise',
    },
    LITIGE: {
      titre: 'Paiement contesté',
      texte:
        'Un litige est ouvert sur ce paiement. Passe sur le Discord avec ton numéro de commande, on regarde ça avec toi.',
      ton: 'border-oni/40 border-l-oni from-oni/8',
    },
  }

  const etat = etats[statut]

  return (
    <div
      className={`mt-4 rounded-[10px] border border-l-[3px] bg-linear-[100deg] to-transparent px-6 py-5 ${etat.ton}`}
    >
      <h2 className="mb-1.5 text-[15.5px] font-bold">{etat.titre}</h2>
      <p className="text-[14.5px] text-gris">
        {etat.texte}{' '}
        <a
          href={SITE.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="text-soupe underline underline-offset-2"
        >
          Discord
        </a>
        .
      </p>
    </div>
  )
}
