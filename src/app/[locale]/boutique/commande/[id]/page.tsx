import type { StatutCommande } from '@prisma/client'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ViderPanier } from '@/components/boutique/ViderPanier'
import { PagePublique } from '@/components/public/PagePublique'
import { classesBouton, LienBouton } from '@/components/ui/Bouton'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { LignesLore } from '@/components/ui/LignesLore'
import { Panneau, SectionPanneau } from '@/components/ui/Panneau'
import { Etiquette } from '@/components/ui/TeteSection'
import { formaterEuros, formaterNumeroCommande } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { lireReglages } from '@/lib/reglages'
import { estLocale, LANGUE_DEFAUT, lien, t, champ, champOptionnel, type Locale } from '@/lib/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT

  return {
    title: t(locale, 'commande.meta-titre'),
    // Une page de commande n'a rien à faire dans un moteur de recherche.
    robots: { index: false, follow: false },
  }
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
  params: Promise<{ id: string; locale: string }>
}) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT

  const { id } = await params

  const commande = await prisma.commande.findUnique({
    where: { id },
    include: { lignes: { orderBy: { libelle: 'asc' } } },
  })

  if (!commande) notFound()

  const { discord } = await lireReglages()

  return (
    <PagePublique locale={locale}>
      <main className="halo-hero pt-[clamp(48px,6vw,80px)] pb-section">
        <Enveloppe>
          <div className="mx-auto max-w-lecture">
            <div className="text-center">
              <Etiquette className="text-vert">
                {t(locale, 'commande.etiquette')} {formaterNumeroCommande(commande.numero)}
              </Etiquette>

              <h1 className="text-h1 mt-4 font-titre">
                {t(locale, 'commande.merci')}{' '}
                <span className="text-or">{commande.pseudoMinecraft}</span>
              </h1>

              <p className="mx-auto mt-4.5 max-w-[52ch] text-gris">
                {t(locale, 'commande.garde-numero')}
              </p>
            </div>

            {/*
              Le paiement s'étant déroulé dans un autre onglet, c'est cette
              page qui apprend la première qu'il a abouti. Elle vide donc le
              panier — sur le statut réel posé par le webhook, jamais sur une
              supposition.
            */}
            {(commande.statut === 'PAYEE' || commande.statut === 'LIVREE') && <ViderPanier />}

            <EtatDeLaCommande statut={commande.statut} discord={discord} locale={locale} />

            <Panneau titre={t(locale, 'commande.detail')} className="mt-3.5">
              <SectionPanneau>
                <p className="font-mono text-[10.5px] font-bold tracking-[.18em] text-gris uppercase">
                  {t(locale, 'boutique.pseudo-livraison')}
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
                    {t(locale, 'panier.total')}
                  </span>
                  <span className="font-mono text-[22px] leading-none font-bold text-or">
                    {formaterEuros(commande.montantTotalCentimes)}
                  </span>
                </div>
              </SectionPanneau>
            </Panneau>

            <div className="mt-6 flex flex-wrap justify-center gap-2.75">
              <LienBouton href={lien(locale, '/boutique')} variante="vide">
                {t(locale, 'commande.retour-boutique')}
              </LienBouton>
              <a
                href={discord}
                target="_blank"
                rel="noopener noreferrer"
                className={classesBouton({ variante: 'plein' })}
              >
                {t(locale, 'commande.rejoindre-discord')}
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
  locale,
}: {
  statut: StatutCommande
  discord: string
  locale: Locale
}) {
  const etats: Record<
    StatutCommande,
    { titre: string; texte: string; bordure: string; accent: string }
  > = {
    EN_ATTENTE: {
      titre: t(locale, 'commande.en-attente-titre'),
      texte: t(locale, 'commande.en-attente-texte'),
      bordure: 'border-soupe/40 border-l-soupe',
      accent: 'text-soupe',
    },
    PAYEE: {
      titre: t(locale, 'commande.payee-titre'),
      texte: t(locale, 'commande.payee-texte'),
      bordure: 'border-or/40 border-l-or',
      accent: 'text-or',
    },
    LIVREE: {
      titre: t(locale, 'commande.livree-titre'),
      texte: t(locale, 'commande.livree-texte'),
      bordure: 'border-vert/40 border-l-vert',
      accent: 'text-vert',
    },
    ECHOUEE: {
      titre: t(locale, 'commande.annulee-titre'),
      texte: t(locale, 'commande.annulee-texte'),
      bordure: 'border-rouge/40 border-l-rouge',
      accent: 'text-rouge',
    },
    REMBOURSEE: {
      titre: t(locale, 'commande.remboursee-titre'),
      texte: t(locale, 'commande.remboursee-texte'),
      bordure: 'border-bord border-l-gris',
      accent: 'text-gris',
    },
    LITIGE: {
      titre: t(locale, 'commande.contestee-titre'),
      texte: t(locale, 'commande.contestee-texte'),
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
