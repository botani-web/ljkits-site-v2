import type { Metadata } from 'next'

import { Boutique } from '@/components/boutique/Boutique'
import type { PackBoutique } from '@/components/boutique/types'
import { BoutonIpGeant } from '@/components/public/CopieIp'
import { PagePublique } from '@/components/public/PagePublique'
import { Accordeon, Question } from '@/components/ui/Accordeon'
import { LienBouton } from '@/components/ui/Bouton'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { BlocFinal, Section } from '@/components/ui/Section'
import { Etiquette } from '@/components/ui/TeteSection'
import { formaterEuros } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { IMAGE_OG } from '@/lib/site'
import { estLocale, LANGUE_DEFAUT, t, champ, type Locale } from '@/lib/i18n'

export const revalidate = 3600 // une heure

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const titre = t(locale, 'meta.boutique-titre')
  const description = t(locale, 'meta.boutique-desc')

  return {
    title: titre,
    description,
    // hreflang : c'est ce qui dit aux moteurs que les deux adresses sont
    // la même page dans deux langues, plutôt que du contenu dupliqué.
    alternates: {
      languages: { en: `/en/boutique`, fr: `/fr/boutique` },
    },
    openGraph: { title: `${titre} — LJKITS`, description, images: IMAGE_OG },
  }
}

/**
 * LA BOUTIQUE — refonte du 03/09/2026.
 *
 * La version d'avant se lisait comme un article : un hero de trois phrases,
 * un bandeau, des onglets, une vitrine, puis seulement les prix. Une boutique
 * fait l'inverse : elle montre d'abord, elle explique ensuite.
 *
 * L'ordre de cette page est donc celui d'un magasin :
 *   1. un bandeau court — le nom du rayon, une promesse, l'article phare ;
 *   2. les produits, prix en gros ;
 *   3. l'aide : comment ça se passe, ce qui n'est pas en vente, la FAQ.
 *
 * ON NE VEND PLUS QUE DES COINS  (26/09/2026).
 *
 * Les grades se sont mis en vente EN JEU, contre des coins (LJ+ 75 000,
 * LJ++ 200 000) — comme les kits et comme les clans. Les vendre aussi ici
 * aurait fait deux prix pour la même chose, dans deux monnaies.
 *
 * La boutique n'a donc plus qu'un rayon, et c'est une simplification pour
 * le joueur autant que pour nous : un seul produit à comprendre, et une
 * seule phrase à tenir — tout s'obtient en jouant, les coins font gagner
 * du temps. Les trois grades restent en base et dans l'admin, masqués :
 * l'historique des commandes y renvoie encore.
 */
