import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { DerniersMatchs } from '@/components/practice/DerniersMatchs'
import { RechercheJoueur } from '@/components/practice/RechercheJoueur'
import { SelecteurSaison } from '@/components/practice/SelecteurSaison'
import { TableauRivals } from '@/components/practice/TableauRivals'
import { PagePublique } from '@/components/public/PagePublique'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { EtatVide } from '@/components/ui/EtatVide'
import { Section } from '@/components/ui/Section'
import { Etiquette } from '@/components/ui/TeteSection'
import { estLocale, LANGUE_DEFAUT, lien, t, type Locale } from '@/lib/i18n'
import { baremeDe, DERNIERE_SAISON_ANCIEN_BAREME, nomPalier } from '@/lib/paliers'
import { lireChiffresCache, lireClassementCache, lireDerniersMatchsCache } from '@/lib/practice'
import { estVue, MODES, tempsRelatif, type Vue } from '@/lib/practice-commun'
import { choisirSaison, lireSaisonsCache, type Saison } from '@/lib/saisons'
import { CLASSEMENT_OUVERT, IMAGE_OG } from '@/lib/site'

/**
 * LE CLASSEMENT RANKED (16/09/2026, accéléré le 04/10/2026).
 *
 * Un onglet par vue — le Global (moyenne des modes, celui du cashprize) puis
 * chaque mode — choisi par `?mode=`, pour qu'un lien partagé ouvre le bon
 * classement.
 *
 * ── POURQUOI LA PAGE ARRIVE EN DEUX TEMPS ───────────────────────────────────
 * Lire `?mode=` rend la page dynamique : elle est recalculée à chaque visite,
 * et rien ne s'affichait tant que les six requêtes n'étaient pas revenues —
 * environ 150 ms de page figée sur la précédente, bien davantage quand la
 * base dormait. Le titre, la recherche et les paliers ne dépendent d'aucune
 * donnée : ils partent immédiatement, et ce qui vient de la base arrive en
 * flux derrière, avec un squelette à la place. Les lectures, elles, sont
 * mises en cache trente secondes (cf. `practice.ts`).
 *
 * ⚠ LECTURE SEULE : les tables appartiennent aux plugins LJElo et LJPractice.
 */
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ mode?: string; saison?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const titre = t(locale, 'pr.meta-titre')
  const description = t(locale, 'pr.meta-desc')
  return {
    title: titre,
    description,
    alternates: { languages: { en: '/en/classement', fr: '/fr/classement' } },
    openGraph: { title: `${titre} — LJKITS`, description, images: IMAGE_OG },
  }
}

