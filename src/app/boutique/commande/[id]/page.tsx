import type { StatutCommande } from '@prisma/client'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PagePublique } from '@/components/public/PagePublique'
import { classesBouton, LienBouton } from '@/components/ui/Bouton'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { LignesLore } from '@/components/ui/LignesLore'
import { Panneau, SectionPanneau } from '@/components/ui/Panneau'
import { Etiquette } from '@/components/ui/TeteSection'
import { formaterEuros, formaterNumeroCommande } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { lireReglages } from '@/lib/reglages'

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

  const { discord } = await lireReglages()

  return (
    <PagePublique>
      <main className="halo-hero pt-[clamp(48px,6vw,80px)] pb-section">
        <Enveloppe>
          <div className="mx-auto max-w-lecture">
            <div className="text-center">
              <Etiquette className="text-vert">
                Commande {formaterNumeroCommande(commande.numero)}
              </Etiquette>

              <h1 className="text-h1 mt-4 font-titre">
                Merci <span className="text-or">{commande.pseudoMinecraft}</span>
              </h1>

              <p className="mx-auto mt-4.5 max-w-[52ch] text-gris">
                Garde ce numéro : c’est lui qu’on te demandera sur le Discord en cas de
                souci.
              </p>
            </div>

            <EtatDeLaCommande statut={commande.statut} discord={discord} />

            <Panneau titre="Le détail" className="mt-3.5">
              <SectionPanneau>
                <p className="font-mono text-[10.5px] font-bold tracking-[.18em] text-gris uppercase">
                  Pseudo de livraison
                </p>
                <p className="mt-2 truncate font-mono text-[17px] font-bold text-creme">
                  {commande.pseudoMinecraft}
                </p>
              </SectionPanneau>

              <SectionPanneau dernier>
                <LignesLore
                  separateur={false}
                  lignes={commande.lignes.map((ligne) => ({
                    libelle: ligne.libelle,
                    valeur: formaterEuros(ligne.prixCentimes),
                  }))}
                />

                <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-bord pt-3">
                  <span className="font-mono text-[11px] tracking-[.1em] text-gris uppercase">
                    Total
                  </span>
                  <span className="font-mono text-[22px] leading-none font-bold text-or">
                    {formaterEuros(commande.montantTotalCentimes)}
                  </span>
                </div>
              </SectionPanneau>
            </Panneau>

            <div className="mt-6 flex flex-wrap justify-center gap-2.75">
              <LienBouton href="/boutique" variante="vide">
                Retour à la boutique
              </LienBouton>
              <a
                href={discord}
                target="_blank"
                rel="noopener noreferrer"
                className={classesBouton({ variante: 'plein' })}
              >
                Rejoindre le Discord
              </a>
            </div>
          </div>
        </Enveloppe>
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
 *
 * Placé AVANT le détail : quelqu'un qui vient de payer veut d'abord savoir où
 * en est sa commande, le récapitulatif ne vient qu'ensuite.
 */
function EtatDeLaCommande({
  statut,
  discord,
}: {
  statut: StatutCommande
  discord: string
}) {
  const etats: Record<
    StatutCommande,
    { titre: string; texte: string; bordure: string; accent: string }
  > = {
    EN_ATTENTE: {
      titre: 'Paiement en cours de confirmation',
      texte:
        'Si tu viens de payer, la confirmation arrive en général en quelques secondes — recharge la page. Si tu n’as pas terminé le paiement, ta commande reste en attente et rien ne t’a été débité.',
      bordure: 'border-soupe/40 border-l-soupe',
      accent: 'text-soupe',
    },
    PAYEE: {
      titre: 'Paiement confirmé, livraison en cours',
      texte:
        'Ton contenu part vers le serveur, en général sous une minute. Reconnecte-toi si tu étais déjà en ligne.',
      bordure: 'border-or/40 border-l-or',
      accent: 'text-or',
    },
    LIVREE: {
      titre: 'Livré',
      texte:
        'Tout est activé en jeu. Reconnecte-toi si tu étais déjà en ligne pendant la livraison.',
      bordure: 'border-vert/40 border-l-vert',
      accent: 'text-vert',
    },
    ECHOUEE: {
      titre: 'Commande annulée',
      texte:
        'Cette commande n’a pas abouti et rien ne t’a été débité. Tu peux en repasser une depuis la boutique.',
      bordure: 'border-rouge/40 border-l-rouge',
      accent: 'text-rouge',
    },
    REMBOURSEE: {
      titre: 'Commande remboursée',
      texte:
        'Le paiement a été remboursé et le contenu correspondant a été retiré en jeu.',
      bordure: 'border-bord border-l-gris',
      accent: 'text-gris',
    },
    LITIGE: {
      titre: 'Paiement contesté',
      texte:
        'Un litige est ouvert sur ce paiement. Passe sur le Discord avec ton numéro de commande, on regarde ça avec toi.',
      bordure: 'border-oni/40 border-l-oni',
      accent: 'text-oni',
    },
  }

  const etat = etats[statut]

  return (
    <div
      className={`mt-8 rounded-carte border border-l-[3px] bg-charbon px-5.5 py-5 ${etat.bordure}`}
    >
      <h2 className={`font-titre text-base ${etat.accent}`}>{etat.titre}</h2>
      <p className="mt-2.5 text-[14.5px] text-gris">
        {etat.texte}{' '}
        <a
          href={discord}
          target="_blank"
          rel="noopener noreferrer"
          className="border-b border-soupe/40 text-soupe transition-colors hover:border-soupe hover:text-or"
        >
          Discord
        </a>
        .
      </p>
    </div>
  )
}