export default async function PageBoutique({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT

  const packsEnBase = await prisma.pack.findMany({
    where: { visible: true },
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    include: { kits: { orderBy: { ordre: 'asc' }, select: { nom: true } } },
  })

  const packs: PackBoutique[] = packsEnBase.map((pack) => ({
    slug: pack.slug,
    nom: champ(locale, pack.nom, pack.nomEn),
    description: champ(locale, pack.description, pack.descriptionEn),
    prixEurosCentimes: pack.prixEurosCentimes,
    prixBarreCentimes: pack.prixBarreCentimes,
    achetable: pack.achetable,
    paiementPret: pack.tebexPackageId !== null,
    coins: pack.coins,
    kitsInclus: pack.kits.map((kit) => kit.nom),
  }))

  // L'ARTICLE PHARE DU BANDEAU : LE MEILLEUR RAPPORT.
  //
  // Calculé, pas choisi à la main : le pack qui donne le plus de coins par
  // euro. C'est la seule mise en avant qu'on puisse tenir sans données de
  // vente — « le plus choisi » aurait été une affirmation inventée.
  const phare = packs
    .filter((pack) => (pack.coins ?? 0) > 0 && pack.achetable && pack.paiementPret)
    .reduce<PackBoutique | null>((meilleur, pack) => {
      if (!meilleur) return pack
      const ici = (pack.coins ?? 0) / pack.prixEurosCentimes
      const la = (meilleur.coins ?? 0) / meilleur.prixEurosCentimes
      return ici > la ? pack : meilleur
    }, null)

  return (
    <PagePublique locale={locale}>
      {/* ═══════════════════════════ BANDEAU ═══════════════════════════ */}
      <header className="halo-hero-gauche pt-[clamp(36px,5vw,60px)] pb-[clamp(22px,3vw,32px)]">
        <Enveloppe>
          <div className="grid items-center gap-[clamp(22px,4vw,44px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            <div>
              <Etiquette>{t(locale, 'boutique.etiquette-bandeau')}</Etiquette>
              <h1 className="text-h1 mt-3 font-titre">
                {t(locale, 'boutique.soutiens')}
                <br />
                <span className="text-or">{t(locale, 'boutique.pas-plus-fort')}</span>{t(locale, 'boutique.jamais')}
              </h1>
              <p className="mt-4 max-w-[54ch] text-[clamp(15.5px,1.7vw,17.5px)] text-balance text-gris">
                {t(locale, 'boutique.chapo')}
              </p>

              <ul className="mt-5 flex flex-wrap gap-2">
                {CONFIANCE[locale].map((promesse) => (
                  <li
                    key={promesse}
                    className="flex items-center gap-2 rounded-micro border border-bord bg-charbon px-3 py-1.5 font-mono text-[10.5px] tracking-[.1em] text-gris uppercase"
                  >
                    <span aria-hidden="true" className="font-bold text-vert">
                      ✓
                    </span>
                    {promesse}
                  </li>
                ))}
              </ul>
            </div>

            {phare && (
              <a
                href="#coins"
                className="group relative overflow-hidden rounded-bloc border border-or/50 bg-charbon p-5.5 transition-colors hover:border-or"
              >
                <p className="font-mono text-[10px] font-bold tracking-[.2em] text-or uppercase">
                  {t(locale, 'boutique.plus-choisi')}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <span className="min-w-0">
                    <span className="block font-titre text-[22px] leading-none">
                      {phare.nom}
                    </span>
                    <span className="mt-1.5 block font-mono text-[12px] text-gris">
                      {(phare.coins ?? 0).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}{' '}
                      {t(locale, 'boutique.sur-kill')}
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 font-titre text-[26px] text-creme">
                    {formaterEuros(phare.prixEurosCentimes)}
                  </span>
                </div>
                <span className="mt-4 block font-mono text-[11px] font-bold tracking-[.1em] text-soupe uppercase group-hover:text-or">
                  {t(locale, 'boutique.voir-grades')}
                </span>
              </a>
            )}
          </div>
        </Enveloppe>
      </header>

      {/* ═══════════ LES RAYONS · LE PANIER (îlot client) ═══════════ */}
      <Boutique packs={packs} />

      {/* ═══════════════════════════ L'AIDE ═══════════════════════════ */}
      <Section
        id="aide"
        etiquette={t(locale, 'boutique.aide-etiquette')}
        titre={t(locale, 'boutique.aide-titre')}
        className="scroll-mt-[calc(var(--spacing-nav)+64px)]"
      >
        <ol className="grid gap-3 min-[560px]:grid-cols-2 lg:grid-cols-4">
          {ETAPES[locale].map((etape, index) => (
            <li key={etape.titre} className="rounded-carte border border-bord bg-charbon p-5">
              <p className="font-mono text-[11px] font-bold tracking-[.2em] text-soupe">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-3 font-titre text-[15px]">{etape.titre}</h3>
              <p className="mt-2 text-sm text-gris">{etape.texte}</p>
            </li>
          ))}
        </ol>

        {/* ---------------------- ce qui ne sera jamais en vente ---------------------- */}
        <div className="mt-3.5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-bloc border border-vert/35 bg-charbon p-[clamp(22px,3vw,30px)]">
            <Etiquette className="text-vert">{t(locale, 'boutique.tu-achetes')}</Etiquette>
            <ul className="mt-4 space-y-2.5 text-[14.5px]">
              {EN_VENTE[locale].map((ligne) => (
                <li key={ligne} className="flex gap-2.5 text-gris">
                  <span aria-hidden="true" className="shrink-0 font-mono font-bold text-vert">
                    ✓
                  </span>
                  {ligne}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-bloc border border-oni/35 bg-charbon p-[clamp(22px,3vw,30px)]">
            <Etiquette className="text-oni">{t(locale, 'boutique.jamais-vente')}</Etiquette>
            <ul className="mt-4 space-y-2.5 text-[14.5px]">
              {JAMAIS_EN_VENTE[locale].map((ligne) => (
                <li key={ligne} className="flex gap-2.5 text-gris">
                  <span aria-hidden="true" className="shrink-0 font-mono font-bold text-oni">
                    ✗
                  </span>
                  {ligne}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] text-gris">
              {t(locale, 'boutique.grades-touchent')}{' '}
              <b className="font-semibold text-creme">{t(locale, 'boutique.liste-fixe')}</b>
            </p>
          </div>
        </div>
      </Section>

      {/* ═════════════════════════════ LA FAQ ═════════════════════════════ */}
      <Section
        fond="charbon"
        centre
        etiquette={t(locale, 'boutique.faq-etiquette')}
        titre={t(locale, 'boutique.faq-titre')}
      >
        <Accordeon>
          {QUESTIONS[locale].map((entree) => (
            <Question key={entree.question} question={entree.question}>
              {entree.reponses.map((reponse) => (
                <p key={reponse}>{reponse}</p>
              ))}
            </Question>
          ))}
        </Accordeon>
      </Section>

      {/* ═════════════════════════════ APPEL ═════════════════════════════ */}
      <BlocFinal
        etiquette={t(locale, 'boutique.livre-90')}
        titre={
          <>
            {t(locale, 'boutique.final-1')}{' '}
            <span className="text-or">{t(locale, 'boutique.final-2')}</span>.
          </>
        }
        chapeau={t(locale, 'boutique.final-chapeau')}
      >
        <div className="flex flex-wrap justify-center gap-2.75">
          <LienBouton href="#coins" variante="or" taille="grande">
            {t(locale, 'boutique.choisir-grade')}
          </LienBouton>
          <BoutonIpGeant />
        </div>
      </BlocFinal>
    </PagePublique>
  )
}

/* -------------------------------------------------------------------------- */
/* Contenu                                                                    */
/* -------------------------------------------------------------------------- */

/*
  Contenu de la page, dans les deux langues.
 
  Ces textes sont commerciaux et parfois contractuels (remboursement,
  rejet de paiement) : ils vivent ici, côte à côte, pour qu'une relecture
  compare les deux versions d'un coup d'œil plutôt que d'aller chercher
  une clé dans un dictionnaire.
*/

const CONFIANCE: Record<Locale, string[]> = {
  fr: ['Livré en 90 s', 'Achat permanent', 'Paiement Tebex', 'Zéro pay-to-win'],
  en: ['Delivered in 90 s', 'Permanent purchase', 'Tebex payment', 'Zero pay-to-win'],
}

const ETAPES: Record<Locale, { titre: string; texte: string }[]> = {
  fr: [
    {
      titre: 'Ton pseudo',
      texte:
        'Tu renseignes ton pseudo Minecraft exact. C’est lui qui reçoit la livraison, vérifie la casse.',
    },
    {
      titre: 'Le paiement',
      texte: 'Chez Tebex, jamais sur ce site. Carte, PayPal, Apple Pay et Google Pay acceptés.',
    },
    {
      titre: 'La livraison',
      texte:
        'Automatique en jeu sous 90 secondes. Hors ligne, ça t’attend à la prochaine connexion.',
    },
    {
      titre: 'Tu dépenses',
      texte:
        'En jeu, dans la boutique du serveur : kits, grades, clan, cosmétiques. Tout au même endroit.',
    },
  ],
  en: [
    {
      titre: 'Your username',
      texte:
        'You enter your exact Minecraft username. That is the account that receives the delivery — check the capitals.',
    },
    {
      titre: 'The payment',
      texte: 'On Tebex, never on this site. Card, PayPal, Apple Pay and Google Pay accepted.',
    },
    {
      titre: 'The delivery',
      texte:
        'Automatic in game within 90 seconds. Offline, it waits for your next connection.',
    },
    {
      titre: 'You spend',
      texte:
        'In game, in the server shop: kits, ranks, clan, cosmetics. All in one place.',
    },
  ],
}

const EN_VENTE: Record<Locale, string[]> = {
  fr: [
    'Des coins, et rien d’autre — la même monnaie que tu gagnes à chaque kill',
    'De quoi débloquer tout de suite un kit, un grade ou un clan que tu aurais eu en jouant',
  ],
  en: [
    'Coins, and nothing else — the same currency you earn on every kill',
    'Enough to unlock right away a kit, a rank or a clan you would have earned by playing',
  ],
}

const JAMAIS_EN_VENTE: Record<Locale, string[]> = {
  fr: [
    'Des kits : les quarante-deux s’obtiennent tous en jouant',
    'Des grades : ils s’achètent en jeu, avec des coins gagnés en jouant',
    'Du stuff ou de l’armure',
    'Des dégâts, de la vie ou du knockback',
    'Des points de classement ou de l’Elo',
    'Une place dans le staff',
  ],
  en: [
    'Kits: all forty-two are earned by playing',
    'Ranks: they are bought in game, with coins earned by playing',
    'Gear or armour',
    'Damage, health or knockback',
    'Leaderboard points or Elo',
    'A place in the staff',
  ],
}

const QUESTIONS: Record<Locale, { question: string; reponses: string[] }[]> = {
  fr: [
    {
      question: 'À quoi servent les coins ?',
      reponses: [
        'À tout ce que le serveur vend : les kits, les grades, la création d’un clan et sa couleur, les cosmétiques. Ce sont exactement les coins que tu gagnes à chaque kill — un pack ne donne rien qu’un joueur ne puisse obtenir en jouant, il fait gagner du temps.',
      ],
    },
    {
      question: 'Pourquoi les grades ne sont plus en vente ici ?',
      reponses: [
        'Parce qu’ils s’achètent en jeu, contre des coins, comme tout le reste. Les vendre aussi sur le site aurait fait deux prix pour la même chose, dans deux monnaies — et un joueur qui paie en euros aurait payé pour ce qu’un autre obtient en jouant.',
        'La boutique n’a donc plus qu’un seul produit, et une seule promesse à tenir.',
      ],
    },
    {
      question: 'Acheter des coins, ce n’est pas du pay-to-win ?',
      reponses: [
        'Les coins font arriver plus vite à ce que tout le monde obtient en jouant. Ils ne donnent aucun avantage en combat : les kits sont équilibrés entre eux et aucun n’est objectivement meilleur — arriver plus tôt au Kitsune ne fait gagner aucun duel. Si un kit devenait trop fort, c’est le kit qui serait corrigé.',
        'Rien de ce qui touche aux dégâts, à la vie, au knockback, à l’Elo ou au classement n’est en vente, et ça ne changera pas.',
      ],
    },
    {
      question: 'Je n’ai rien reçu.',
      reponses: [
        'Reconnecte-toi d’abord : la livraison se fait en jeu, et si tu étais hors ligne au moment du paiement, elle t’attend à la connexion suivante. Si au bout de 10 minutes en ligne tu n’as toujours rien, ouvre un ticket sur le Discord avec ton numéro de commande Tebex. C’est traité dans la journée.',
      ],
    },
    {
      question: 'J’ai changé de pseudo Minecraft, je perds tout ?',
      reponses: [
        'Non, les achats sont rattachés à l’UUID du compte et pas au pseudo affiché. En revanche, si tu commandes en tapant un pseudo qui n’est pas le tien, c’est l’autre compte qui reçoit — et ce n’est pas réversible.',
      ],
    },
    {
      question: 'Comment se passe un remboursement ?',
      reponses: [
        'Tebex est le vendeur officiel : les demandes se font auprès d’eux et suivent leurs conditions. Un remboursement entraîne automatiquement le retrait de ce qui a été livré en jeu.',
        'Un rejet de paiement bancaire après avoir reçu son achat entraîne un bannissement définitif de la boutique.',
      ],
    },
    {
      question: 'J’ai moins de 18 ans.',
      reponses: [
        'Demande l’accord de la personne qui possède le moyen de paiement avant d’acheter. La quasi-totalité des litiges sur les serveurs Minecraft viennent d’achats faits sans autorisation, et ça finit toujours mal pour le joueur.',
      ],
    },
    {
      question: 'Où part l’argent ?',
      reponses: [
        'Dans l’hébergement en premier lieu : le VPS et le nom de domaine coûtent une quarantaine d’euros par mois, et Tebex prélève environ 7,5 % en gérant la TVA, la fraude et les litiges. Le développement est bénévole. Ce qui dépasse sert à payer des créateurs pour faire venir du monde — un serveur PvP vide n’intéresse personne.',
      ],
    },
  ],
  en: [
    {
      question: 'What are coins for?',
      reponses: [
        'For everything the server sells: kits, ranks, creating a clan and its colour, cosmetics. They are exactly the coins you earn on every kill — a pack gives nothing a player cannot obtain by playing, it only saves time.',
      ],
    },
    {
      question: 'Why are ranks no longer sold here?',
      reponses: [
        'Because they are bought in game, with coins, like everything else. Selling them on the site too would have meant two prices for the same thing, in two currencies — and someone paying in euros would have paid for what another player earns by playing.',
        'The shop now has a single product, and a single promise to keep.',
      ],
    },
    {
      question: 'Is buying coins not pay-to-win?',
      reponses: [
        'Coins get you faster to what everyone obtains by playing. They give no advantage in combat: kits are balanced against each other and none is objectively better — reaching the Kitsune sooner wins you no duel. If a kit became too strong, the kit would be fixed.',
        'Nothing that touches damage, health, knockback, Elo or the leaderboard is for sale, and that will not change.',
      ],
    },
    {
      question: 'I did not receive anything.',
      reponses: [
        'Log back in first: delivery happens in game, and if you were offline when you paid, it waits for your next connection. If after 10 minutes online you still have nothing, open a ticket on Discord with your Tebex order number. It is handled the same day.',
      ],
    },
    {
      question: 'I changed my Minecraft username, do I lose everything?',
      reponses: [
        'No, purchases are tied to the account UUID, not to the displayed username. However, if you order by typing a username that is not yours, that other account receives it — and it cannot be reversed.',
      ],
    },
    {
      question: 'How does a refund work?',
      reponses: [
        'Tebex is the official seller: requests go to them and follow their terms. A refund automatically removes whatever was delivered in game.',
        'A chargeback after receiving your purchase leads to a permanent ban from the shop.',
      ],
    },
    {
      question: 'I am under 18.',
      reponses: [
        'Ask the owner of the payment method before buying. Almost every dispute on Minecraft servers comes from purchases made without permission, and it always ends badly for the player.',
      ],
    },
    {
      question: 'Where does the money go?',
      reponses: [
        'Hosting first: the VPS and the domain name cost around forty euros a month, and Tebex takes about 7.5 % while handling VAT, fraud and disputes. Development is unpaid. What is left pays creators to bring people in — an empty PvP server interests nobody.',
      ],
    },
  ],
}
