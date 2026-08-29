import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CarteKit, PrixKit, type KitEnCarte } from '@/components/public/CarteKit'
import { BoutonCopieIp, BoutonIpGeant } from '@/components/public/CopieIp'
import { PagePublique } from '@/components/public/PagePublique'
import { Badge, LienFleche } from '@/components/ui/Badge'
import { classesBouton, LienBouton } from '@/components/ui/Bouton'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { BandeauChiffres } from '@/components/ui/GrilleCloisonnee'
import { LignesLore } from '@/components/ui/LignesLore'
import { Panneau, SectionPanneau } from '@/components/ui/Panneau'
import { BlocFinal, Section } from '@/components/ui/Section'
import { Etiquette } from '@/components/ui/TeteSection'
import { formaterCoins, formaterEuros } from '@/lib/format'
import { markdownVersHtml } from '@/lib/markdown'
import { prisma } from '@/lib/prisma'
import { lireReglages } from '@/lib/reglages'
import { IMAGE_OG, reperes } from '@/lib/site'

export const revalidate = 3600 // une heure

/** Nombre de kits proposés en bas de page. Trois = une rangée pleine. */
const NOMBRE_DE_SUGGESTIONS = 3

/** Gain moyen en coins par kill, tel qu'annoncé sur /kits. */
const COINS_PAR_KILL = 20

/** Les repères de jeu rappelés en bas de page. */
const REPERES_AFFICHES = reperes('soupe', 'epee', 'armure', 'knockback')

/** Les champs dont <CarteKit> a besoin — réutilisés pour les suggestions. */
const CHAMPS_DE_CARTE = {
  slug: true,
  nom: true,
  kanji: true,
  role: true,
  descriptionCourte: true,
  prixCoins: true,
  prixEurosCentimes: true,
  type: true,
  bientot: true,
  kitDeDepart: true,
  caracteristiques: {
    orderBy: { ordre: 'asc' as const },
    select: { libelle: true, valeur: true },
  },
} as const

/**
 * Pré-génère une page par kit visible au moment du build.
 * `dynamicParams` reste à sa valeur par défaut (true) : un kit créé depuis
 * l'admin après le déploiement sera rendu à la première visite.
 */
export async function generateStaticParams() {
  const kits = await prisma.kit.findMany({
    where: { visible: true },
    select: { slug: true },
  })

  return kits.map((kit) => ({ slug: kit.slug }))
}

