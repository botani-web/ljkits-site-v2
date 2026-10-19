import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PagePublique } from '@/components/public/PagePublique'
import {
  BadgeGrade,
  BarreWinrate,
  Conteneur,
  Elo,
  Forme,
  IconeMode,
  NomPalier,
  Panneau,
  Tete,
} from '@/components/s2/Briques'
import { OngletsModes, PucesSaison } from '@/components/s2/Selecteurs'
import { cheminClassement, lireSegmentsClassement, PAR_PAGE } from '@/lib/chemins-s2'
import { formaterDate, formaterDateHeure } from '@/lib/format'
import type { Grade } from '@/lib/grades-commun'
import { estLocale, LANGUE_DEFAUT, lien, type Locale } from '@/lib/i18n'
import { ts } from '@/lib/i18n-s2'
import { gradesEnCache } from '@/lib/joueurs'
import { lireChiffresCache, lireClassementCache, type LigneClassement } from '@/lib/practice'
import { cheminProfil, infosMode, modesDeSaison, urlCorps, type Vue } from '@/lib/practice-commun'
import { cashprizeDe, euros, OUVERTURES_PUBLIQUES, saisonParDefaut } from '@/lib/saison'
import { contexteSaison } from '@/lib/saisons'
import { IMAGE_OG } from '@/lib/site'

/**
 * LES CLASSEMENTS (refonte S2, 16/10/2026).
 *
 * Une adresse par saison × mode × page, pré-rendue et gardée 30 secondes par le
 * CDN : changer d'onglet est instantané (lien préchargé), et la base n'est lue
 * qu'une fois toutes les 30 s quel que soit le nombre de visiteurs.
 */
export const revalidate = 30

type Params = { params: Promise<{ locale: string; vue?: string[] }> }

/** Les adresses pré-rendues au build : chaque onglet de la saison par défaut, dans les deux langues. */
export function generateStaticParams() {
  const vues: (string[] | undefined)[] = [undefined, ...modesDeSaison(saisonParDefaut()).map((m) => [m.id])]
  return ['en', 'fr'].flatMap((locale) => vues.map((vue) => ({ locale, vue })))
}

async function lire(params: Params['params']) {
  const { locale: brut, vue: segments } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const demande = lireSegmentsClassement(segments)
  if (!demande) return null
  const contexte = await contexteSaison(demande.saison)
  if (!contexte) return null
  return { locale, ...demande, ...contexte }
}

function nomVue(vue: Vue, locale: Locale): string {
  return vue === 'global' ? ts(locale, 'c.global') : infosMode(vue).nom
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const l = await lire(params)
  if (!l) return {}
  const titre = ts(l.locale, 'l.meta-titre', { v: nomVue(l.vue, l.locale), n: l.saison })
  const description = ts(l.locale, 'l.meta-desc', { v: nomVue(l.vue, l.locale), n: l.saison })
  return {
    title: titre,
    description,
    alternates: { canonical: lien(l.locale, cheminClassement(l.saison, l.vue, l.parDefaut, l.page)) },
    openGraph: { title: titre, description, images: IMAGE_OG },
  }
}