export default async function PageClassement({ params, searchParams }: Props) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const { mode, saison: saisonDemandee } = await searchParams
  const vue: Vue = estVue(mode) ? mode : 'global'

  if (!CLASSEMENT_OUVERT) {
    return (
      <PagePublique locale={locale}>
        <Enveloppe className="py-[clamp(60px,8vw,120px)]">
          <EtatVide message={t(locale, 'classement.ferme')} />
        </Enveloppe>
      </PagePublique>
    )
  }

  const saisons = await lireSaisonsCache()
  const saison = choisirSaison(saisons, saisonDemandee)
  if (!saison) {
    return (
      <PagePublique locale={locale}>
        <Enveloppe className="py-[clamp(60px,8vw,120px)]">
          <EtatVide message={t(locale, 'pr.vide-saison')} />
        </Enveloppe>
      </PagePublique>
    )
  }
  // La saison 1 garde son barème (Fer -> Légende) ; les suivantes ont celui de PvPRivals (13/10/2026).
  const ancien = saison.id <= DERNIERE_SAISON_ANCIEN_BAREME

  return (
    <PagePublique locale={locale}>
      {/* ══════════════════════════ EN-TÊTE (à la PvPRivals, 12/10/2026) ══════════════════════════ */}
      <header className="halo-hero relative pt-[clamp(44px,6vw,84px)] pb-[clamp(24px,3vw,40px)]">
        <Enveloppe>
          <Etiquette>
            {t(locale, 'lb.saison-n').replace('{n}', String(saison.id))}
            {saison.terminee ? ` · ${t(locale, 'lb.archive')}` : ''}
          </Etiquette>
          <h1 className="text-h1 mt-3 font-titre">{t(locale, 'lb.titre')}</h1>
          <p className="mt-4 max-w-[62ch] text-[16px] text-gris">{t(locale, 'lb.chapeau')}</p>

          {/* Les quatre chiffres sur toute la largeur, au-dessus du choix de saison et de la recherche. */}
          <div className="mt-8">
            <Suspense fallback={<TuilesSquelette />}>
              <Tuiles saison={saison.id} locale={locale} />
            </Suspense>
          </div>
        </Enveloppe>
      </header>

      {/* ══════════════════════════ LE CLASSEMENT ══════════════════════════ */}
      <section className="pb-[clamp(56px,7vw,96px)]">
        <Enveloppe>
          {/* Hors de l'en-tête : son `overflow: hidden` (le halo) coupait le menu des saisons.
              `z-30` : le menu ouvert passe au-dessus des onglets des modes. */}
          <div className="relative z-30 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SelecteurSaison
              saisons={saisons}
              actuelle={saison}
              locale={locale}
              hrefPour={(id) => lien(locale, `/classement?saison=${id}${vue === 'global' ? '' : `&mode=${vue}`}`)}
            />
            <RechercheJoueur locale={locale} className="w-full sm:w-[420px]" />
          </div>
          {/* `key` : changer d'onglet ou de saison remet le squelette, sinon l'ancien
              tableau resterait affiché pendant le chargement du nouveau. */}
          <Suspense key={`${saison.id}-${vue}`} fallback={<ClassementSquelette />}>
            <Classement saison={saison} vue={vue} locale={locale} />
          </Suspense>
        </Enveloppe>
      </section>

      <Suspense fallback={null}>
        <DerniersMatchsDiffere saison={saison.id} vue={vue} locale={locale} />
      </Suspense>

      {/* ══════════════════════════ LES PALIERS ══════════════════════════ */}
      <Section
        id="paliers"
        etiquette={t(locale, 'classement.paliers')}
        titre={
          <>
            {t(locale, ancien ? 'classement.paliers-titre-s1' : 'classement.paliers-titre')}{' '}
            <span className="text-or">{t(locale, ancien ? 'classement.paliers-legende-s1' : 'classement.paliers-legende')}</span>
          </>
        }
        chapeau={t(locale, ancien ? 'classement.paliers-chapeau-s1' : 'classement.paliers-chapeau')}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {baremeDe(saison.id).map((palier) => (
            <div
              key={palier.nom}
              className="relative overflow-hidden rounded-carte border bg-braise p-5"
              style={{ borderColor: `${palier.couleur}40` }}
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: palier.couleur }} />
              <p className="font-titre text-[clamp(18px,2.2vw,23px)] leading-none" style={{ color: palier.couleur }}>
                {nomPalier(palier, locale)}
              </p>
              <p className="mt-3 font-mono text-[12.5px] text-creme">
                {palier.minimum === 0 ? t(locale, ancien ? 'classement.moins-de-s1' : 'classement.moins-de') : `${palier.minimum} ${t(locale, 'classement.et-plus')}`}
              </p>
            </div>
          ))}
        </div>

        <div className="hachures mt-3.5 flex flex-wrap items-start gap-5 rounded-carte border border-oni/40 p-6">
          <h3 className="shrink-0 font-titre text-base text-oni">{t(locale, 'tableau.anti-farm')}</h3>
          <p className="flex-1 basis-[380px] text-[14.5px] text-gris">
            {t(locale, 'classement.antifarm-1')}{' '}
            <b className="font-semibold text-creme">{t(locale, 'classement.antifarm-gras1')}</b>
            {t(locale, 'classement.antifarm-2')}{' '}
            <b className="font-semibold text-creme">{t(locale, 'classement.antifarm-gras2')}</b>{' '}
            {t(locale, 'classement.antifarm-3')}
          </p>
        </div>
      </Section>
    </PagePublique>
  )
}

/* -------------------------------------------------------------------------- */
/* Les morceaux qui dépendent de la base, et leurs squelettes.                 */
/* -------------------------------------------------------------------------- */

