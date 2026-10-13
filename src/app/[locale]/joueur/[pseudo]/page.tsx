import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CourbeModes } from '@/components/practice/CourbeModes'
import { HistoriqueMatchs } from '@/components/practice/HistoriqueMatchs'
import {
  AnneauWinrate,
  BadgePalier,
  BarreWinrate,
  couleurWinrate,
  FormeRecente,
  PastilleMode,
  TuileStat,
} from '@/components/practice/Petits'
import { RechercheJoueur } from '@/components/practice/RechercheJoueur'
import { SelecteurSaison } from '@/components/practice/SelecteurSaison'
import { Sanctions } from '@/components/practice/Sanctions'
import { Skin3D } from '@/components/practice/Skin3D'
import { PagePublique } from '@/components/public/PagePublique'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { Section } from '@/components/ui/Section'
import { formaterDate } from '@/lib/format'
import { estLocale, LANGUE_DEFAUT, lien, t, type Locale } from '@/lib/i18n'
import { nomPalier, palierDe, PALIERS, progressionPalier, resteAvantSuivant } from '@/lib/paliers'
import { lireArchiveJoueur, lireProfil, saisonsDuJoueur, type ArchiveJoueur, type Profil, type Rival } from '@/lib/practice'
import { choisirSaison, lireSaisonsCache } from '@/lib/saisons'
import { lireSanctions, nombreActives } from '@/lib/sanctions'
import { cheminProfil, cleRaison, formaterDuree, formaterTempsJeu, infosMode, MODES, tempsRelatif, urlTete } from '@/lib/practice-commun'
import { IMAGE_OG } from '@/lib/site'

/**
 * LE PROFIL RANKED D'UN JOUEUR (16/09/2026).
 *
 * Tout ce que l'historique permet de dire : Elo global et par mode, rangs,
 * winrate, forme, progression match après match, records, rivalités et chaque
 * match de la saison. Rendu à la demande puis gardé 30 secondes : la plupart
 * des fiches ne sont jamais consultées, inutile de les générer au build.
 */
export const revalidate = 30

type Params = { params: Promise<{ pseudo: string; locale: string }>; searchParams: Promise<{ saison?: string }> }

/** Au plus autant de matchs dans l'historique affiché (voir HISTORIQUE_MAX de practice.ts). */
const HISTORIQUE_AFFICHE = 80

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { pseudo, locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const propre = decodeURIComponent(pseudo)
  return {
    title: t(locale, 'pr.profil-meta-titre').replace('{p}', propre),
    description: t(locale, 'pr.profil-meta-desc').replace('{p}', propre),
    alternates: { canonical: lien(locale, cheminProfil(propre)) },
    openGraph: {
      type: 'profile',
      title: `${propre} — LJKITS`,
      description: t(locale, 'pr.profil-meta-desc').replace('{p}', propre),
      images: IMAGE_OG,
    },
  }
}