/** Lecture partagée par generateMetadata() et le composant de page. */
async function lireKit(slug: string) {
  return prisma.kit.findFirst({
    where: { slug, visible: true },
    include: { caracteristiques: { orderBy: { ordre: 'asc' } } },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const kit = await lireKit(slug)

  if (!kit) return { title: 'Kit introuvable' }

  const titre = `${kit.nom} — ${kit.role}`

  return {
    title: kit.nom,
    description: kit.descriptionCourte,
    alternates: { canonical: `/kits/${kit.slug}` },
    openGraph: {
      type: 'article',
      title: `${titre} — LJKITS`,
      description: kit.descriptionCourte,
      url: `/kits/${kit.slug}`,
      images: IMAGE_OG,
    },
    twitter: {
      card: 'summary',
      title: `${titre} — LJKITS`,
      description: kit.descriptionCourte,
      images: IMAGE_OG,
    },
  }
}

/**
 * Choisit les kits à proposer en bas de page.
 *
 * Priorité aux kits du même type (un joueur qui regarde un exclusif s'intéresse
 * d'abord aux autres exclusifs), puis, à l'intérieur de chaque groupe, aux prix
 * les plus proches — c'est le meilleur signal de « prochain kit à viser » dont
 * on dispose en base.
 */
function choisirSuggestions(
  kitCourant: { slug: string; type: string; prixCoins: number },
  tousLesKits: { slug: string; type: string; prixCoins: number }[],
) {
  const ecartDePrix = (kit: { prixCoins: number }) =>
    Math.abs(kit.prixCoins - kitCourant.prixCoins)

  return tousLesKits
    .filter((kit) => kit.slug !== kitCourant.slug)
    .sort((a, b) => {
      const memeTypeA = a.type === kitCourant.type ? 0 : 1
      const memeTypeB = b.type === kitCourant.type ? 0 : 1
      if (memeTypeA !== memeTypeB) return memeTypeA - memeTypeB
      return ecartDePrix(a) - ecartDePrix(b)
    })
    .slice(0, NOMBRE_DE_SUGGESTIONS)
    .map((kit) => kit.slug)
}

export default async function PageKit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const kit = await lireKit(slug)

  // Kit inexistant ou masqué depuis l'admin : 404, pas de page vide.
  if (!kit) notFound()

  // Liste légère de tous les kits visibles : sert au précédent/suivant, au
  // classement des suggestions ET à la jauge de progression. Volontairement
  // sans les caractéristiques, qui ne sont chargées ensuite que pour les trois
  // kits réellement affichés.
  const tousLesKits = await prisma.kit.findMany({
    where: { visible: true },
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    select: { slug: true, nom: true, type: true, prixCoins: true },
  })

  const position = tousLesKits.findIndex((autre) => autre.slug === kit.slug)
  const precedent = position > 0 ? tousLesKits[position - 1] : null
  const suivant = position < tousLesKits.length - 1 ? tousLesKits[position + 1] : null

  const slugsSuggeres = choisirSuggestions(kit, tousLesKits)
  const suggestionsEnDesordre = await prisma.kit.findMany({
    where: { slug: { in: slugsSuggeres } },
    select: CHAMPS_DE_CARTE,
  })
  // findMany ne garantit pas l'ordre du `in` : on remet le classement voulu.
  const suggestions = slugsSuggeres
    .map((slugSuggere) => suggestionsEnDesordre.find((s) => s.slug === slugSuggere))
    .filter((s): s is KitEnCarte => s !== undefined)

  const exclusif = kit.type === 'EXCLUSIF'
  const { discord } = await lireReglages()

  /*
    La jauge de progression situe le kit parmi les autres.

    La maquette divisait le prix par 25 000, une borne écrite en dur qui aurait
    menti dès qu'un kit plus cher serait ajouté. Elle est ici calculée sur le
    catalogue réel. `Math.max(…, 1)` évite une division par zéro le jour où
    tous les kits sont gratuits.
  */
  const prixMax = Math.max(...tousLesKits.map((autre) => autre.prixCoins), 1)
  const rangDePrix =
    tousLesKits
      .filter((autre) => autre.prixCoins < kit.prixCoins)
      .length + 1
  const killsEstimes = Math.max(1, Math.round(kit.prixCoins / COINS_PAR_KILL))

  return (
    <PagePublique>
      {/* ═══════════════════════════ FIL D'ARIANE ═══════════════════════════ */}
      <Enveloppe className="pt-5.5">
        <Link
          href="/kits"
          className="inline-flex min-h-11 items-center font-mono text-[11.5px] tracking-[.12em] text-gris uppercase transition-colors hover:text-soupe"
        >
          <span aria-hidden="true">←</span>&nbsp;Tous les kits
        </Link>
      </Enveloppe>

      {/* ═════════════════════════════ LA FICHE ═════════════════════════════ */}
      <header className="halo-fiche pb-[clamp(52px,6vw,80px)]">
        <Enveloppe>
          <div className="grid items-start gap-[clamp(28px,4vw,56px)] pt-[clamp(26px,3.5vw,40px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,368px)]">
            {/* ---------------------- colonne de gauche ---------------------- */}
            <div>
              <Badge ton={exclusif ? 'oni' : 'neutre'}>{kit.role}</Badge>

              <h1
                className={`text-h1 mt-4 flex flex-wrap items-baseline gap-4 font-titre ${
                  exclusif ? 'text-oni' : ''
                }`}
              >
                {kit.nom}
                {kit.kanji && (
                  <span className="font-corps text-[.42em] font-bold tracking-[.06em] text-oni/50">
                    {kit.kanji}
                  </span>
                )}
              </h1>

              <p className="mt-4.5 max-w-[52ch] text-[clamp(16.5px,1.9vw,19.5px)] text-gris">
                {kit.descriptionCourte}
              </p>

              <article
                className="markdown mt-6.5 max-w-[60ch]"
                dangerouslySetInnerHTML={{
                  __html: markdownVersHtml(kit.descriptionLongue, { discord }),
                }}
              />

              {kit.prixCoins > 0 && (
                <div className="mt-8 max-w-[60ch]">
                  <p className="flex flex-wrap items-baseline gap-3 font-mono text-[11px] tracking-[.1em] text-gris uppercase">
                    Place dans la progression
                    <b className="font-bold text-soupe">
                      {rangDePrix}
                      <sup>e</sup> kit le moins cher sur {tousLesKits.length}
                    </b>
                  </p>

                  <div
                    role="img"
                    aria-label={`${formaterCoins(kit.prixCoins)} coins sur ${formaterCoins(prixMax)} pour le kit le plus cher`}
                    className="mt-2.5 h-1.5 overflow-hidden rounded-[3px] border border-bord bg-braise"
                  >
                    <span
                      style={{ width: `${(kit.prixCoins / prixMax) * 100}%` }}
                      className="block h-full bg-linear-90 from-soupe to-or"
                    />
                  </div>

                  <p className="mt-2.25 font-mono text-[11px] text-gris">
                    Environ {formaterCoins(killsEstimes)} kills pour le débloquer, à ~
                    {COINS_PAR_KILL} coins le kill.
                  </p>
                </div>
              )}
            </div>

            {/* ---------------------- panneau latéral ---------------------- */}
            {/*
              Collé au scroll à partir de lg. `top-[calc(…)]` : la barre de
              navigation fait --spacing-nav de haut, on s'en dégage de 20px.
            */}
            <aside className="lg:sticky lg:top-[calc(var(--spacing-nav)+20px)]">
              <Panneau
                ombre
                ton={exclusif ? 'oni' : 'defaut'}
                titre={exclusif ? 'Kit exclusif' : 'Fiche technique'}
                pied={
                  <>
                    <BoutonCopieIp
                      className={classesBouton({ variante: 'plein', pleineLargeur: true })}
                    >
                      Copier l’IP
                    </BoutonCopieIp>
                    <p className="mt-3 text-center font-mono text-[10.5px] leading-relaxed text-gris">
                      {kit.prixCoins === 0 ? (
                        'Disponible dès ta première connexion.'
                      ) : kit.prixEurosCentimes !== null ? (
                        <>
                          Débloque-le en jouant, ou{' '}
                          <Link
                            href="/boutique"
                            className="border-b border-soupe/40 text-soupe"
                          >
                            prends-le en boutique
                          </Link>{' '}
                          pour {formaterEuros(kit.prixEurosCentimes)}.
                        </>
                      ) : (
                        'Débloque-le en jouant, avec les coins gagnés au combat.'
                      )}
                    </p>
                  </>
                }
              >
                <SectionPanneau className="flex items-end gap-3.5">
                  <PrixKit
                    prixCoins={kit.prixCoins}
                    taille="detail"
                    mention={
                      kit.prixCoins === 0 && kit.kitDeDepart ? 'Kit de départ' : undefined
                    }
                  />
                  {kit.prixEurosCentimes !== null && (
                    <span className="ml-auto shrink-0 rounded-micro border border-bord px-2.5 py-1.5 font-mono text-[11.5px] text-gris">
                      ou {formaterEuros(kit.prixEurosCentimes)}
                    </span>
                  )}
                </SectionPanneau>

                {kit.caracteristiques.length > 0 && (
                  <SectionPanneau dernier>
                    <LignesLore
                      separateur={false}
                      lignes={kit.caracteristiques.map((carac) => ({
                        libelle: carac.libelle,
                        valeur: carac.valeur,
                      }))}
                    />
                  </SectionPanneau>
                )}

                {kit.bientot && (
                  <SectionPanneau dernier className="border-t border-bord">
                    <p className="font-mono text-[11px] text-soupe">
                      Ce kit est annoncé mais pas encore jouable.
                    </p>
                  </SectionPanneau>
                )}
              </Panneau>
            </aside>
          </div>
        </Enveloppe>
      </header>

      {/* ══════════════════════ COMMENT L'OBTENIR ══════════════════════ */}
      <Section
        etiquette={kit.prixCoins === 0 ? 'Rien à débloquer' : 'Deux chemins, un seul kit'}
        titre="Comment l’obtenir"
      >
        <div className="grid gap-3.5 lg:grid-cols-2">
          {kit.prixCoins === 0 ? (
            <Voie titre="Aucun coût" ton="gratuite" className="lg:col-span-2">
              <p className="flex-1 text-[15px] text-gris">
                Ce kit est disponible dès ta première connexion, sans rien débloquer. C’est le
                point de départ de tout le monde.
              </p>
              <BoutonCopieIp
                className={classesBouton({
                  variante: 'plein',
                  className: 'mt-4.5 justify-center',
                })}
              >
                Copier l’IP
              </BoutonCopieIp>
            </Voie>
          ) : (
            <>
              <Voie titre="En jouant" ton="gratuite">
                <p className="flex-1 text-[15px] text-gris">
                  <b className="font-semibold text-creme">
                    {formaterCoins(kit.prixCoins)} coins
                  </b>
                  , gagnés au combat. C’est la voie normale, et celle que prend la majorité
                  des joueurs.
                </p>
                <LignesLore lignes={GAINS_EN_JEU} taille="compacte" />
                <BoutonCopieIp
                  className={classesBouton({
                    variante: 'vide',
                    className: 'mt-4.5 justify-center',
                  })}
                >
                  Aller le chercher
                </BoutonCopieIp>
              </Voie>

              {kit.prixEurosCentimes !== null && (
                <Voie titre="En boutique" ton="payante">
                  <p className="flex-1 text-[15px] text-gris">
                    <b className="font-semibold text-creme">
                      {formaterEuros(kit.prixEurosCentimes)}
                    </b>{' '}
                    pour le même kit, aux mêmes statistiques, simplement sans le grind. Ça
                    fait tourner le serveur — ça ne te rend pas plus fort.
                  </p>
                  <LignesLore lignes={GARANTIES_BOUTIQUE} taille="compacte" />
                  <LienBouton
                    href="/boutique"
                    variante="vide"
                    className="mt-4.5 justify-center"
                  >
                    Voir la boutique
                  </LienBouton>
                </Voie>
              )}
            </>
          )}
        </div>
      </Section>

      {/* ════════════════════════ LES CONSTANTES ════════════════════════ */}
      <Section
        fond="charbon"
        etiquette={`Identiques pour les ${tousLesKits.length} kits`}
        titre={
          <>
            Les règles du soup ne changent <span className="text-or">jamais</span>
          </>
        }
      >
        <BandeauChiffres
          colonnes="grid-cols-2 lg:grid-cols-4"
          reperes={REPERES_AFFICHES.map((repere) => ({
            valeur: repere.valeur,
            label: repere.label,
            ton: repere.cle === 'armure' ? ('oni' as const) : ('or' as const),
          }))}
        />
        <p className="mt-4 font-mono text-[11.5px] tracking-[.04em] text-gris">
          Tout le monde sort du spawn avec le même stuff. Seule la capacité change.
        </p>
      </Section>

      {/* ═══════════════════════════ LES VOISINS ═══════════════════════════ */}
      {suggestions.length > 0 && (
        <Section
          etiquette="Dans la même gamme de prix"
          titre={exclusif ? 'Les autres kits maison' : 'Le prochain à viser'}
        >
          <div className="grid gap-3 lg:grid-cols-3">
            {suggestions.map((suggestion) => (
              <CarteKit key={suggestion.slug} kit={suggestion} />
            ))}
          </div>

          <LienFleche href="/kits" className="mt-4">
            Voir les {tousLesKits.length} kits
          </LienFleche>

          {(precedent || suivant) && (
            <nav
              aria-label="Kit précédent et suivant"
              className="mt-[clamp(30px,4vw,44px)] grid gap-3 min-[560px]:grid-cols-2"
            >
              {precedent ? (
                <LienKitVoisin kit={precedent} direction="precedent" />
              ) : (
                <span className="hidden min-[560px]:block" />
              )}
              {suivant && <LienKitVoisin kit={suivant} direction="suivant" />}
            </nav>
          )}
        </Section>
      )}

      {/* ═════════════════════════════ APPEL ═════════════════════════════ */}
      <BlocFinal
        etiquette="Il t’attend en jeu"
        titre={
          kit.bientot ? (
            <>
              Prends de <span className="text-or">l’avance</span>.
            </>
          ) : (
            <>
              Va chercher le <span className="text-or">{kit.nom}</span>.
            </>
          )
        }
        chapeau={
          kit.prixCoins === 0
            ? 'Il t’attend dès ta première connexion. Connecte-toi et saute dans l’arène.'
            : `Connecte-toi, enchaîne les kills, et il est à toi. ${formaterCoins(kit.prixCoins)} coins, ça se fait plus vite qu’on ne croit.`
        }
      >
        <BoutonIpGeant />
      </BlocFinal>
    </PagePublique>
  )
}

/* -------------------------------------------------------------------------- */
/* Contenu et composants locaux                                               */
/* -------------------------------------------------------------------------- */

/**
 * Les gains en jeu rappelés dans la voie gratuite.
 *
 * Mêmes valeurs que la section « la monnaie » de /kits — c'est la même
 * économie, elle ne doit pas être annoncée différemment d'une page à l'autre.
 *
 * Les DEUX événements rapportent des coins : le KOTH 500 au vainqueur, le
 * totem une part de 2 500. Ils rapportent aussi des points de classement,
 * détaillés sur /classement.
 */
const GAINS_EN_JEU = [
  { libelle: 'Par kill', valeur: '~20 coins' },
  { libelle: 'Tous les 10 kills', valeur: '+50 coins' },
  { libelle: 'KOTH remporté', valeur: '500 coins' },
  { libelle: 'Totem remporté', valeur: 'Une part de 2 500' },
  { libelle: 'Discord lié', valeur: '1 000 coins, une fois' },
]

/** Ce que l'achat ne change pas. C'est l'argument central du positionnement. */
const GARANTIES_BOUTIQUE = [
  { libelle: 'Statistiques', valeur: 'Identiques' },
  { libelle: 'Avantage en combat', valeur: 'Aucun' },
  { libelle: 'Livraison', valeur: 'Sous 90 s en jeu' },
]

/** Une des deux voies d'obtention : en jouant, ou en boutique. */
function Voie({
  titre,
  ton,
  className = '',
  children,
}: {
  titre: string
  ton: 'gratuite' | 'payante'
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex flex-col rounded-carte border bg-charbon p-6.5 ${
        ton === 'payante' ? 'border-soupe/30' : 'border-bord'
      } ${className}`}
    >
      <h3
        className={`font-titre text-[17px] ${ton === 'payante' ? 'text-soupe' : 'text-vert'}`}
      >
        {titre}
      </h3>
      {children}
    </div>
  )
}

/** Lien « kit précédent » ou « kit suivant », dans l'ordre de la grille. */
function LienKitVoisin({
  kit,
  direction,
}: {
  kit: { slug: string; nom: string }
  direction: 'precedent' | 'suivant'
}) {
  const versLaDroite = direction === 'suivant'

  return (
    <Link
      href={`/kits/${kit.slug}`}
      className={`rounded-carte border border-bord bg-charbon px-5.5 py-4.5 transition-colors duration-[.18s] hover:border-soupe hover:bg-braise ${
        versLaDroite ? 'min-[560px]:text-right' : ''
      }`}
    >
      <span className="block font-mono text-[10.5px] tracking-[.18em] text-gris uppercase">
        {versLaDroite ? 'Kit suivant' : 'Kit précédent'}
      </span>
      <span className="mt-2 block font-titre text-[17px]">
        {versLaDroite ? `${kit.nom} →` : `← ${kit.nom}`}
      </span>
    </Link>
  )
}
