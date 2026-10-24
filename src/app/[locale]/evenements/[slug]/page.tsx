import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PagePublique } from '@/components/public/PagePublique'
import { Chiffre, Conteneur, LienJoueur, Panneau, Tete, TitreSection } from '@/components/s2/Briques'
import { BadgeStatut, nomEvenement } from '@/components/s2/Evenements'
import { RafraichirAuto } from '@/components/s2/RafraichirAuto'
import { type DetailEvenement, type LigneClassement, lireDetailEvenement } from '@/lib/evenements'
import { champ, estLocale, LANGUE_DEFAUT, lien, type Locale } from '@/lib/i18n'
import { dateEvenement, mmss, nomKit, place, te } from '@/lib/i18n-evenements'
import { IMAGE_OG } from '@/lib/site'

/**
 * LA PAGE D'UN ÉVÉNEMENT (24/10/2026) : podium, classement, le parcours du premier,
 * chaque manche et le barème. Gardée 20 s ; en direct, la page se relit toute seule.
 */
export const revalidate = 20

type Params = { params: Promise<{ locale: string; slug: string }> }

/** Aucune page au build : chacune est rendue à la première visite puis gardée 20 s (ISR). */
export function generateStaticParams() {
  return []
}

async function lire(slug: string): Promise<DetailEvenement | null> {
  try {
    return await lireDetailEvenement(decodeURIComponent(slug))
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: brut, slug } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const d = await lire(slug)
  if (!d) return { title: te(locale, 'meta.titre') }
  const titre = nomEvenement(locale, d.evenement)
  const description = `${dateEvenement(locale, d.evenement.debut)}${d.evenement.cashprize ? ` · ${te(locale, 'ev.cashprize')} ${d.evenement.cashprize}` : ''}`
  return { title: titre, description, openGraph: { title: titre, description, images: IMAGE_OG } }
}

const COULEURS_PODIUM = ['text-or', 'text-argent', 'text-bronze']
const BORDS_PODIUM = ['border-or/50', 'border-argent/40', 'border-bronze/40']

function Podium({ l, locale }: { l: LigneClassement[]; locale: Locale }) {
  // 2e, 1er, 3e : le premier au milieu, plus haut
  const ordre = [l[1], l[0], l[2]]
  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
      {ordre.map((x, i) => {
        if (!x) return <div key={i} />
        const r = x.rang - 1
        return (
          <Panneau key={x.uuid} className={`apparition flex flex-col items-center gap-2 px-2 py-4 text-center sm:px-4 ${BORDS_PODIUM[r]} ${r === 0 ? 'pb-7 sm:pb-9' : ''}`}>
            <span className={`text-[13px] font-extrabold ${COULEURS_PODIUM[r]}`}>{place(locale, x.rang)}</span>
            <Tete pseudo={x.pseudo} taille={r === 0 ? 64 : 48} className="rounded-[6px]" />
            <Link href={lien(locale, `/joueur/${encodeURIComponent(x.pseudo)}`)} className="max-w-full truncate text-[14px] font-bold text-creme hover:text-or sm:text-[16px]">
              {x.pseudo}
            </Link>
            <span className={`text-[20px] font-extrabold leading-none sm:text-[26px] ${COULEURS_PODIUM[r]}`}>
              {x.points} <span className="text-[12px] font-bold text-gris">{te(locale, 'ev.pts')}</span>
            </span>
            <span className="text-[12px] text-gris">
              {x.kills} kills · {te(locale, 'ev.victoires', { n: x.victoires })}
            </span>
          </Panneau>
        )
      })}
    </div>
  )
}

function PastilleManche({ place: p, kills }: { place: number; kills: number }) {
  const couleur = p === 1 ? 'bg-or/15 text-or' : p <= 3 ? 'bg-soupe/12 text-soupe' : 'bg-braise text-gris'
  return (
    <span className={`inline-flex h-[22px] min-w-[38px] items-center justify-center gap-0.5 rounded-[4px] px-1.5 font-mono text-[11px] font-bold ${couleur}`}>
      {p}
      <span className="font-normal opacity-70">/{kills}k</span>
    </span>
  )
}

