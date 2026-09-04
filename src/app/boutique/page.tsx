import type { Metadata } from 'next'

import { Boutique } from '@/components/boutique/Boutique'
import type { GradeBoutique, PackBoutique } from '@/components/boutique/types'
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

export const revalidate = 3600 // une heure

export const metadata: Metadata = {
  title: 'Boutique',
  description:
    'Grades à vie et packs de coins pour soutenir LJKITS. Aucun kit en vente, aucun avantage en combat : tout le contenu reste obtenable en jouant.',
  openGraph: {
    type: 'website',
    title: 'Boutique — LJKITS',
    description: 'Grades à vie et packs de coins. Aucun avantage en combat, jamais.',
    url: '/boutique',
    images: IMAGE_OG,
  },
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
 *   2. les produits, prix en gros, les deux rayons l'un sous l'autre ;
 *   3. l'aide : comment ça se passe, ce qui n'est pas en vente, la FAQ.
 */
export default async function PageBoutique() {
  const [gradesEnBase, packsEnBase] = await Promise.all([
    prisma.grade.findMany({
      where: { visible: true },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
      include: { avantages: { orderBy: { ordre: 'asc' }, select: { texte: true } } },
    }),
    prisma.pack.findMany({
      where: { visible: true },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
      include: { kits: { orderBy: { ordre: 'asc' }, select: { nom: true } } },
    }),
  ])

  const grades: GradeBoutique[] = gradesEnBase.map((grade, index) => ({
    slug: grade.slug,
    nom: grade.nom,
    kanji: grade.kanji,
    sousTitre: grade.sousTitre,
    etiquette: grade.etiquette,
    prixEurosCentimes: grade.prixEurosCentimes,
    achetable: grade.achetable,
    paiementPret: grade.tebexPackageId !== null,
    avantages: grade.avantages.map((avantage) => avantage.texte),
    heriteDe: grade.heriteDuPrecedent && index > 0 ? gradesEnBase[index - 1].nom : null,
  }))

  const packs: PackBoutique[] = packsEnBase.map((pack) => ({
    slug: pack.slug,
    nom: pack.nom,
    description: pack.description,
    prixEurosCentimes: pack.prixEurosCentimes,
    prixBarreCentimes: pack.prixBarreCentimes,
    achetable: pack.achetable,
    paiementPret: pack.tebexPackageId !== null,
    coins: pack.coins,
    kitsInclus: pack.kits.map((kit) => kit.nom),
  }))

  // L'article phare du bandeau : le grade du milieu, celui que la carte met
  // déjà en avant. S'il n'y a pas trois grades, pas d'article phare.
  const phare = grades.length === 3 ? grades[1] : null

  return (
    <PagePublique>
      {/* ═══════════════════════════ BANDEAU ═══════════════════════════ */}
      <header className="halo-hero-gauche pt-[clamp(36px,5vw,60px)] pb-[clamp(22px,3vw,32px)]">
        <Enveloppe>
          <div className="grid items-center gap-[clamp(22px,4vw,44px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            <div>
              <Etiquette>Boutique officielle · vendeur Tebex</Etiquette>
              <h1 className="text-h1 mt-3 font-titre">
                Soutiens le serveur.
                <br />
                <span className="text-or">Pas plus fort</span>, jamais.
              </h1>
              <p className="mt-4 max-w-[54ch] text-[clamp(15.5px,1.7vw,17.5px)] text-balance text-gris">
                Des grades à vie et des packs de coins. Aucun kit en vente, aucun avantage en
                combat : tout ce qui se joue s’obtient en jouant.
              </p>

              <ul className="mt-5 flex flex-wrap gap-2">
                {CONFIANCE.map((promesse) => (
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
                href="#grades"
                className="group relative overflow-hidden rounded-bloc border border-or/50 bg-charbon p-5.5 transition-colors hover:border-or"
              >
                <p className="font-mono text-[10px] font-bold tracking-[.2em] text-or uppercase">
                  Le plus choisi
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="flex size-14 shrink-0 items-center justify-center rounded-carte border border-or/40 bg-nuit text-[28px] font-bold text-or"
                  >
                    {phare.kanji ?? '❀'}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-titre text-[22px] leading-none">
                      Grade {phare.nom}
                    </span>
                    <span className="mt-1.5 block font-mono text-[12px] text-gris">
                      {phare.etiquette ?? ''} sur chaque kill, à vie
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 font-titre text-[26px] text-creme">
                    {formaterEuros(phare.prixEurosCentimes)}
                  </span>
                </div>
                <span className="mt-4 block font-mono text-[11px] font-bold tracking-[.1em] text-soupe uppercase group-hover:text-or">
                  Voir les grades →
                </span>
              </a>
            )}
          </div>
        </Enveloppe>
      </header>

      {/* ═══════════ LES RAYONS · LE PANIER (îlot client) ═══════════ */}
      <Boutique grades={grades} packs={packs} />

      {/* ═══════════════════════════ L'AIDE ═══════════════════════════ */}
      <Section
        id="aide"
        etiquette="De la commande au jeu"
        titre="Comment ça se passe"
        className="scroll-mt-[calc(var(--spacing-nav)+64px)]"
      >
        <ol className="grid gap-3 min-[560px]:grid-cols-2 lg:grid-cols-4">
          {ETAPES.map((etape, index) => (
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
            <Etiquette className="text-vert">Ce que tu achètes</Etiquette>
            <ul className="mt-4 space-y-2.5 text-[14.5px]">
              {EN_VENTE.map((ligne) => (
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
            <Etiquette className="text-oni">Ce qui ne sera jamais en vente</Etiquette>
            <ul className="mt-4 space-y-2.5 text-[14.5px]">
              {JAMAIS_EN_VENTE.map((ligne) => (
                <li key={ligne} className="flex gap-2.5 text-gris">
                  <span aria-hidden="true" className="shrink-0 font-mono font-bold text-oni">
                    ✗
                  </span>
                  {ligne}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] text-gris">
              Les grades ne touchent ni aux dégâts, ni à la vie, ni au knockback.{' '}
              <b className="font-semibold text-creme">Cette liste ne bougera pas.</b>
            </p>
          </div>
        </div>
      </Section>

      {/* ═════════════════════════════ LA FAQ ═════════════════════════════ */}
      <Section fond="charbon" centre etiquette="Avant d’acheter" titre="Les questions qui reviennent">
        <Accordeon>
          {QUESTIONS.map((entree) => (
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
        etiquette="Livré en 90 secondes"
        titre={
          <>
            Le prochain kill peut être <span className="text-or">le tien</span>.
          </>
        }
        chapeau="Un grade se prend une fois et se garde à vie. Tu peux aussi tout débloquer en jouant — les deux chemins mènent au même endroit."
      >
        <div className="flex flex-wrap justify-center gap-2.75">
          <LienBouton href="#grades" variante="or" taille="grande">
            Choisir un grade
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

const CONFIANCE = ['Livré en 90 s', 'Achat permanent', 'Paiement Tebex', 'Zéro pay-to-win']

const ETAPES = [
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
    titre: 'Le rôle Discord',
    texte: 'Posé dans les 5 minutes, si ton compte est lié avec /discord en jeu.',
  },
]

const EN_VENTE = [
  'Un grade, à vie : bonus de coins, couleur de pseudo, rôle Discord',
  'Des coins, pour débloquer tout de suite un kit que tu aurais eu en jouant',
]

const JAMAIS_EN_VENTE = [
  'Des kits : les trente-neuf s’obtiennent tous en jouant',
  'Du stuff ou de l’armure',
  'Des dégâts, de la vie ou du knockback',
  'Des points de classement ou de l’Elo',
  'Une place dans le staff',
]

const QUESTIONS = [
  {
    question: 'Combien de temps je garde mon grade ?',
    reponses: [
      'À vie. Pas d’abonnement, pas de renouvellement, rien qui expire. Les grades ne sont jamais repris, y compris aux resets de classement. Les seuls grades temporaires sont ceux gagnés au classement mensuel, qui durent 30 jours.',
    ],
  },
  {
    question: 'Le bonus de coins, ce n’est pas du pay-to-win ?',
    reponses: [
      'Le bonus fait débloquer les kits plus vite, il ne donne aucun avantage en combat. Les kits sont équilibrés entre eux et aucun n’est objectivement meilleur : arriver plus tôt au Kitsune ne fait gagner aucun duel. Si un kit devenait trop fort, c’est le kit qui serait corrigé — pas le grade.',
    ],
  },
  {
    question: 'À quoi servent les coins ?',
    reponses: [
      'À débloquer des kits, exactement comme ceux que tu gagnes à chaque kill. Un pack de coins ne donne rien qu’un joueur ne puisse obtenir en jouant : il fait juste gagner du temps.',
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
]