export default async function PageClassement({ params }: Params) {
  const l = await lire(params)
  if (!l) notFound()
  const { locale, saison, vue, page, parDefaut, saisons, terminee } = l

  const modes = modesDeSaison(saison)
  if (vue !== 'global' && !modes.some((m) => m.id === vue)) notFound()

  // Une saison pas encore ouverte au public se montre vide : les matchs de test du staff n'y comptent pas.
  const ouvertureSaison = OUVERTURES_PUBLIQUES[saison]
  const pasOuverte = ouvertureSaison != null && Date.parse(ouvertureSaison) > Date.now()
  const [toutes, chiffres] = await Promise.all([
    pasOuverte ? Promise.resolve([]) : lireClassementCache(saison, vue, 1000),
    pasOuverte ? Promise.resolve({ joueurs: 0, matchs: 0, matchs24h: 0, dernierMatch: null, classesParMode: {} as Record<string, number> }) : lireChiffresCache(saison),
  ])
  const lignes = toutes
  const pages = Math.max(1, Math.ceil(lignes.length / PAR_PAGE))
  if (page > pages) notFound()
  const visibles = lignes.slice((page - 1) * PAR_PAGE, page * PAR_PAGE)
  const grades = await gradesEnCache(visibles.map((x) => x.uuid))

  const cashprize = cashprizeDe(saison)
  const chemin = (s: number, v: Vue, p = 1) => cheminClassement(s, v, parDefaut, p)

  const onglets = [
    { cle: 'global', libelle: ts(locale, 'c.global'), href: chemin(saison, 'global'), nombre: undefined },
    ...modes.map((m) => ({
      cle: m.id,
      libelle: m.nom,
      href: chemin(saison, m.id),
      mode: m.id,
      nombre: chiffres.classesParMode[m.id] ?? 0,
    })),
  ]

  // Une saison pas encore ouverte au public : on le dit, et on renvoie vers la précédente.
  const ouverture = OUVERTURES_PUBLIQUES[saison + 1]
  const suivanteAVenir = ouverture && Date.parse(ouverture) > Date.now() && saison === parDefaut

  return (
    <PagePublique locale={locale}>
      <main className="pb-6">
        <section className="border-b border-bord bg-[radial-gradient(60%_120%_at_10%_0%,rgba(254,147,1,.09),transparent_70%)]">
          <Conteneur className="pt-9 pb-6 sm:pt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="entree text-[30px] leading-tight font-extrabold tracking-[-.02em] text-creme sm:text-[38px]">
                  {ts(locale, 'l.titre')}
                </h1>
                <p className="mt-1.5 max-w-[60ch] text-[15px] text-gris">
                  {terminee
                    ? ts(locale, 'l.sous-fini', { n: saison })
                    : ts(locale, 'l.sous-live', { c: euros(cashprize.total, locale) })}
                </p>
              </div>
              <PucesSaison saisons={saisons} actuelle={saison} locale={locale} href={(s) => chemin(s, vue === 'global' || modesDeSaison(s).some((m) => m.id === vue) ? vue : 'global')} />
            </div>
            {suivanteAVenir && (
              <p className="mt-4 rounded-[6px] border border-or/30 bg-or/[.06] px-3.5 py-2.5 text-[14px] text-creme">
                {ts(locale, 'l.vide-avant', {
                  n: saison + 1,
                  d: formaterDate(new Date(ouverture), locale),
                  p: saison,
                })}
              </p>
            )}
          </Conteneur>
          <Conteneur>
            <OngletsModes onglets={onglets} actif={vue} locale={locale} />
          </Conteneur>
        </section>

        <Conteneur className="pt-6">
          {lignes.length === 0 ? (
            <Panneau className="apparition px-6 py-14 text-center">
              <p className="text-[18px] font-bold text-creme">
                {pasOuverte
                  ? ts(locale, 'l.ouvre-titre', { n: saison, d: formaterDateHeure(new Date(ouvertureSaison), locale) })
                  : ts(locale, 'l.vide-titre')}
              </p>
              <p className="mx-auto mt-1.5 max-w-[46ch] text-[14.5px] text-gris">
                {pasOuverte ? ts(locale, 'l.ouvre-texte', { c: euros(cashprize.total, locale) }) : ts(locale, 'l.vide-texte')}
              </p>
            </Panneau>
          ) : (
            <>
              {page === 1 && (
                <Podium
                  lignes={lignes.slice(0, 3)}
                  locale={locale}
                  grades={grades}
                  prix={vue === 'global' ? cashprize.podium.map((m) => euros(m, locale)) : null}
                />
              )}

              <div className="mt-6 mb-2 flex items-center justify-between text-[13px] text-gris">
                <span>{ts(locale, 'l.joueurs', { n: lignes.length })}</span>
                {pages > 1 && <Pagination page={page} pages={pages} locale={locale} href={(p) => chemin(saison, vue, p)} />}
              </div>

              <Tableau lignes={visibles} vue={vue} locale={locale} grades={grades} />

              {pages > 1 && (
                <div className="mt-4 flex justify-end">
                  <Pagination page={page} pages={pages} locale={locale} href={(p) => chemin(saison, vue, p)} />
                </div>
              )}
            </>
          )}
        </Conteneur>
      </main>
    </PagePublique>
  )
}