export default async function PageEvenement({ params }: Params) {
  const { locale: brut, slug } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const d = await lire(slug)
  if (!d) notFound()
  const e = d.evenement
  const comptent = d.manches.filter((m) => !m.exclue)
  const premier = d.classement[0]
  const prix = champ(locale, e.prix, e.prixEn).split('\n').map((x) => x.trim()).filter(Boolean)
  const description = champ(locale, e.description, e.descriptionEn)
  const nbBareme = e.points.length
  const resumeBareme = e.points.slice(0, 5).join('/') + (nbBareme > 5 ? '/…' : '')

  return (
    <PagePublique locale={locale}>
      {d.statut === 'en-direct' && <RafraichirAuto />}
      <main className="pb-12">
        <section className="border-b border-bord bg-[radial-gradient(60%_120%_at_10%_0%,rgba(254,147,1,.12),transparent_70%)]">
          <Conteneur className="pt-8 pb-8 sm:pt-11">
            <Link href={lien(locale, '/evenements')} className="text-[13.5px] font-semibold text-gris hover:text-creme">
              ← {te(locale, 'ev.retour')}
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <BadgeStatut statut={d.statut} locale={locale} />
              <span className="rounded-full border border-bord px-2.5 py-[3px] text-[11.5px] font-semibold text-gris">{te(locale, 'jeu.hgrun')}</span>
            </div>
            <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <h1 className="entree text-[30px] leading-tight font-extrabold tracking-[-.02em] text-creme sm:text-[42px]">{nomEvenement(locale, e)}</h1>
                <p className="mt-1.5 text-[15px] text-gris first-letter:uppercase">
                  {dateEvenement(locale, e.debut)} → {dateEvenement(locale, e.fin, false)}
                </p>
                {description && <p className="mt-3 max-w-[680px] whitespace-pre-line text-[15px] text-creme/85">{description}</p>}
                <p className="mt-3 text-[13.5px] text-gris">
                  {d.statut === 'en-direct' ? te(locale, 'ev.direct-maj') : d.statut === 'a-venir' ? te(locale, 'ev.rejoindre') : null}
                </p>
              </div>
              {(e.cashprize || prix.length > 0) && (
                <Panneau className="w-full shrink-0 border-or/30 px-5 py-4 lg:w-[300px]">
                  <div className="text-[11.5px] font-medium uppercase tracking-[.08em] text-gris">{te(locale, 'ev.cashprize')}</div>
                  {e.cashprize && <div className="text-[34px] font-extrabold leading-tight text-or">{e.cashprize}</div>}
                  {prix.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1 text-[14px] text-creme/90">
                      {prix.map((p, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-or">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </Panneau>
              )}
            </div>
          </Conteneur>
        </section>

        <Conteneur className="flex flex-col gap-10 pt-8">
          <Panneau className="grid grid-cols-2 gap-5 px-5 py-4 sm:grid-cols-4">
            <Chiffre libelle={te(locale, 'ev.manches')}>{comptent.length}</Chiffre>
            <Chiffre libelle={te(locale, 'ev.joueurs')}>{d.joueurs}</Chiffre>
            <Chiffre libelle={te(locale, 'ev.kills')}>{d.killsTotal}</Chiffre>
            <Chiffre libelle={te(locale, 'ev.mvp')} sous={d.mvp ? `${d.mvp.kills} kills` : undefined}>
              {d.mvp ? d.mvp.pseudo : '—'}
            </Chiffre>
          </Panneau>

          {d.classement.length === 0 ? (
            <Panneau className="px-5 py-12 text-center text-[14.5px] text-gris">
              {d.statut === 'a-venir' ? te(locale, 'ev.avenir-texte') : te(locale, 'ev.aucune-manche')}
            </Panneau>
          ) : (
            <>
              <section>
                <TitreSection titre={te(locale, d.statut === 'termine' ? 'ev.podium' : 'ev.podium-provisoire')} />
                <Podium l={d.classement} locale={locale} />
              </section>

              <section>
                <TitreSection titre={te(locale, 'ev.classement')} sous={te(locale, 'ev.classement-sous')} />
                <Panneau className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-[14px]">
                    <thead className="border-b border-bord text-[11.5px] uppercase tracking-[.08em] text-gris">
                      <tr>
                        <th className="px-4 py-3 font-medium">#</th>
                        <th className="px-2 py-3 font-medium">{te(locale, 'ev.col.joueur')}</th>
                        <th className="px-2 py-3 text-right font-medium">{te(locale, 'ev.col.points')}</th>
                        <th className="px-2 py-3 text-right font-medium">{te(locale, 'ev.col.v')}</th>
                        <th className="px-2 py-3 text-right font-medium">{te(locale, 'ev.col.kills')}</th>
                        <th className="px-2 py-3 text-right font-medium">{te(locale, 'ev.col.meilleure')}</th>
                        <th className="px-2 py-3 text-right font-medium">{te(locale, 'ev.col.moyenne')}</th>
                        <th className="px-4 py-3 font-medium">{te(locale, 'ev.col.detail')}</th>
                      </tr>
                    </thead>
                    <tbody className="cascade">
                      {d.classement.map((x) => (
                        <tr key={x.uuid} className="border-b border-bord/60 last:border-0 hover:bg-braise/40">
                          <td className={`px-4 py-2.5 font-mono font-bold ${x.rang <= 3 ? COULEURS_PODIUM[x.rang - 1] : 'text-gris'}`}>{x.rang}</td>
                          <td className="max-w-[220px] px-2 py-2.5">
                            <LienJoueur pseudo={x.pseudo} locale={locale} />
                          </td>
                          <td className="px-2 py-2.5 text-right font-mono text-[15px] font-extrabold text-creme">{x.points}</td>
                          <td className="px-2 py-2.5 text-right font-mono text-creme/90">{x.victoires}</td>
                          <td className="px-2 py-2.5 text-right font-mono text-creme/90">{x.kills}</td>
                          <td className="px-2 py-2.5 text-right font-mono text-creme/90">{place(locale, x.meilleure)}</td>
                          <td className="px-2 py-2.5 text-right font-mono text-gris">{x.moyenne.toFixed(1)}</td>
                          <td className="px-4 py-2.5">
                            <span className="flex flex-wrap gap-1">
                              {comptent.map((m) => {
                                const r = x.parManche.find((p) => p.numero === m.numero)
                                return r ? (
                                  <PastilleManche key={m.id} place={r.place} kills={r.kills} />
                                ) : (
                                  <span key={m.id} className="inline-flex h-[22px] min-w-[38px] items-center justify-center rounded-[4px] bg-nuit font-mono text-[11px] text-gris/50">
                                    —
                                  </span>
                                )
                              })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panneau>
              </section>

              {premier && (
                <section>
                  <TitreSection titre={te(locale, d.statut === 'termine' ? 'ev.chemin' : 'ev.chemin-direct', { p: premier.pseudo })} />
                  <div className="cascade grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {premier.parManche.map((r) => (
                      <Panneau key={r.numero} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="text-[12px] font-semibold uppercase tracking-[.08em] text-gris">{te(locale, 'ev.manche', { n: r.numero })}</div>
                          <div className="mt-0.5 truncate text-[15px] text-creme">
                            {te(locale, 'ev.manche-ligne', { place: place(locale, r.place), kills: r.kills, kit: nomKit(locale, r.kit) })}
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-[18px] font-extrabold text-or">+{r.points}</span>
                      </Panneau>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <TitreSection titre={te(locale, 'ev.manches-titre')} sous={te(locale, 'ev.manches-sous')} />
                <div className="flex flex-col gap-3">
                  {comptent.map((m) => {
                    const gagnant = m.lignes.find((l) => l.place === 1)
                    const topKills = [...m.lignes].sort((a, b) => b.kills - a.kills)[0]
                    return (
                      <Panneau key={m.id} as="article" className="overflow-hidden">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3.5">
                          <span className="rounded-[5px] bg-soupe/12 px-2.5 py-1 text-[13px] font-extrabold text-soupe">{te(locale, 'ev.manche', { n: m.numero })}</span>
                          {gagnant && (
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="text-[12px] uppercase tracking-[.08em] text-gris">{te(locale, 'ev.gagnant-manche')}</span>
                              <LienJoueur pseudo={gagnant.pseudo} locale={locale} taille={20} />
                              <span className="text-[13px] text-gris">
                                {nomKit(locale, gagnant.kit)} · {gagnant.kills} kills
                              </span>
                            </span>
                          )}
                          {topKills && topKills.kills > 0 && (
                            <span className="text-[13px] text-gris">
                              {te(locale, 'ev.top-kills')} : <span className="font-semibold text-creme">{topKills.pseudo}</span> ({topKills.kills})
                            </span>
                          )}
                          <span className="text-[13px] text-gris sm:ml-auto">
                            {te(locale, 'ev.duree')} {mmss(m.duree)} · {m.lignes.length} {te(locale, 'ev.joueurs').toLowerCase()} · {dateEvenement(locale, m.instant, false)}
                          </span>
                        </div>
                        <details className="group border-t border-bord/70">
                          <summary className="cursor-pointer list-none px-4 py-2.5 text-[13px] font-semibold text-or hover:text-soupe">
                            {te(locale, 'ev.details')} <span className="inline-block transition-transform group-open:rotate-90">›</span>
                          </summary>
                          <div className="overflow-x-auto px-4 pb-3">
                            <table className="w-full min-w-[480px] text-left text-[13.5px]">
                              <thead className="text-[11px] uppercase tracking-[.08em] text-gris">
                                <tr>
                                  <th className="py-1.5 pr-2 font-medium">{te(locale, 'ev.col.place')}</th>
                                  <th className="py-1.5 pr-2 font-medium">{te(locale, 'ev.col.joueur')}</th>
                                  <th className="py-1.5 pr-2 font-medium">{te(locale, 'ev.col.kit')}</th>
                                  <th className="py-1.5 pr-2 text-right font-medium">{te(locale, 'ev.col.kills')}</th>
                                  <th className="py-1.5 text-right font-medium">{te(locale, 'ev.col.points')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {m.lignes.map((l) => (
                                  <tr key={l.uuid} className="border-t border-bord/50">
                                    <td className="py-1.5 pr-2 font-mono text-gris">{l.place}</td>
                                    <td className="max-w-[200px] py-1.5 pr-2">
                                      <LienJoueur pseudo={l.pseudo} locale={locale} taille={18} gras={false} />
                                    </td>
                                    <td className="py-1.5 pr-2 text-gris">{nomKit(locale, l.kit)}</td>
                                    <td className="py-1.5 pr-2 text-right font-mono text-creme/90">{l.kills}</td>
                                    <td className="py-1.5 text-right font-mono font-bold text-creme">+{l.points}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      </Panneau>
                    )
                  })}
                </div>
              </section>
            </>
          )}

          <section>
            <TitreSection titre={te(locale, 'ev.bareme')} />
            <Panneau className="px-5 py-4 text-[14px] text-creme/85">
              {te(locale, 'ev.bareme-texte', { places: resumeBareme, n: nbBareme, k: e.pointsKill })}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {e.points.map((p, i) => (
                  <span key={i} className="rounded-[4px] bg-braise px-2 py-1 font-mono text-[12px] text-gris">
                    {place(locale, i + 1)} <span className="font-bold text-creme">{p}</span>
                  </span>
                ))}
                <span className="rounded-[4px] bg-soupe/12 px-2 py-1 font-mono text-[12px] text-soupe">kill +{e.pointsKill}</span>
              </div>
            </Panneau>
          </section>
        </Conteneur>
      </main>
    </PagePublique>
  )
}