export default async function PageJoueur({ params, searchParams }: Params) {
  const { pseudo, locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const { saison: saisonDemandee } = await searchParams
  const recherche = decodeURIComponent(pseudo)

  const saisons = await lireSaisonsCache()
  const saison = choisirSaison(saisons, saisonDemandee)
  if (!saison) notFound()
  const profil = await lireProfil(saison.id, recherche)
  const hrefPour = (id: number) => lien(locale, `${cheminProfil(profil?.pseudo ?? recherche)}?saison=${id}`)

  // Pas de ranked dans CETTE saison, mais connu ailleurs : on le dit, avec le choix de la saison.
  if (!profil) {
    const autres = await saisonsDuJoueur(recherche)
    if (autres.length === 0) notFound()
    return (
      <PagePublique locale={locale}>
        <header className="halo-hero relative py-[clamp(44px,6vw,84px)]">
          <Enveloppe>
            <h1 className="text-h1 font-titre break-all">{t(locale, 'pf.titre').replace('{p}', recherche)}</h1>
            <p className="mt-4 max-w-[62ch] text-[16px] text-gris">
              {t(locale, 'pf.pas-cette-saison').replace('{p}', recherche).replace('{n}', String(saison.id))}
            </p>
            <div className="mt-6">
              <SelecteurSaison saisons={saisons.filter((x) => autres.includes(x.id) || x.id === saison.id)} actuelle={saison} hrefPour={hrefPour} locale={locale} />
            </div>
          </Enveloppe>
        </header>
      </PagePublique>
    )
  }

  const [sanctions, archive] = await Promise.all([lireSanctions(profil.uuid), lireArchiveJoueur(saison.id, profil.uuid)])

  const { global, records, rivaux } = profil
  const eloPrincipal = global?.elo ?? profil.modes[0]?.elo ?? 1000
  const palier = palierDe(eloPrincipal)
  const suivant = resteAvantSuivant(eloPrincipal)
  const progression = progressionPalier(eloPrincipal)
  const matchsTotaux = global?.matchs ?? profil.totaux.matchs

  const pic = Math.max(1, ...profil.activite.map((a) => a.matchs))

  return (
    <PagePublique locale={locale}>
      {/* ══════════════════════════ EN-TÊTE ══════════════════════════ */}
      <header className="relative overflow-hidden pt-[clamp(28px,4vw,56px)] pb-[clamp(32px,4vw,56px)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(60% 70% at 22% 45%, ${palier.couleur}26, transparent 70%), radial-gradient(40% 60% at 90% 10%, ${palier.couleur}12, transparent 70%)`,
          }}
        />
        <Enveloppe className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={lien(locale, `/classement?saison=${saison.id}`)}
              className="font-mono text-[11px] tracking-[.12em] text-gris uppercase transition-colors hover:text-or"
            >
              {t(locale, 'pr.retour')}
            </Link>
            <div className="relative z-30 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <SelecteurSaison saisons={saisons} actuelle={saison} hrefPour={hrefPour} locale={locale} />
              <RechercheJoueur locale={locale} className="w-full sm:w-[340px]" />
            </div>
          </div>

          {/* Comme PvPRivals : « X's Profile » et une ligne d'accroche, avant la carte du joueur. */}
          <p className="mt-8 font-titre text-[clamp(22px,2.6vw,30px)]">{t(locale, 'pf.titre').replace('{p}', profil.pseudo)}</p>
          <p className="mt-1 text-[15px] text-gris">{t(locale, 'pf.chapeau')}</p>

          <div className="mt-6 grid items-center gap-[clamp(20px,4vw,56px)] lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
            <div className="relative">
              <Skin3D
                pseudo={profil.pseudo}
                alt={t(locale, 'pr.skin-alt').replace('{p}', profil.pseudo)}
                pose="combat"
                halo={palier.couleur}
                className="mx-auto h-[360px] w-full max-w-[430px] sm:h-[440px]"
              />
              <p className="mt-1 text-center font-mono text-[10px] tracking-[.14em] text-gris/80 uppercase">
                ↻ {t(locale, 'pr.glisser')}
              </p>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <BadgePalier elo={eloPrincipal} locale={locale} />
                {profil.exclu && (
                  <span className="rounded-micro border border-oni/50 bg-oni/10 px-2 py-[3px] font-mono text-[11px] tracking-[.1em] text-oni uppercase">
                    {t(locale, 'pr.exclu')}
                  </span>
                )}
                {profil.discordLie && (
                  <span className="rounded-micro border border-discord/50 bg-discord/10 px-2 py-[3px] font-mono text-[11px] tracking-[.1em] text-[#8e98ff] uppercase">
                    ✓ {t(locale, 'pr.discord-lie')}
                  </span>
                )}
              </div>

              <h1 className="text-h1 mt-3 font-titre break-all">{profil.pseudo}</h1>

              <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-4">
                <div>
                  <p className="font-mono text-[10.5px] tracking-[.16em] text-gris uppercase">Elo · {t(locale, 'pr.global')}</p>
                  <p className="font-titre text-[clamp(52px,7vw,84px)] leading-[.9] tabular-nums" style={{ color: palier.couleur, textShadow: `0 0 38px ${palier.couleur}55` }}>
                    {eloPrincipal}
                  </p>
                </div>
                <div className="pb-2">
                  <p className="font-mono text-[10.5px] tracking-[.16em] text-gris uppercase">{t(locale, 'pr.rang-global')}</p>
                  <p className="font-titre text-[clamp(28px,3.4vw,40px)] leading-none">
                    {global && global.rang > 0 ? (
                      <>
                        <span className={global.rang <= 3 ? 'text-or' : ''}>#{global.rang}</span>
                        <span className="ml-2 font-mono text-[13px] text-gris">
                          {t(locale, 'pr.sur')} {global.total}
                        </span>
                      </>
                    ) : (
                      <span className="text-gris">{t(locale, 'pr.non-classe')}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* La jauge vers le palier suivant, dans les deux couleurs. */}
              <div className="mt-5 max-w-[560px]">
                <div className="h-2.5 overflow-hidden rounded-full bg-bord">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(progression * 100)}%`,
                      background: suivant ? `linear-gradient(90deg, ${palier.couleur}, ${suivant.palier.couleur})` : palier.couleur,
                    }}
                  />
                </div>
                <p className="mt-2 font-mono text-[12px] text-gris">
                  {suivant ? (
                    <>
                      {t(locale, 'pr.palier-suivant')
                        .replace('{n}', String(suivant.reste))
                        .split('{p}')
                        .map((morceau, i) =>
                          i === 0 ? (
                            morceau
                          ) : (
                            <span key={i}>
                              <span style={{ color: suivant.palier.couleur }}>{nomPalier(suivant.palier, locale)}</span>
                              {morceau}
                            </span>
                          ),
                        )}
                    </>
                  ) : (
                    t(locale, 'pr.palier-max')
                  )}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-5">
                <AnneauWinrate valeur={global?.winrate ?? profil.totaux.winrate} libelle={t(locale, 'pr.winrate')} />
                <div className="grid flex-1 basis-[300px] grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <TuileStat libelle={t(locale, 'pr.matchs')} valeur={matchsTotaux} />
                  <TuileStat libelle={t(locale, 'pr.victoires')} valeur={global?.victoires ?? profil.totaux.victoires} couleur="var(--color-vert)" />
                  <TuileStat libelle={t(locale, 'pr.defaites')} valeur={global?.defaites ?? profil.totaux.defaites} couleur="var(--color-rouge)" />
                  <TuileStat
                    libelle={t(locale, 'pr.elo-max')}
                    valeur={global?.eloMax ?? eloPrincipal}
                    couleur={palierDe(global?.eloMax ?? eloPrincipal).couleur}
                  />
                  <TuileStat libelle={t(locale, 'pr.serie')} valeur={global?.serie ? `🔥 ${global.serie}` : '0'} couleur={global?.serie ? 'var(--color-soupe)' : undefined} />
                  <TuileStat libelle={t(locale, 'pr.meilleure-serie')} valeur={global?.recordSerie ?? 0} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="font-mono text-[10.5px] tracking-[.16em] text-gris uppercase">{t(locale, 'pr.forme')}</span>
                <FormeRecente forme={profil.forme} locale={locale} />
              </div>

              {/* Les repères de la carte joueur PvPRivals (rang, première et dernière apparition), avec nos mots. */}
              <dl className="mt-5 grid max-w-[560px] grid-cols-2 gap-x-6 gap-y-2.5 border-t border-bord pt-4 font-mono text-[12.5px] sm:grid-cols-4">
                <div>
                  <dt className="text-[9.5px] tracking-[.14em] text-gris uppercase">{t(locale, 'pf.palier')}</dt>
                  <dd className="mt-1" style={{ color: palier.couleur }}>{nomPalier(palier, locale)}</dd>
                </div>
                <div>
                  <dt className="text-[9.5px] tracking-[.14em] text-gris uppercase">{t(locale, 'pf.position')}</dt>
                  <dd className="mt-1">{global && global.rang > 0 ? `#${global.rang}` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-[9.5px] tracking-[.14em] text-gris uppercase">{t(locale, 'pf.premier')}</dt>
                  <dd className="mt-1">{records.premier ? formaterDate(records.premier, locale) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-[9.5px] tracking-[.14em] text-gris uppercase">{t(locale, 'pf.dernier')}</dt>
                  <dd className="mt-1">{records.dernier ? tempsRelatif(records.dernier, locale) : '—'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Enveloppe>
      </header>

      {/* ══════════════════════════ PROGRESSION ══════════════════════════ */}
      <Section etiquette={t(locale, 'pr.progression-etiquette')} titre={t(locale, 'pf.progression')}>
        <CourbeModes
          locale={locale}
          courbes={profil.courbes.map((c) => ({
            mode: c.mode,
            points: c.points.map((p) => ({ instant: p.instant.toISOString(), elo: p.elo })),
          }))}
          seuils={PALIERS.map((p) => ({ minimum: p.minimum, couleur: p.couleur, nom: nomPalier(p, locale) }))}
        />

      </Section>

      {/* ══════════════════════════ STATISTIQUES (ordre PvPRivals) ══════════════════════════ */}
      <Section fond="charbon" etiquette={t(locale, 'pf.statistiques')} titre={t(locale, 'pf.statistiques')}>
        <TableauStatistiques profil={profil} locale={locale} />
      </Section>

      {/* ══════════════════════════ HISTORIQUE ══════════════════════════ */}
      <Section fond="charbon" etiquette={t(locale, 'pr.historique-etiquette')} titre={t(locale, 'pf.historique')}>
        <HistoriqueMatchs
          locale={locale}
          limite={HISTORIQUE_AFFICHE}
          pseudo={profil.pseudo}
          matchs={profil.historique.map((m) => ({ ...m, instant: m.instant.toISOString() }))}
        />
      </Section>

      {/* ══════════════════════════ ACTIVITÉ ══════════════════════════ */}
      <Section etiquette={t(locale, 'pf.en-plus')} titre={t(locale, 'pr.activite')}>
        <div className="rounded-carte border border-bord bg-charbon p-5">
          <p className="font-mono text-[10.5px] tracking-[.16em] text-gris uppercase">{t(locale, 'pr.activite')}</p>
          <div className="mt-4 flex h-24 items-end gap-1.5">
            {profil.activite.map((jour) => (
              <div
                key={jour.jour}
                className="group relative flex-1"
                title={t(locale, 'pr.matchs-le')
                  .replace('{n}', String(jour.matchs))
                  .replace('{d}', new Date(`${jour.jour}T12:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short' }))}
              >
                <div
                  className="w-full rounded-t-micro transition-opacity group-hover:opacity-80"
                  style={{
                    height: `${Math.max(4, (jour.matchs / pic) * 96)}px`,
                    background: jour.matchs > 0 ? palier.couleur : 'var(--color-bord)',
                    opacity: jour.matchs > 0 ? 0.35 + 0.65 * (jour.matchs / pic) : 1,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-gris">
            <span>{new Date(`${profil.activite[0].jour}T12:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>
            <span>{new Date(`${profil.activite[profil.activite.length - 1].jour}T12:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════ PAR MODE ══════════════════════════ */}
      <Section fond="charbon" etiquette={t(locale, 'pr.modes-etiquette')} titre={t(locale, 'pr.modes-titre')}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {MODES.map((mode) => {
            const stats = profil.modes.find((m) => m.mode === mode.id)
            if (!stats) {
              return (
                <div key={mode.id} className="flex flex-col justify-between rounded-bloc border border-dashed border-bord p-5">
                  <PastilleMode mode={mode.id} />
                  <p className="mt-8 font-mono text-[12px] text-gris">{t(locale, 'pr.pas-joue')}</p>
                </div>
              )
            }
            const couleur = palierDe(stats.elo).couleur
            return (
              <Link
                key={mode.id}
                href={lien(locale, `/classement?mode=${mode.id}`)}
                className="group relative overflow-hidden rounded-bloc border border-bord bg-braise p-5 transition hover:-translate-y-0.5 hover:border-gris/50"
              >
                <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: mode.couleur }} />
                <div className="flex items-center justify-between gap-3">
                  <PastilleMode mode={mode.id} />
                  <span className="font-mono text-[12px] text-gris">
                    {stats.rang > 0 ? (
                      <>
                        <span className={stats.rang <= 3 ? 'font-bold text-or' : 'text-creme'}>#{stats.rang}</span> {t(locale, 'pr.sur')} {stats.total}
                      </>
                    ) : (
                      t(locale, 'pr.non-classe')
                    )}
                  </span>
                </div>
                <p className="mt-4 font-titre text-[44px] leading-none tabular-nums" style={{ color: couleur }}>
                  {stats.elo}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <BadgePalier elo={stats.elo} locale={locale} petit />
                  <span className="font-mono text-[10.5px] text-gris">
                    {t(locale, 'pr.elo-max')} <span style={{ color: palierDe(stats.eloMax).couleur }}>{stats.eloMax}</span>
                  </span>
                </div>
                <BarreWinrate valeur={stats.winrate} className="mt-4" />
                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-bord pt-3.5 font-mono text-[12px]">
                  <div>
                    <dt className="text-[9.5px] tracking-[.12em] text-gris uppercase">{t(locale, 'pr.matchs')}</dt>
                    <dd className="mt-1 tabular-nums">{stats.matchs}</dd>
                  </div>
                  <div>
                    <dt className="text-[9.5px] tracking-[.12em] text-gris uppercase">{t(locale, 'pr.col-bilan')}</dt>
                    <dd className="mt-1 tabular-nums">
                      <span className="text-vert">{stats.victoires}</span>–<span className="text-rouge">{stats.defaites}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9.5px] tracking-[.12em] text-gris uppercase">{t(locale, 'pr.col-serie')}</dt>
                    <dd className="mt-1 tabular-nums">
                      {stats.serie > 0 ? <span className="text-soupe">🔥{stats.serie}</span> : '0'}
                      <span className="text-gris"> / {stats.recordSerie}</span>
                    </dd>
                  </div>
                </dl>
              </Link>
            )
          })}
        </div>
      </Section>

      {/* ══════════════════════════ RECORDS ══════════════════════════ */}
      <Section fond="charbon" etiquette={t(locale, 'pr.records-etiquette')} titre={t(locale, 'pr.records-titre')}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TuileStat
            libelle={t(locale, 'pr.rec-rapide')}
            valeur={records.plusRapide ? `⚡ ${formaterDuree(records.plusRapide.duree)}` : '—'}
            couleur="var(--color-or)"
            detail={records.plusRapide && `${t(locale, 'pr.contre')} ${records.plusRapide.adversaire} · ${infosMode(records.plusRapide.mode).nom}`}
          />
          <TuileStat
            libelle={t(locale, 'pr.rec-gain')}
            valeur={records.plusGrosGain ? `+${records.plusGrosGain.gain}` : '—'}
            couleur="var(--color-vert)"
            detail={records.plusGrosGain && `${t(locale, 'pr.contre')} ${records.plusGrosGain.adversaire} · ${infosMode(records.plusGrosGain.mode).nom}`}
          />
          <TuileStat
            libelle={t(locale, 'pr.rec-perte')}
            valeur={records.plusGrossePerte ? `−${records.plusGrossePerte.perte}` : '—'}
            couleur="var(--color-rouge)"
            detail={records.plusGrossePerte && `${t(locale, 'pr.contre')} ${records.plusGrossePerte.adversaire} · ${infosMode(records.plusGrossePerte.mode).nom}`}
          />
          <TuileStat libelle={t(locale, 'pr.rec-duree')} valeur={records.dureeMoyenne != null ? `⏱ ${formaterDuree(records.dureeMoyenne)}` : '—'} />
          <TuileStat libelle={t(locale, 'pr.rec-clutch')} valeur={`♥ ${records.clutchs}`} couleur="var(--color-oni)" detail={t(locale, 'pr.rec-clutch-aide')} />
          <TuileStat libelle={t(locale, 'pr.rec-parfait')} valeur={`✦ ${records.parfaites}`} couleur="var(--color-violet)" detail={t(locale, 'pr.rec-parfait-aide')} />
          <TuileStat
            libelle={t(locale, 'pr.rec-favori')}
            valeur={records.modeFavori ? infosMode(records.modeFavori).nom : '—'}
            couleur={records.modeFavori ? infosMode(records.modeFavori).couleur : undefined}
          />
          <TuileStat
            libelle={t(locale, 'pr.rec-premier')}
            valeur={records.premier ? formaterDate(records.premier, locale) : '—'}
            detail={records.dernier && `${t(locale, 'pr.rec-dernier')} · ${tempsRelatif(records.dernier, locale)}`}
            className="[&>p:nth-child(2)]:text-[clamp(15px,1.8vw,19px)]"
          />
        </div>

        {records.raisons.length > 0 && (
          <div className="mt-4 rounded-carte border border-bord bg-braise p-5">
            <p className="font-mono text-[10.5px] tracking-[.16em] text-gris uppercase">{t(locale, 'pr.issues')}</p>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {records.raisons.map((r) => {
                const total = r.victoires + r.defaites
                return (
                  <li key={r.raison} className="grid grid-cols-[130px_minmax(0,1fr)_64px] items-center gap-3 font-mono text-[12px]">
                    <span className="text-creme">{t(locale, cleRaison(r.raison))}</span>
                    <span className="flex h-2 overflow-hidden rounded-full bg-bord" aria-hidden>
                      <span className="bg-vert" style={{ width: `${(r.victoires / total) * 100}%` }} />
                      <span className="bg-rouge" style={{ width: `${(r.defaites / total) * 100}%` }} />
                    </span>
                    <span className="text-right tabular-nums">
                      <span className="text-vert">{r.victoires}</span>–<span className="text-rouge">{r.defaites}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </Section>

      {/* ══════════════════════════ RIVALITÉS ══════════════════════════ */}
      <Section etiquette={t(locale, 'pr.rivalites-etiquette')} titre={t(locale, 'pr.rivalites-titre')}>
        {rivaux.faceAFace.length === 0 ? (
          <p className="rounded-carte border border-dashed border-bord px-6 py-12 text-center font-mono text-[13px] text-gris">
            {t(locale, 'pr.aucun-rival')}
          </p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <CarteRival rival={rivaux.nemesis} titre={t(locale, 'pr.nemesis')} aide={t(locale, 'pr.nemesis-aide')} ton="oni" locale={locale} />
              <CarteRival rival={rivaux.victime} titre={t(locale, 'pr.victime')} aide={t(locale, 'pr.victime-aide')} ton="vert" locale={locale} />
            </div>

            <div className="mt-4 overflow-hidden rounded-carte border border-bord bg-charbon">
              <p className="border-b border-bord bg-nuit px-5 py-3 font-mono text-[10.5px] tracking-[.16em] text-gris uppercase">
                {t(locale, 'pr.face-a-face')}
              </p>
              <ol>
                {rivaux.faceAFace.map((r) => {
                  const winrate = Math.round((r.victoires * 100) / r.matchs)
                  return (
                    <li key={r.uuid} className="border-b border-bord last:border-b-0">
                      <Link
                        href={lien(locale, cheminProfil(r.pseudo))}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 transition-colors hover:bg-braise sm:grid-cols-[minmax(0,1fr)_70px_90px_minmax(0,180px)_110px]"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={urlTete(r.pseudo, 40)} alt="" width={30} height={30} loading="lazy" className="rounded-micro [image-rendering:pixelated]" />
                          <span className="truncate font-semibold">{r.pseudo}</span>
                        </span>
                        <span className="hidden font-mono text-[12px] text-gris sm:block">
                          {r.matchs} {t(locale, 'pr.matchs').toLowerCase()}
                        </span>
                        <span className="text-right font-mono text-[13px] tabular-nums sm:text-center">
                          <span className="text-vert">{r.victoires}</span> – <span className="text-rouge">{r.defaites}</span>
                        </span>
                        <BarreWinrate valeur={winrate} className="hidden sm:flex" />
                        <span className="hidden text-right font-mono text-[11px] text-gris sm:block">{tempsRelatif(r.dernier, locale)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </div>
          </>
        )}
      </Section>

      {/* ══════════════════════════ ARCHIVE DE SAISON (FFA + unranked) ══════════════════════════ */}
      {archive && (
        <Section
          fond="charbon"
          etiquette={t(locale, 'pf.archive-etiquette').replace('{n}', String(saison.id))}
          titre={t(locale, 'pf.archive-titre')}
          chapeau={t(locale, 'pf.archive-chapeau')}
        >
          <BlocArchive archive={archive} locale={locale} />
        </Section>
      )}

      {/* ══════════════════════════ SANCTIONS ══════════════════════════ */}
      <Section
        etiquette={t(locale, 'pr.sanctions-etiquette')}
        titre={t(locale, 'pr.sanctions-titre')}
        chapeau={
          nombreActives(sanctions) > 0
            ? t(locale, 'pr.sanctions-actives').replace('{n}', String(nombreActives(sanctions)))
            : undefined
        }
      >
        <Sanctions sanctions={sanctions} locale={locale} pseudo={profil.pseudo} />
      </Section>
    </PagePublique>
  )
}

/** Némésis ou victime préférée : le rival, son skin, et le score entre eux. */
function CarteRival({
  rival,
  titre,
  aide,
  ton,
  locale,
}: {
  rival: Rival | null
  titre: string
  aide: string
  ton: 'oni' | 'vert'
  locale: Locale
}) {
  const accent = ton === 'oni' ? 'var(--color-oni)' : 'var(--color-vert)'
  if (!rival) {
    return (
      <div className="rounded-bloc border border-dashed border-bord p-6">
        <p className="font-titre text-[20px]" style={{ color: accent }}>
          {titre}
        </p>
        <p className="mt-2 font-mono text-[12px] text-gris">—</p>
      </div>
    )
  }
  const winrate = Math.round((rival.victoires * 100) / rival.matchs)
  return (
    <Link
      href={lien(locale, cheminProfil(rival.pseudo))}
      className="group relative grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 overflow-hidden rounded-bloc border bg-braise p-4 pr-6 transition hover:-translate-y-0.5"
      style={{ borderColor: `color-mix(in oklab, ${accent} 40%, transparent)` }}
    >
      <Skin3D
        pseudo={rival.pseudo}
        alt={t(locale, 'pr.skin-alt').replace('{p}', rival.pseudo)}
        pose={ton === 'oni' ? 'combat' : 'repos'}
        halo={ton === 'oni' ? '#e92813' : '#5be06b'}
        interactif={false}
        className="h-[170px] w-[120px]"
      />
      <div className="min-w-0">
        <p className="font-titre text-[20px] leading-none" style={{ color: accent }}>
          {titre}
        </p>
        <p className="mt-1.5 text-[12.5px] text-gris">{aide}</p>
        <p className="mt-3 truncate font-titre text-[26px] leading-none transition-colors group-hover:text-or">{rival.pseudo}</p>
        <p className="mt-2.5 font-mono text-[13px] tabular-nums">
          <span className="text-vert">{rival.victoires}V</span>
          <span className="text-gris"> · </span>
          <span className="text-rouge">{rival.defaites}D</span>
          <span className="text-gris"> · </span>
          <span style={{ color: couleurWinrate(winrate) }}>{winrate}%</span>
        </p>
      </div>
    </Link>
  )
}

/**
 * LE TABLEAU « STATISTICS » DE PVPRIVALS (12/10/2026) : une ligne Global puis
 * une par mode, mêmes colonnes que chez eux (mode, #, Elo, Elo max, matchs,
 * victoires, winrate, série, meilleure série, temps de jeu). Un mode jamais joué
 * reste dans la liste, avec des tirets.
 */
function TableauStatistiques({ profil, locale }: { profil: Profil; locale: Locale }) {
  const g = profil.global
  const lignes = [
    {
      cle: 'global',
      nom: t(locale, 'pr.global'),
      couleur: undefined as string | undefined,
      rang: g && g.rang > 0 ? g.rang : null,
      elo: g?.elo ?? null,
      eloMax: g?.eloMax ?? null,
      matchs: g?.matchs ?? profil.totaux.matchs,
      victoires: g?.victoires ?? profil.totaux.victoires,
      winrate: g?.winrate ?? profil.totaux.winrate,
      serie: g?.serie ?? 0,
      recordSerie: g?.recordSerie ?? 0,
      temps: profil.temps.total,
    },
    ...MODES.map((m) => {
      const x = profil.modes.find((y) => y.mode === m.id)
      return {
        cle: m.id,
        nom: m.nom,
        couleur: m.couleur,
        rang: x && x.rang > 0 ? x.rang : null,
        elo: x?.elo ?? null,
        eloMax: x?.eloMax ?? null,
        matchs: x?.matchs ?? 0,
        victoires: x?.victoires ?? 0,
        winrate: x?.winrate ?? 0,
        serie: x?.serie ?? 0,
        recordSerie: x?.recordSerie ?? 0,
        temps: profil.temps.parMode[m.id] ?? 0,
      }
    }),
  ]
  const th = 'px-3 py-3 font-mono text-[10.5px] font-bold tracking-[.12em] text-gris uppercase'
  return (
    <div className="overflow-x-auto rounded-carte border border-bord bg-braise">
      <table className="w-full min-w-[860px] border-collapse text-left">
        <thead className="bg-nuit">
          <tr>
            <th scope="col" className={`${th} pl-5`}>{t(locale, 'lb.col-mode')}</th>
            <th scope="col" className={`${th} text-right`}>#</th>
            <th scope="col" className={`${th} text-right`}>{t(locale, 'lb.col-rating')}</th>
            <th scope="col" className={`${th} text-right`}>{t(locale, 'lb.col-pic')}</th>
            <th scope="col" className={`${th} text-right`}>{t(locale, 'lb.col-matchs')}</th>
            <th scope="col" className={`${th} text-right`}>{t(locale, 'lb.col-victoires')}</th>
            <th scope="col" className={`${th} text-right`}>{t(locale, 'lb.col-winrate')}</th>
            <th scope="col" className={`${th} text-right`}>{t(locale, 'lb.col-serie')}</th>
            <th scope="col" className={`${th} text-right`}>{t(locale, 'lb.col-meilleure')}</th>
            <th scope="col" className={`${th} pr-5 text-right`}>{t(locale, 'lb.col-temps')}</th>
          </tr>
        </thead>
        <tbody className="font-mono text-[13px] tabular-nums">
          {lignes.map((l) => (
            <tr key={l.cle} className={`border-t border-bord ${l.cle === 'global' ? 'bg-charbon/60' : ''}`}>
              <td className="py-3 pr-3 pl-5">
                <span className="flex items-center gap-2 font-semibold">
                  {l.couleur && <span aria-hidden className="size-2 rounded-full" style={{ background: l.couleur }} />}
                  {l.nom}
                </span>
              </td>
              <td className={`px-3 py-3 text-right ${l.rang && l.rang <= 3 ? 'text-or' : ''}`}>{l.rang ?? '—'}</td>
              <td className="px-3 py-3 text-right font-titre text-[16px]" style={{ color: l.elo != null ? palierDe(l.elo).couleur : undefined }}>
                {l.elo ?? '—'}
              </td>
              <td className="px-3 py-3 text-right" style={{ color: l.eloMax != null ? palierDe(l.eloMax).couleur : undefined }}>
                {l.eloMax ?? '—'}
              </td>
              <td className="px-3 py-3 text-right">{l.matchs}</td>
              <td className="px-3 py-3 text-right text-vert">{l.victoires}</td>
              <td className="px-3 py-3 text-right" style={{ color: l.matchs > 0 ? couleurWinrate(l.winrate) : undefined }}>
                {l.matchs > 0 ? `${l.winrate}%` : '—'}
              </td>
              <td className="px-3 py-3 text-right">{l.serie > 0 ? <span className="text-soupe">🔥 {l.serie}</span> : '0'}</td>
              <td className="px-3 py-3 text-right">{l.recordSerie}</td>
              <td className="py-3 pr-5 pl-3 text-right text-gris">{formaterTempsJeu(l.temps)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Les compteurs figés à la clôture : FFA, puis practice ranked et unranked par mode. */
function BlocArchive({ archive, locale }: { archive: ArchiveJoueur; locale: Locale }) {
  const { ffa, practice } = archive
  const kdr = ffa ? (ffa.morts > 0 ? (ffa.kills / ffa.morts).toFixed(2) : String(ffa.kills)) : '—'
  return (
    <div className="grid gap-4">
      {ffa && (
        <div>
          <p className="mb-3 font-mono text-[10.5px] tracking-[.16em] text-gris uppercase">{t(locale, 'pf.ffa')}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <TuileStat libelle={t(locale, 'pf.kills')} valeur={ffa.kills} couleur="var(--color-vert)" />
            <TuileStat libelle={t(locale, 'pf.morts')} valeur={ffa.morts} couleur="var(--color-rouge)" />
            <TuileStat libelle={t(locale, 'pf.kdr')} valeur={kdr} />
            <TuileStat libelle={t(locale, 'pf.points')} valeur={ffa.points} couleur="var(--color-or)" />
            <TuileStat libelle={t(locale, 'pf.record-serie')} valeur={ffa.recordSerie} couleur="var(--color-soupe)" />
          </div>
        </div>
      )}
      {practice.length > 0 && (
        <div className="overflow-x-auto rounded-carte border border-bord bg-braise">
          <table className="w-full min-w-[640px] border-collapse text-left font-mono text-[13px] tabular-nums">
            <thead className="bg-nuit text-[10.5px] tracking-[.12em] text-gris uppercase">
              <tr>
                <th scope="col" className="px-3 py-3 pl-5">{t(locale, 'lb.col-mode')}</th>
                <th scope="col" className="px-3 py-3" />
                <th scope="col" className="px-3 py-3 text-right">{t(locale, 'lb.col-matchs')}</th>
                <th scope="col" className="px-3 py-3 text-right">{t(locale, 'lb.col-victoires')}</th>
                <th scope="col" className="px-3 py-3 text-right">{t(locale, 'lb.col-winrate')}</th>
                <th scope="col" className="px-3 py-3 text-right">{t(locale, 'lb.col-meilleure')}</th>
                <th scope="col" className="px-3 py-3 pr-5 text-right">{t(locale, 'lb.col-temps')}</th>
              </tr>
            </thead>
            <tbody>
              {practice.map((p) => {
                const winrate = p.matchs > 0 ? Math.round((p.victoires * 100) / p.matchs) : 0
                return (
                  <tr key={`${p.mode}-${p.ranked}`} className="border-t border-bord">
                    <td className="px-3 py-3 pl-5">
                      <span className="flex items-center gap-2 font-semibold">
                        <span aria-hidden className="size-2 rounded-full" style={{ background: infosMode(p.mode).couleur }} />
                        {infosMode(p.mode).nom}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-micro px-1.5 py-0.5 text-[10.5px] uppercase ${p.ranked ? 'bg-or/10 text-or' : 'bg-nuit text-gris'}`}>
                        {p.ranked ? t(locale, 'pf.ranked') : t(locale, 'pf.unranked')}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">{p.matchs}</td>
                    <td className="px-3 py-3 text-right text-vert">{p.victoires}</td>
                    <td className="px-3 py-3 text-right" style={{ color: couleurWinrate(winrate) }}>{winrate}%</td>
                    <td className="px-3 py-3 text-right">{p.meilleureSerie}</td>
                    <td className="px-3 py-3 pr-5 text-right text-gris">{formaterTempsJeu(p.secondes)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