/** Les quatre chiffres de la saison, en haut à droite. */
async function Tuiles({ saison, locale }: { saison: number; locale: Locale }) {
  const chiffres = await lireChiffresCache(saison)
  const tuiles = [
    { libelle: t(locale, 'pr.chiffre-joueurs'), valeur: String(chiffres.joueurs) },
    { libelle: t(locale, 'pr.chiffre-matchs'), valeur: String(chiffres.matchs) },
    { libelle: t(locale, 'pr.chiffre-24h'), valeur: String(chiffres.matchs24h) },
    {
      libelle: t(locale, 'pr.chiffre-dernier'),
      valeur: chiffres.dernierMatch ? tempsRelatif(chiffres.dernierMatch, locale) : '—',
    },
  ]
  return (
    <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {tuiles.map((tuile) => (
        <div key={tuile.libelle} className="rounded-carte border border-bord bg-charbon/80 px-3.5 py-3 backdrop-blur">
          <dt className="font-mono text-[9.5px] tracking-[.14em] text-gris uppercase">{tuile.libelle}</dt>
          <dd className="mt-1.5 font-titre text-[20px] leading-none">{tuile.valeur}</dd>
        </div>
      ))}
    </dl>
  )
}

function TuilesSquelette() {
  return (
    <dl className="grid animate-pulse grid-cols-2 gap-2.5 sm:grid-cols-4" aria-hidden>
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="h-[66px] rounded-carte border border-bord bg-charbon/50" />
      ))}
    </dl>
  )
}

/** Les onglets des modes et le tableau : tout ce qui dépend de la vue et de la saison choisies. */
async function Classement({ saison, vue, locale }: { saison: Saison; vue: Vue; locale: Locale }) {
  const [lignes, chiffres] = await Promise.all([lireClassementCache(saison.id, vue), lireChiffresCache(saison.id)])

  const onglets: { vue: Vue; nom: string; aide?: string; nombre: number }[] = [
    { vue: 'global', nom: t(locale, 'pr.global'), aide: t(locale, 'pr.global-aide'), nombre: chiffres.joueurs },
    ...MODES.map((m) => ({ vue: m.id as Vue, nom: m.nom, nombre: chiffres.classesParMode[m.id] ?? 0 })),
  ]
  const base = `/classement?saison=${saison.id}`

  return (
    <>
      <nav aria-label={t(locale, 'lb.mode')} className="sans-barre-de-defilement -mx-gouttiere mb-6 overflow-x-auto px-gouttiere">
        <ul className="flex min-w-max gap-2">
          {onglets.map((onglet) => {
            const actif = onglet.vue === vue
            const couleur = onglet.vue === 'global' ? undefined : MODES.find((m) => m.id === onglet.vue)?.couleur
            return (
              <li key={onglet.vue}>
                <Link
                  href={lien(locale, onglet.vue === 'global' ? base : `${base}&mode=${onglet.vue}`)}
                  scroll={false}
                  aria-current={actif ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-2.5 rounded-full border px-4 transition ${
                    actif ? 'border-or/70 bg-or/10 text-or' : 'border-bord bg-charbon text-gris hover:border-gris/60 hover:text-creme'
                  }`}
                >
                  {couleur && <span aria-hidden className="size-2 rounded-full" style={{ background: couleur }} />}
                  <span className="font-mono text-[12.5px] font-bold tracking-[.1em] uppercase">{onglet.nom}</span>
                  <span className="rounded-micro bg-nuit/70 px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums">{onglet.nombre}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {lignes.length === 0 ? (
        <EtatVide
          message={
            saison.aDesMatchs ? t(locale, 'pr.vide') : t(locale, 'lb.vide-saison').replace('{n}', String(saison.id))
          }
        />
      ) : (
        <TableauRivals lignes={lignes} locale={locale} saison={saison.id} />
      )}
    </>
  )
}

/**
 * Le squelette du classement : la rangée d'onglets, les trois marches du
 * podium et quelques lignes de tableau. Il occupe à peu près la place du vrai
 * contenu — sans quoi la page sauterait quand les données arrivent.
 */
function ClassementSquelette() {
  return (
    <div className="animate-pulse" aria-hidden>
      <div className="mb-7 flex gap-2 overflow-hidden">
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} className="h-12 w-[132px] shrink-0 rounded-controle border border-bord bg-charbon/60" />
        ))}
      </div>

      <div className="overflow-hidden rounded-carte border border-bord bg-charbon/60">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
          <div key={index} className="h-[54px] border-b border-bord last:border-b-0" />
        ))}
      </div>
    </div>
  )
}

/** Les derniers matchs arrivent en dernier : personne ne les attend pour lire le classement. */
async function DerniersMatchsDiffere({ saison, vue, locale }: { saison: number; vue: Vue; locale: Locale }) {
  if (saison <= 0) return null
  const derniers = await lireDerniersMatchsCache(saison, 8, vue)
  return <DerniersMatchs matchs={derniers} locale={locale} saison={saison} />
}
