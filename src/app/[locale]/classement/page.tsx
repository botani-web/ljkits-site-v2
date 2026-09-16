import type { Metadata } from 'next'
import Link from 'next/link'

import { DerniersMatchs } from '@/components/practice/DerniersMatchs'
import { Podium } from '@/components/practice/Podium'
import { RechercheJoueur } from '@/components/practice/RechercheJoueur'
import { TableauClassement } from '@/components/practice/TableauClassement'
import { PagePublique } from '@/components/public/PagePublique'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { EtatVide } from '@/components/ui/EtatVide'
import { Section } from '@/components/ui/Section'
import { Etiquette } from '@/components/ui/TeteSection'
import { lireSaisonCourante, nomSaison } from '@/lib/elo'
import { estLocale, LANGUE_DEFAUT, lien, t, type Locale } from '@/lib/i18n'
import { nomPalier, PALIERS } from '@/lib/paliers'
import { lireChiffres, lireClassement, lireDerniersMatchs } from '@/lib/practice'
import { estVue, MODES, tempsRelatif, type Vue } from '@/lib/practice-commun'
import { CLASSEMENT_OUVERT, IMAGE_OG } from '@/lib/site'

/**
 * LE CLASSEMENT RANKED (16/09/2026).
 *
 * Un onglet par vue — le Global (moyenne des modes, celui du cashprize) puis
 * chaque mode — choisi par `?mode=`, pour qu'un lien partagé ouvre le bon
 * classement. Les chiffres bougent à chaque match : la page est rendue à la
 * demande (quelques requêtes légères, sans écriture).
 *
 * ⚠ LECTURE SEULE : les tables appartiennent aux plugins LJElo et LJPractice.
 */
export const dynamic = 'force-dynamic'

/** Le montant total et sa répartition. À garder d'accord avec LJPractice (`leaderboard.cashprize`). */
const CASHPRIZE_TOTAL = '150€'
const CASHPRIZE_PODIUM = ['75€', '50€', '25€']

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ mode?: string }>
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
  const { mode } = await searchParams
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

  const saison = await lireSaisonCourante()
  if (!saison) {
    return (
      <PagePublique locale={locale}>
        <Enveloppe className="py-[clamp(60px,8vw,120px)]">
          <EtatVide message={t(locale, 'pr.vide-saison')} />
        </Enveloppe>
      </PagePublique>
    )
  }

  const [lignes, chiffres, derniers] = await Promise.all([
    lireClassement(saison.id, vue),
    lireChiffres(saison.id),
    lireDerniersMatchs(saison.id, 8, vue),
  ])

  const onglets: { vue: Vue; nom: string; aide?: string; nombre: number }[] = [
    { vue: 'global', nom: t(locale, 'pr.global'), aide: t(locale, 'pr.global-aide'), nombre: chiffres.joueurs },
    ...MODES.map((m) => ({ vue: m.id as Vue, nom: m.nom, nombre: chiffres.classesParMode[m.id] ?? 0 })),
  ]

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
    <PagePublique locale={locale}>
      {/* ══════════════════════════ EN-TÊTE ══════════════════════════ */}
      <header className="halo-hero relative pt-[clamp(44px,6vw,84px)] pb-[clamp(28px,4vw,48px)]">
        <Enveloppe>
          <Etiquette>{t(locale, 'pr.etiquette').replace('{s}', nomSaison(saison.nom, locale))}</Etiquette>
          <h1 className="text-h1 mt-3 font-titre">
            {t(locale, 'pr.titre-avant')} <span className="text-or">{t(locale, 'pr.titre-accent')}</span>
          </h1>
          <p className="mt-4 max-w-[62ch] text-[16px] text-gris">
            {t(locale, 'pr.chapeau').replace('{c}', CASHPRIZE_TOTAL)}
          </p>

          <div className="mt-8 grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
            <RechercheJoueur locale={locale} grand className="max-w-[560px]" />
            <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {tuiles.map((tuile) => (
                <div key={tuile.libelle} className="rounded-carte border border-bord bg-charbon/80 px-3.5 py-3 backdrop-blur">
                  <dt className="font-mono text-[9.5px] tracking-[.14em] text-gris uppercase">{tuile.libelle}</dt>
                  <dd className="mt-1.5 font-titre text-[20px] leading-none">{tuile.valeur}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Enveloppe>
      </header>

      {/* ══════════════════════════ LE CLASSEMENT ══════════════════════════ */}
      <section className="pb-[clamp(56px,7vw,96px)]">
        <Enveloppe>
          <nav aria-label={t(locale, 'pr.meta-titre')} className="sans-barre-de-defilement -mx-gouttiere mb-7 overflow-x-auto px-gouttiere">
            <ul className="flex min-w-max gap-2">
              {onglets.map((onglet) => {
                const actif = onglet.vue === vue
                const couleur = onglet.vue === 'global' ? undefined : MODES.find((m) => m.id === onglet.vue)?.couleur
                return (
                  <li key={onglet.vue}>
                    <Link
                      href={lien(locale, onglet.vue === 'global' ? '/classement' : `/classement?mode=${onglet.vue}`)}
                      scroll={false}
                      aria-current={actif ? 'page' : undefined}
                      className={`flex min-h-12 items-center gap-2.5 rounded-controle border px-4 transition ${
                        actif ? 'border-or/70 bg-or/10 text-or' : 'border-bord bg-charbon text-gris hover:border-gris/60 hover:text-creme'
                      }`}
                    >
                      {couleur && <span aria-hidden className="size-2 rounded-full" style={{ background: couleur }} />}
                      <span className="text-left">
                        <span className="block font-mono text-[12.5px] font-bold tracking-[.1em] uppercase">{onglet.nom}</span>
                        {onglet.aide && <span className="block text-[10.5px] leading-tight opacity-75">{onglet.aide}</span>}
                      </span>
                      <span className="rounded-micro bg-nuit/70 px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums">{onglet.nombre}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {lignes.length === 0 ? (
            <EtatVide message={t(locale, 'pr.vide')} />
          ) : (
            <>
              <Podium lignes={lignes} locale={locale} cashprize={vue === 'global' ? CASHPRIZE_PODIUM : undefined} />
              {lignes.length > 3 && (
                <div className="mt-9">
                  <TableauClassement lignes={lignes} locale={locale} global={vue === 'global'} />
                </div>
              )}
            </>
          )}
        </Enveloppe>
      </section>

      <DerniersMatchs matchs={derniers} locale={locale} />

      {/* ══════════════════════════ LES PALIERS ══════════════════════════ */}
      <Section
        id="paliers"
        etiquette={t(locale, 'classement.paliers')}
        titre={
          <>
            {t(locale, 'classement.paliers-titre')}{' '}
            <span className="text-or">{t(locale, 'classement.paliers-legende')}</span>
          </>
        }
        chapeau={t(locale, 'classement.paliers-chapeau')}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PALIERS.map((palier) => (
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
                {palier.minimum === 0 ? t(locale, 'classement.moins-de') : `${palier.minimum} ${t(locale, 'classement.et-plus')}`}
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
