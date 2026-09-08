import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CarteKit, estKitDeGrade, PrixKit, type KitEnCarte } from '@/components/public/CarteKit'
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
import {
  champ,
  champOptionnel,
  type CleTexte,
  estLocale,
  LANGUE_DEFAUT,
  lien,
  t,
  type Locale,
} from '@/lib/i18n'

export const revalidate = 3600 // une heure

/** Nombre de kits proposés en bas de page. Trois = une rangée pleine. */
const NOMBRE_DE_SUGGESTIONS = 3

/** Gain moyen en coins par kill, tel qu'annoncé sur /kits. */
const COINS_PAR_KILL = 20

/** Les repères de jeu rappelés en bas de page. */

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
  roleEn: true,
  descriptionCourteEn: true,
  caracteristiques: {
    orderBy: { ordre: 'asc' as const },
    select: { libelle: true, valeur: true, libelleEn: true, valeurEn: true },
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
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const kit = await lireKit(slug)

  if (!kit) return { title: t(locale, 'kit.introuvable') }

  const role = champ(locale, kit.role, kit.roleEn)
  const description = champ(locale, kit.descriptionCourte, kit.descriptionCourteEn)
  const titre = `${kit.nom} — ${role}`
  const adresse = lien(locale, `/kits/${kit.slug}`)

  return {
    title: kit.nom,
    description,
    // La canonique porte la langue : sans elle, les deux versions se
    // disputeraient la même adresse, qui redirige en plus.
    alternates: {
      canonical: adresse,
      languages: { en: `/en/kits/${kit.slug}`, fr: `/fr/kits/${kit.slug}` },
    },
    openGraph: {
      type: 'article',
      title: `${titre} — LJKITS`,
      description,
      url: adresse,
      images: IMAGE_OG,
    },
    twitter: {
      card: 'summary',
      title: `${titre} — LJKITS`,
      description,
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

export default async function PageKit({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const reperesAffiches = reperes(locale, 'soupe', 'epee', 'armure', 'knockback')

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
  const suggestions: KitEnCarte[] = slugsSuggeres
    .map((slugSuggere) => suggestionsEnDesordre.find((s) => s.slug === slugSuggere))
    .filter((s) => s !== undefined)
    .map((s) => ({
      ...s,
      role: champ(locale, s.role, s.roleEn),
      descriptionCourte: champ(locale, s.descriptionCourte, s.descriptionCourteEn),
      caracteristiques: s.caracteristiques.map((c) => ({
        libelle: champ(locale, c.libelle, c.libelleEn),
        valeur: champ(locale, c.valeur, c.valeurEn),
      })),
    }))

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
    <PagePublique locale={locale}>
      {/* ═══════════════════════════ FIL D'ARIANE ═══════════════════════════ */}
      <Enveloppe className="pt-5.5">
        <Link
          href={lien(locale, '/kits')}
          className="inline-flex min-h-11 items-center font-mono text-[11.5px] tracking-[.12em] text-gris uppercase transition-colors hover:text-soupe"
        >
          <span aria-hidden="true">←</span>&nbsp;{t(locale, 'kit.retour-fleche')}
        </Link>
      </Enveloppe>

      {/* ═════════════════════════════ LA FICHE ═════════════════════════════ */}
      <header className="halo-fiche pb-[clamp(52px,6vw,80px)]">
        <Enveloppe>
          <div className="grid items-start gap-[clamp(28px,4vw,56px)] pt-[clamp(26px,3.5vw,40px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,368px)]">
            {/* ---------------------- colonne de gauche ---------------------- */}
            <div>
              <Badge ton={exclusif ? 'oni' : 'neutre'}>
                {champ(locale, kit.role, kit.roleEn)}
              </Badge>

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
                {champ(locale, kit.descriptionCourte, kit.descriptionCourteEn)}
              </p>

              <article
                className="markdown mt-6.5 max-w-[60ch]"
                dangerouslySetInnerHTML={{
                  __html: markdownVersHtml(
                    champ(locale, kit.descriptionLongue, kit.descriptionLongueEn),
                    { discord },
                  ),
                }}
              />

              {kit.prixCoins > 0 && (
                <div className="mt-8 max-w-[60ch]">
                  <p className="flex flex-wrap items-baseline gap-3 font-mono text-[11px] tracking-[.1em] text-gris uppercase">
                    {t(locale, 'kit.place-progression')}
                    <b className="font-bold text-soupe">
                      {t(locale, 'kit.moins-cher')
                        .replace('{r}', String(rangDePrix))
                        .replace('{n}', String(tousLesKits.length))}
                    </b>
                  </p>

                  <div
                    role="img"
                    aria-label={t(locale, 'kit.jauge-aria')
                      .replace('{c}', formaterCoins(kit.prixCoins))
                      .replace('{m}', formaterCoins(prixMax))}
                    className="mt-2.5 h-1.5 overflow-hidden rounded-[3px] border border-bord bg-braise"
                  >
                    <span
                      style={{ width: `${(kit.prixCoins / prixMax) * 100}%` }}
                      className="block h-full bg-linear-90 from-soupe to-or"
                    />
                  </div>

                  <p className="mt-2.25 font-mono text-[11px] text-gris">
                    {t(locale, 'kit.kills-estimes-1')} {formaterCoins(killsEstimes)}{' '}
                    {t(locale, 'kit.kills-estimes-2')}
                    {COINS_PAR_KILL} {t(locale, 'kit.kills-estimes-3')}
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
                titre={t(locale, exclusif ? 'kit.exclusif-fiche' : 'kit.fiche-technique')}
                pied={
                  <>
                    <BoutonCopieIp
                      className={classesBouton({ variante: 'plein', pleineLargeur: true })}
                    >
                      {t(locale, 'kit.copier-ip')}
                    </BoutonCopieIp>
                    <p className="mt-3 text-center font-mono text-[10.5px] leading-relaxed text-gris">
                      {kit.prixCoins === 0 ? (
                        t(locale, 'kit.des-la-connexion')
                      ) : kit.prixEurosCentimes !== null ? (
                        <>
                          {t(locale, 'kit.debloque-ou')}{' '}
                          <Link
                            href={lien(locale, '/boutique')}
                            className="border-b border-soupe/40 text-soupe"
                          >
                            {t(locale, 'kit.prends-boutique')}
                          </Link>{' '}
                          {t(locale, 'kit.pour')} {formaterEuros(kit.prixEurosCentimes)}.
                        </>
                      ) : (
                        t(locale, 'kit.debloque-coins')
                      )}
                    </p>
                  </>
                }
              >
                <SectionPanneau className="flex items-end gap-3.5">
                  <PrixKit
                    locale={locale}
                    prixCoins={kit.prixCoins}
                    taille="detail"
                    valeur={estKitDeGrade(kit) ? 'Shogun' : undefined}
                    mention={
                      estKitDeGrade(kit)
                        ? t(locale, 'kits.livre-avec-grade')
                        : kit.prixCoins === 0 && kit.kitDeDepart
                          ? t(locale, 'kits.kit-de-depart')
                          : undefined
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
                        libelle: champ(locale, carac.libelle, carac.libelleEn),
                        valeur: champ(locale, carac.valeur, carac.valeurEn),
                      }))}
                    />
                  </SectionPanneau>
                )}

                {kit.bientot && (
                  <SectionPanneau dernier className="border-t border-bord">
                    <p className="font-mono text-[11px] text-soupe">
                      {t(locale, 'kit.bientot-texte')}
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
        etiquette={t(locale, kit.prixCoins === 0 ? 'kit.rien-debloquer' : 'kit.deux-chemins')}
        titre={t(locale, 'kit.comment')}
      >
        <div className="grid gap-3.5 lg:grid-cols-2">
          {kit.prixCoins === 0 ? (
            <Voie titre={t(locale, 'kit.aucun-cout')} ton="gratuite" className="lg:col-span-2">
              <p className="flex-1 text-[15px] text-gris">
                {t(locale, 'kit.gratuit-texte')}
              </p>
              <BoutonCopieIp
                className={classesBouton({
                  variante: 'plein',
                  className: 'mt-4.5 justify-center',
                })}
              >
                {t(locale, 'ip.copier')}
              </BoutonCopieIp>
            </Voie>
          ) : (
            <>
              <Voie titre={t(locale, 'kit.en-jouant')} ton="gratuite">
                <p className="flex-1 text-[15px] text-gris">
                  <b className="font-semibold text-creme">
                    {formaterCoins(kit.prixCoins)} {t(locale, 'kit.coins-mot')}
                  </b>
                  {t(locale, 'kit.voie-normale')}.
                </p>
                <LignesLore
                  lignes={GAINS_EN_JEU.map((gain) => ({
                    libelle: t(locale, gain.cleLibelle as CleTexte),
                    valeur: t(locale, gain.cleValeur as CleTexte),
                  }))}
                  taille="compacte"
                />
                <BoutonCopieIp
                  className={classesBouton({
                    variante: 'vide',
                    className: 'mt-4.5 justify-center',
                  })}
                >
                  {t(locale, 'kit.aller-chercher')}
                </BoutonCopieIp>
              </Voie>

              {kit.prixEurosCentimes !== null && (
                <Voie titre={t(locale, 'kit.en-boutique')} ton="payante">
                  <p className="flex-1 text-[15px] text-gris">
                    <b className="font-semibold text-creme">
                      {formaterEuros(kit.prixEurosCentimes)}
                    </b>{' '}
                    {t(locale, 'kit.voie-payante')}
                  </p>
                  <LignesLore
                    lignes={GARANTIES_BOUTIQUE.map((g) => ({
                      libelle: t(locale, g.cleLibelle as CleTexte),
                      valeur: t(locale, g.cleValeur as CleTexte),
                    }))}
                    taille="compacte"
                  />
                  <LienBouton
                    href={lien(locale, '/boutique')}
                    variante="vide"
                    className="mt-4.5 justify-center"
                  >
                    {t(locale, 'kit.voir-boutique')}
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
        etiquette={t(locale, 'kit.identiques').replace('{n}', String(tousLesKits.length))}
        titre={
          <>
            {t(locale, 'kit.regles-1')} <span className="text-or">{t(locale, 'kit.regles-2')}</span>
          </>
        }
      >
        <BandeauChiffres
          colonnes="grid-cols-2 lg:grid-cols-4"
          reperes={reperesAffiches.map((repere) => ({
            valeur: repere.valeur,
            label: repere.label,
            ton: repere.cle === 'armure' ? ('oni' as const) : ('or' as const),
          }))}
        />
        <p className="mt-4 font-mono text-[11.5px] tracking-[.04em] text-gris">
          {t(locale, 'kit.meme-stuff')}
        </p>
      </Section>

      {/* ═══════════════════════════ LES VOISINS ═══════════════════════════ */}
      {suggestions.length > 0 && (
        <Section
          etiquette={t(locale, 'kit.meme-gamme')}
          titre={exclusif ? t(locale, 'kit.autres-maison') : t(locale, 'kit.prochain')}
        >
          <div className="grid gap-3 lg:grid-cols-3">
            {suggestions.map((suggestion) => (
              <CarteKit key={suggestion.slug} kit={suggestion} locale={locale} />
            ))}
          </div>

          <LienFleche href={lien(locale, '/kits')} className="mt-4">
            {t(locale, 'kit.voir-les')} {tousLesKits.length} {t(locale, 'nav.kits').toLowerCase()}
          </LienFleche>

          {(precedent || suivant) && (
            <nav
              aria-label={t(locale, 'kit.nav-aria')}
              className="mt-[clamp(30px,4vw,44px)] grid gap-3 min-[560px]:grid-cols-2"
            >
              {precedent ? (
                <LienKitVoisin kit={precedent} direction="precedent" locale={locale} />
              ) : (
                <span className="hidden min-[560px]:block" />
              )}
              {suivant && <LienKitVoisin kit={suivant} direction="suivant" locale={locale} />}
            </nav>
          )}
        </Section>
      )}

      {/* ═════════════════════════════ APPEL ═════════════════════════════ */}
      <BlocFinal
        etiquette={t(locale, 'kit.attend')}
        titre={
          kit.bientot ? (
            <>
              {t(locale, 'kit.avance-1')} <span className="text-or">{t(locale, 'kit.avance-2')}</span>.
            </>
          ) : (
            <>
              {t(locale, 'kit.va-chercher')} <span className="text-or">{kit.nom}</span>.
            </>
          )
        }
        chapeau={
          kit.prixCoins === 0
            ? t(locale, 'kit.appel-gratuit')
            : t(locale, 'kit.appel-payant').replace('{prix}', formaterCoins(kit.prixCoins))
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
  { cleLibelle: 'kit.gain.kill', cleValeur: 'kit.gain.kill-v' },
  { cleLibelle: 'kit.gain.dix', cleValeur: 'kit.gain.dix-v' },
  { cleLibelle: 'kit.gain.koth', cleValeur: 'kit.gain.koth-v' },
  { cleLibelle: 'kit.gain.totem', cleValeur: 'kit.gain.totem-v' },
  { cleLibelle: 'kit.gain.discord', cleValeur: 'kit.gain.discord-v' },
]

/** Ce que l'achat ne change pas. C'est l'argument central du positionnement. */
const GARANTIES_BOUTIQUE = [
  { cleLibelle: 'kit.garantie.stats', cleValeur: 'kit.garantie.stats-v' },
  { cleLibelle: 'kit.garantie.avantage', cleValeur: 'kit.garantie.avantage-v' },
  { cleLibelle: 'kit.garantie.livraison', cleValeur: 'kit.garantie.livraison-v' },
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
  locale,
}: {
  kit: { slug: string; nom: string }
  direction: 'precedent' | 'suivant'
  locale: Locale
}) {
  const versLaDroite = direction === 'suivant'

  return (
    <Link
      href={lien(locale, `/kits/${kit.slug}`)}
      className={`rounded-carte border border-bord bg-charbon px-5.5 py-4.5 transition-colors duration-[.18s] hover:border-soupe hover:bg-braise ${
        versLaDroite ? 'min-[560px]:text-right' : ''
      }`}
    >
      <span className="block font-mono text-[10.5px] tracking-[.18em] text-gris uppercase">
        {t(locale, versLaDroite ? 'kit.suivant' : 'kit.precedent')}
      </span>
      <span className="mt-2 block font-titre text-[17px]">
        {versLaDroite ? `${kit.nom} →` : `← ${kit.nom}`}
      </span>
    </Link>
  )
}
