import type { Metadata } from 'next'

import { Boutique } from '@/components/boutique/Boutique'
import type { GradeBoutique, PackBoutique } from '@/components/boutique/types'
import { BoutonIpGeant } from '@/components/public/CopieIp'
import { PagePublique } from '@/components/public/PagePublique'
import { Accordeon, Question } from '@/components/ui/Accordeon'
import { classesBouton, LienBouton } from '@/components/ui/Bouton'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { CaseCloisonnee, GrilleCloisonnee } from '@/components/ui/GrilleCloisonnee'
import { BlocFinal, Section } from '@/components/ui/Section'
import { Etiquette, TeteSection } from '@/components/ui/TeteSection'
import { prisma } from '@/lib/prisma'
import { IMAGE_OG } from '@/lib/site'

export const revalidate = 3600 // une heure

export const metadata: Metadata = {
  title: 'Boutique',
  description:
    'Soutiens LJKITS et débloque des kits et des cosmétiques. Tout le contenu reste obtenable en jeu, sans payer.',
  openGraph: {
    type: 'website',
    title: 'Boutique — LJKITS',
    description: 'Soutiens le serveur. Aucun avantage en combat, jamais.',
    url: '/boutique',
    images: IMAGE_OG,
  },
}

export default async function PageBoutique() {
  // Trois lectures indépendantes, lancées en parallèle.
  const [gradesEnBase, packsEnBase] = await Promise.all([
    prisma.grade.findMany({
      where: { visible: true },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
      include: { avantages: { orderBy: { ordre: 'asc' }, select: { texte: true } } },
    }),
    // Un kit n'est proposé ici que s'il est explicitement mis en vente ET
    // qu'il a un prix en euros. Le filtre ne distingue pas les classiques des
    // exclusifs : c'est `type` qui les range ensuite dans l'un ou l'autre
    // rayon, côté client. `bientot` n'exclut pas non plus : le kit s'affiche,
    // mais son bouton est inerte.
    prisma.pack.findMany({
      where: { visible: true },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
      // Les noms des kits inclus, pour les lister sous la description du pack.
      // Lecture supplémentaire et purement décorative : le contenu réel du
      // pack est décidé par Tebex à la livraison, pas par cette liste.
      include: { kits: { orderBy: { ordre: 'asc' }, select: { nom: true } } },
    }),
  ])

  // « Tout le grade X » : X est le grade juste avant dans l'ordre. Le calcul
  // est fait ici plutôt que dans le composant client, qui n'a pas à connaître
  // la règle.
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

  return (
    <PagePublique>
      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <header className="halo-hero pt-[clamp(50px,6.5vw,84px)] pb-[clamp(24px,3vw,34px)] text-center">
        <Enveloppe>
          <div className="mx-auto max-w-[900px]">
            <Etiquette>Boutique · livraison en 90 secondes</Etiquette>

            <h1 className="text-h1 mt-4 font-titre">
              Fais-toi
              <br />
              <span className="text-or">un nom</span>.
            </h1>

            <p className="mx-auto mt-5 max-w-[56ch] text-[clamp(16px,1.8vw,18.5px)] text-balance text-gris">
              Tout le monde a la même épée et les mêmes cinq cœurs. La seule chose qui te
              distingue, c’est{' '}
              <b className="font-semibold text-creme">ce que les autres voient de toi</b> : ton
              nom en couleur dans le chat, les particules qui explosent quand tu tues, et le
              message que tout le monde lit à côté de ton kill.
            </p>

            {/*
              Un seul bouton, qui descend AUX RAYONS. Il y en avait deux —
              « voir les grades » et « voir les coins » — qui menaient à
              deux sections empilées à des hauteurs différentes. Les rayons
              sont maintenant côte à côte : un seul point d'entrée suffit.
            */}
            <div className="mt-7 flex justify-center">
              <LienBouton
                href="#rayons"
                variante="or"
                taille="grande"
                className="max-[560px]:w-full"
              >
                Voir la boutique
              </LienBouton>
            </div>
          </div>
        </Enveloppe>
      </header>

      {/* ═══════════════════════ BANDEAU DE CONFIANCE ═══════════════════════ */}
      {/*
        Il remplace l'ancien <BandeauPositionnement> : même rôle — dire d'entrée
        que rien ici ne rend plus fort — mais découpé en quatre promesses
        vérifiables plutôt qu'un seul pavé.
      */}
      <Enveloppe className="pb-[clamp(24px,3vw,34px)]">
        <GrilleCloisonnee colonnes="grid-cols-1 min-[560px]:grid-cols-2 lg:grid-cols-4">
          {CONFIANCE.map((promesse) => (
            <CaseCloisonnee key={promesse.titre} className="flex items-start gap-3 p-5">
              <span aria-hidden="true" className="shrink-0 font-mono font-bold text-vert">
                ✓
              </span>
              <span>
                <span className="block text-[14.5px] font-semibold">{promesse.titre}</span>
                <span className="mt-1 block font-mono text-[10.5px] text-gris">
                  {promesse.detail}
                </span>
              </span>
            </CaseCloisonnee>
          ))}
        </GrilleCloisonnee>
      </Enveloppe>

      {/* ═══════════ RAYONS · VITRINE · PANIER (îlot client) ═══════════ */}
      <Boutique grades={grades} packs={packs} vitrine={<Vitrine />} />

      {/* ══════════════════════════ LA LIVRAISON ══════════════════════════ */}
      <Section
        fond="charbon"
        etiquette="De la commande au jeu"
        titre="Quatre étapes, une minute et demie"
      >
        <div className="grid gap-3 min-[560px]:grid-cols-2 lg:grid-cols-4">
          {ETAPES.map((etape, index) => (
            <div key={etape.titre} className="rounded-carte border border-bord bg-braise p-5.5">
              <p className="font-mono text-[11px] font-bold tracking-[.2em] text-soupe">
                ÉTAPE {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-3 font-titre text-[15px]">{etape.titre}</h3>
              <p className="mt-2.25 text-sm text-gris">{etape.texte}</p>
            </div>
          ))}
        </div>

        {/* ------------------------- L'ENGAGEMENT ------------------------- */}
        <div className="mt-3.5 grid items-center gap-[clamp(24px,4vw,46px)] rounded-bloc border border-vert/35 bg-charbon p-[clamp(26px,4vw,42px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div>
            <Etiquette className="text-vert">L’engagement</Etiquette>
            <h3 className="mt-3 font-titre text-[clamp(19px,2.6vw,26px)] leading-tight">
              Ton achat ne te rendra <span className="text-vert">jamais plus fort</span>
            </h3>
            <p className="mt-3.5 max-w-[56ch] text-[15px] text-gris">
              C’est ce qui fait que le serveur vaut le coup d’être joué. Les kits vendus ont
              exactement les mêmes statistiques que ceux débloqués en coins, et les grades ne
              touchent ni aux dégâts, ni à la vie, ni au knockback.{' '}
              <b className="font-semibold text-creme">Cette liste ne bougera pas.</b>
            </p>
          </div>

          <ul className="overflow-hidden rounded-carte border border-bord bg-nuit">
            {JAMAIS_EN_VENTE.map((interdit) => (
              <li
                key={interdit}
                className="flex items-center gap-2.75 border-b border-bord px-4 py-3 font-mono text-[11.5px] text-gris last:border-b-0"
              >
                <span aria-hidden="true" className="shrink-0 font-bold text-oni">
                  ✗
                </span>
                {interdit}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ═════════════════════════════ LA FAQ ═════════════════════════════ */}
      <Section>
        <TeteSection
          centre
          etiquette="Avant d’acheter"
          titre="Les questions qui reviennent"
          className="mb-[clamp(26px,3.5vw,42px)]"
        />

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
/* Sections statiques                                                         */
/* -------------------------------------------------------------------------- */

/**
 * La vitrine des perks : ce que les grades donnent, montré plutôt que décrit.
 *
 * Trois cartes et non quatre. La quatrième de la maquette, « Rejoue tes dix
 * derniers combats », listait des résultats de duels inventés avec de vrais
 * pseudos : aucune source en base, donc supprimée.
 *
 * Les exemples de messages de mort utilisent des placeholders neutres et non
 * des pseudos : rien ici ne doit se faire passer pour une donnée réelle.
 */
function Vitrine() {
  return (
    <Section
      etiquette="Ce que ça donne, concrètement"
      titre={
        <>
          Regarde avant de <span className="text-or">choisir</span>
        </>
      }
      chapeau="Les perks les plus visibles des grades, en vrai. Tu choisis ton style une fois en jeu, et tu peux en changer quand tu veux."
    >
      <div className="grid gap-3.5 lg:grid-cols-2">
        <CarteVitrine
          tag="Samouraï et plus"
          titre="Particules à la mort de ta cible"
          texte="Sept chorégraphies complètes qui se déclenchent sur le corps de ta victime. Tout le monde autour les voit."
        >
          <ul className="grid grid-cols-2 gap-1.75 min-[560px]:grid-cols-4">
            {PARTICULES.map((particule, index) => (
              <li
                key={particule.nom}
                className="rounded-controle border border-bord bg-nuit px-2 py-3.5 text-center transition-colors hover:border-soupe"
              >
                <span
                  aria-hidden="true"
                  // Le décalage évite que la rangée entière pulse d'un bloc.
                  style={{
                    backgroundColor: particule.couleur,
                    animationDelay: `${index * 0.2}s`,
                  }}
                  className="point-respirant mx-auto block size-2.25 rounded-full"
                />
                <span className="mt-2.5 block font-mono text-[9px] leading-snug tracking-[.08em] text-gris">
                  {particule.nom}
                </span>
              </li>
            ))}
          </ul>
        </CarteVitrine>

        <CarteVitrine
          tag="Samouraï et plus"
          titre="Ton message de mort"
          texte="Sept styles, cinq variantes chacun. Diffusé au tueur, à la victime et à tout le monde dans un rayon de 20 blocs."
        >
          <div className="rounded-controle border border-bord bg-nuit p-4.5 font-mono text-xs leading-[1.9]">
            {MESSAGES_DE_MORT.map((message) => (
              <p key={message.style}>
                <span className="text-gris">{message.style} · </span>
                <span className="text-creme">{message.exemple}</span>
              </p>
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] text-gris">
            {'<toi>'} et {'<ta cible>'} sont remplacés par les vrais pseudos en jeu.
          </p>
        </CarteVitrine>

        <CarteVitrine
          tag="Shogun uniquement"
          titre="Défie qui tu veux"
          texte="La commande /duel envoie une invitation. Si l’autre accepte, vous partez tous les deux en cage, kit PvP forcé, sans que rien ne compte au classement."
        >
          <ul className="overflow-hidden rounded-controle border border-bord bg-nuit">
            {REGLES_DU_DUEL.map((regle) => (
              <li
                key={regle.libelle}
                className="flex gap-3.5 border-b border-bord px-4 py-2.75 font-mono text-[11.5px] last:border-b-0"
              >
                <span className="text-gris">{regle.libelle}</span>
                <span className="ml-auto font-bold text-creme">{regle.valeur}</span>
              </li>
            ))}
          </ul>
        </CarteVitrine>
      </div>
    </Section>
  )
}

function CarteVitrine({
  tag,
  titre,
  texte,
  children,
}: {
  tag: string
  titre: string
  texte: string
  children: React.ReactNode
}) {
  return (
    <article className="flex flex-col rounded-bloc border border-bord bg-charbon p-6.5">
      <p className="font-mono text-[10px] tracking-[.18em] text-or uppercase">{tag}</p>
      <h3 className="mt-3 font-titre text-[19px] tracking-[-.01em]">{titre}</h3>
      <p className="mt-2.75 text-[14.5px] text-gris">{texte}</p>
      <div className="mt-4.5 flex-1">{children}</div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/* Contenu                                                                    */
/* -------------------------------------------------------------------------- */

const CONFIANCE = [
  { titre: 'Livré en 90 secondes', detail: 'Automatique, sans ticket' },
  { titre: 'Achat permanent', detail: 'Aucun abonnement, jamais repris' },
  { titre: 'Paiement sécurisé', detail: 'Traité par Tebex, vendeur officiel' },
  { titre: 'Zéro pay-to-win', detail: 'Aucun avantage en combat' },
]

const PARTICULES = [
  { nom: 'Brasier', couleur: '#FE9301' },
  { nom: 'Hémorragie', couleur: '#E92813' },
  { nom: 'Vortex des âmes', couleur: '#B98BE0' },
  { nom: 'Orage', couleur: '#8FB8E0' },
  { nom: 'Sakura', couleur: '#F19FD0' },
  { nom: 'Détonation', couleur: '#FDC003' },
  { nom: 'Portail du vide', couleur: '#6E56A8' },
]

/**
 * Les exemples de messages de mort.
 * Placeholders neutres et non pseudos : la maquette montrait des noms de
 * joueurs inventés, ce qui laissait croire à une capture réelle.
 */
const MESSAGES_DE_MORT = [
  { style: 'Katana', exemple: '<toi> a tranché <ta cible>' },
  { style: 'Spectral', exemple: '<ta cible> s’est éteint sous <toi>' },
  { style: 'Sobre', exemple: '<toi> → <ta cible>' },
]

const REGLES_DU_DUEL = [
  { libelle: 'Kit imposé', valeur: 'PvP, pour les deux' },
  { libelle: 'Consentement', valeur: 'Obligatoire' },
  { libelle: 'Kills et coins', valeur: 'Non comptés' },
  { libelle: 'Classement', valeur: 'Aucun impact' },
]

const ETAPES = [
  {
    titre: 'Ton pseudo',
    texte:
      'Tu renseignes ton pseudo Minecraft exact. C’est lui qui reçoit la livraison, vérifie la casse.',
  },
  {
    titre: 'Le paiement',
    texte:
      'Chez Tebex, jamais sur ce site. Carte, PayPal, Apple Pay et Google Pay acceptés.',
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

const JAMAIS_EN_VENTE = [
  'Des coins, jamais en vente',
  'Du stuff ou de l’armure',
  'Des dégâts ou de la vie',
  'Des points de classement',
  'Une place dans le staff',
]

const QUESTIONS = [
  {
    question: 'Combien de temps je garde mon grade ?',
    reponses: [
      'À vie. Pas d’abonnement, pas de renouvellement, rien qui expire. Les grades et les kits achetés ne sont jamais repris, y compris aux resets de classement. Les seuls grades temporaires sont ceux gagnés au classement mensuel, qui durent 30 jours.',
    ],
  },
  {
    question: 'Le bonus de coins, ce n’est pas du pay-to-win ?',
    reponses: [
      'C’est la bonne question, alors voici la vraie réponse : le bonus fait débloquer les kits plus vite, il ne donne aucun avantage en combat. Comme les kits sont équilibrés entre eux et qu’aucun n’est objectivement meilleur, arriver plus tôt au Kitsune ne fait gagner aucun duel. Et si un kit devenait trop fort, c’est le kit qui serait corrigé — pas le grade.',
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
      'Demande l’accord de la personne qui possède le moyen de paiement avant d’acheter. Ce n’est pas une formule de style : la quasi-totalité des litiges sur les serveurs Minecraft viennent d’achats faits sans autorisation, et ça finit toujours mal pour le joueur.',
    ],
  },
  {
    question: 'Où part l’argent ?',
    reponses: [
      'Dans l’hébergement, en premier lieu : le VPS et le nom de domaine coûtent une quarantaine d’euros par mois, et Tebex prélève environ 7,5 % en gérant la TVA, la fraude et les litiges. Le développement est bénévole. Ce qui dépasse sert à payer des créateurs pour faire venir du monde — un serveur PvP vide n’intéresse personne.',
    ],
  },
]