/* ================================================================ */

const RANGS = [
  { couleur: '#fdc003', libelle: '1' },
  { couleur: '#c9c3d4', libelle: '2' },
  { couleur: '#c08a4a', libelle: '3' },
]

function Podium({
  lignes,
  locale,
  grades,
  prix,
}: {
  lignes: LigneClassement[]
  locale: Locale
  grades: Map<string, Grade>
  prix: string[] | null
}) {
  return (
    <ol className="apparition-grille grid gap-3 sm:grid-cols-3">
      {[0, 1, 2].map((i) => {
        const j = lignes[i]
        const rang = RANGS[i]
        if (!j) {
          return (
            <li key={i} className="flex min-h-[132px] items-center justify-center rounded-[8px] border border-dashed border-bord text-[14px] text-gris">
              #{i + 1} · {ts(locale, 'c.place-libre')}
              {prix && <span className="ml-1.5 font-semibold text-or">{prix[i]}</span>}
            </li>
          )
        }
        return (
          <li key={j.uuid}>
            <Link
              href={lien(locale, cheminProfil(j.pseudo))}
              className="group relative flex h-full items-end gap-3 overflow-hidden rounded-[8px] border bg-charbon p-4 pt-5 transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-braise"
              style={{ borderColor: `${rang.couleur}55` }}
            >
              <span
                className={`pointer-events-none absolute inset-0 opacity-70 ${i === 0 ? 'lueur' : ''}`}
                style={{ background: `radial-gradient(80% 90% at 15% 100%, ${rang.couleur}${i === 0 ? '2e' : '1c'}, transparent 70%)` }}
                aria-hidden
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlCorps(j.pseudo, 180)}
                alt=""
                width={60}
                height={135}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="relative -mb-4 h-[112px] w-auto shrink-0 drop-shadow-[0_8px_14px_rgba(0,0,0,.5)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105"
              />
              <div className="relative min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-titre text-[22px] leading-none" style={{ color: rang.couleur }}>
                    #{rang.libelle}
                  </span>
                  {prix && (
                    <span className="rounded-[4px] bg-or/12 px-1.5 py-0.5 font-mono text-[11.5px] font-bold text-or">{prix[i]}</span>
                  )}
                </div>
                <div className="mt-2 flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[17px] font-bold text-creme group-hover:text-or">{j.pseudo}</span>
                  <BadgeGrade grade={grades.get(j.uuid)} />
                </div>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <Elo valeur={j.elo} etat={j.etatPalier} className="text-[22px]" anime />
                  <NomPalier elo={j.elo} etat={j.etatPalier} locale={locale} />
                </div>
                <div className="mt-1 text-[12.5px] text-gris">
                  <span className="text-vert">{j.victoires}</span> {ts(locale, 'c.v')} ·{' '}
                  <span className="text-rouge">{j.defaites}</span> {ts(locale, 'c.d')} · {j.winrate}%
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

function Tableau({
  lignes,
  vue,
  locale,
  grades,
}: {
  lignes: LigneClassement[]
  vue: Vue
  locale: Locale
  grades: Map<string, Grade>
}) {
  return (
    <Panneau className="apparition overflow-hidden">
      <table className="w-full table-fixed border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-bord text-left text-[11.5px] font-semibold uppercase tracking-[.08em] text-gris">
            <th className="w-12 py-2.5 pl-4 font-semibold sm:w-14">#</th>
            <th className="py-2.5 font-semibold">{ts(locale, 'c.joueur')}</th>
            <th className="w-[76px] py-2.5 pr-4 text-right font-semibold sm:pr-2 xl:w-[150px]">{ts(locale, 'c.elo')}</th>
            <th className="hidden w-[100px] py-2.5 text-right font-semibold sm:table-cell">{ts(locale, 'c.v')}/{ts(locale, 'c.d')}</th>
            <th className="hidden w-[150px] py-2.5 pl-5 font-semibold md:table-cell">{ts(locale, 'c.winrate')}</th>
            <th className="hidden w-[110px] py-2.5 text-right font-semibold lg:table-cell">{ts(locale, 'c.meilleure-serie')}</th>
            <th className={`hidden py-2.5 pr-4 pl-6 font-semibold lg:table-cell ${vue === 'global' ? 'w-[330px]' : 'w-[150px]'}`}>
              {vue === 'global' ? ts(locale, 'l.modes-joues') : ts(locale, 'c.forme')}
            </th>
          </tr>
        </thead>
        <tbody className="cascade cascade-defilement">
          {lignes.map((j) => (
            <tr key={j.uuid} className="border-b border-bord/60 transition-colors last:border-0 hover:bg-braise/60">
              <td className="py-2 pl-4 font-mono text-[13px] font-bold text-gris tabular-nums">
                <span style={j.rang <= 3 ? { color: RANGS[j.rang - 1].couleur } : undefined}>{j.rang}</span>
              </td>
              <td className="py-2">
                <Link href={lien(locale, cheminProfil(j.pseudo))} className="ligne-survol group flex min-w-0 items-center gap-2.5">
                  <Tete pseudo={j.pseudo} taille={26} />
                  <span className="truncate font-semibold text-creme group-hover:text-or">{j.pseudo}</span>
                  <BadgeGrade grade={grades.get(j.uuid)} />
                </Link>
              </td>
              <td className="py-2 pr-4 text-right whitespace-nowrap sm:pr-2">
                <Elo valeur={j.elo} etat={j.etatPalier} className="text-[15px]" />
                <NomPalier elo={j.elo} etat={j.etatPalier} locale={locale} className="ml-2 hidden xl:inline" />
              </td>
              <td className="hidden py-2 text-right font-mono text-[13px] whitespace-nowrap tabular-nums sm:table-cell">
                <span className="text-vert">{j.victoires}</span>
                <span className="text-gris"> / </span>
                <span className="text-rouge">{j.defaites}</span>
              </td>
              <td className="hidden py-2 pl-5 md:table-cell">
                <div className="flex items-center gap-2">
                  <BarreWinrate valeur={j.winrate} className="w-16" />
                  <span className="font-mono text-[12.5px] text-creme tabular-nums">{j.winrate}%</span>
                </div>
              </td>
              <td className="hidden py-2 text-right font-mono text-[13px] text-creme tabular-nums lg:table-cell">{j.recordSerie}</td>
              <td className="hidden py-2 pr-4 pl-6 lg:table-cell">
                {vue === 'global' ? (
                  <span className="flex flex-wrap gap-x-2.5 gap-y-1">
                    {j.modes.slice(0, 4).map((m) => (
                      <span key={m.mode} className="inline-flex items-center gap-1" title={infosMode(m.mode).nom}>
                        <IconeMode mode={m.mode} taille={14} />
                        <Elo valeur={m.elo} etat={m.etatPalier} className="text-[12px]" />
                      </span>
                    ))}
                  </span>
                ) : (
                  <Forme resultats={j.forme} locale={locale} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panneau>
  )
}

function Pagination({
  page,
  pages,
  locale,
  href,
}: {
  page: number
  pages: number
  locale: Locale
  href: (p: number) => string
}) {
  return (
    <nav className="flex items-center gap-1" aria-label="Pages">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={lien(locale, href(p))}
          aria-current={p === page ? 'page' : undefined}
          className={`grid size-8 place-items-center rounded-[5px] font-mono text-[12.5px] font-bold ${
            p === page ? 'bg-or/15 text-or' : 'text-gris hover:bg-braise hover:text-creme'
          }`}
        >
          {p}
        </Link>
      ))}
    </nav>
  )
}
