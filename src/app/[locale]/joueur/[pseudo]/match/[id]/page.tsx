import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { Inventaire } from '@/components/practice/Inventaire'
import { BadgePalier, PastilleMode } from '@/components/practice/Petits'
import { PagePublique } from '@/components/public/PagePublique'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { Section } from '@/components/ui/Section'
import { formaterDateHeure } from '@/lib/format'
import { estLocale, LANGUE_DEFAUT, lien, t, type Locale } from '@/lib/i18n'
import { palierDe } from '@/lib/paliers'
import { lireMatch, type CoteMatch } from '@/lib/practice'
import { cheminMatch, cheminProfil, cleAnnulation, cleRaison, formaterDuree, infosMode, urlTete } from '@/lib/practice-commun'
import { IMAGE_OG } from '@/lib/site'

/**
 * LA PAGE D'UN MATCH RANKED (05/10/2026).
 *
 * Qui a gagné, comment, et avec quels chiffres : coups, coups par seconde,
 * soupes, plus long combo, vie restante, puis les deux inventaires de fin.
 * Tout est compté en fin de match par LJPractice et rangé dans practice_match.
 * Un match terminé ne bouge plus : la page est gardée 5 minutes.
 */
export const revalidate = 300

type Params = { params: Promise<{ pseudo: string; id: string; locale: string }> }

const lire = cache((id: string) => lireMatch(id))

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { pseudo, id, locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const m = await lire(id)
  if (!m) return {}
  const mode = infosMode(m.mode).nom
  const titre = t(locale, 'pr.match-meta-titre').replace('{g}', m.gagnant.pseudo).replace('{p}', m.perdant.pseudo).replace('{m}', mode)
  return {
    title: titre,
    description: t(locale, 'pr.match-meta-desc').replace('{m}', mode),
    alternates: { canonical: lien(locale, cheminMatch(decodeURIComponent(pseudo), m.id)) },
    openGraph: { title: titre, description: t(locale, 'pr.match-meta-desc').replace('{m}', mode), images: IMAGE_OG },
  }
}

/** Une valeur mesurée, ou « non mesuré » — jamais un zéro inventé. */
function Valeur({ v, locale, format = String }: { v: number | null; locale: Locale; format?: (n: number) => string }) {
  return v == null ? <span className="text-[12px] text-gris/70 italic">{t(locale, 'pr.match-non-mesure')}</span> : <>{format(v)}</>
}

function CarteJoueur({ c, gagnant, annule, locale }: { c: CoteMatch; gagnant: boolean; annule: boolean; locale: Locale }) {
  const palier = palierDe(c.eloApres)
  return (
    <Link
      href={lien(locale, cheminProfil(c.pseudo))}
      className={`group flex min-w-0 items-center gap-4 rounded-bloc border p-4 transition hover:-translate-y-0.5 sm:p-5 ${
        gagnant ? 'border-vert/40 bg-vert/[.06]' : 'border-bord bg-braise'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={urlTete(c.pseudo, 96)} alt="" width={64} height={64} className="shrink-0 rounded-controle [image-rendering:pixelated]" />
      <span className="min-w-0">
        <span className={`block font-mono text-[10px] tracking-[.16em] uppercase ${gagnant ? 'text-vert' : 'text-rouge'}`}>
          {t(locale, gagnant ? 'pr.match-vainqueur' : 'pr.match-perdant')}
        </span>
        <span className="mt-0.5 block truncate font-titre text-[clamp(20px,2.6vw,28px)] leading-tight group-hover:text-or">{c.pseudo}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[13px] tabular-nums">
          <BadgePalier elo={c.eloApres} locale={locale} petit />
          <span style={{ color: palier.couleur }}>{c.eloApres}</span>
          <span className={`${c.delta > 0 ? 'text-vert' : c.delta < 0 ? 'text-rouge' : 'text-gris'} ${annule ? 'line-through opacity-60' : ''}`}>
            ({c.delta > 0 ? `+${c.delta}` : c.delta})
          </span>
        </span>
      </span>
    </Link>
  )
}

export default async function PageMatch({ params }: Params) {
  const { pseudo, id, locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const m = await lire(id)
  if (!m) notFound()

  const vu = decodeURIComponent(pseudo)
  const g = m.gagnant
  const p = m.perdant
  const mode = infosMode(m.mode)
  const boxing = m.mode === 'boxing'
  const mesure = g.coups != null || p.coups != null
  const parSeconde = (c: CoteMatch) => (c.coups == null || m.duree <= 0 ? null : c.coups / m.duree)
  const coeurs = (v: number) => `♥ ${(v / 2).toFixed(1).replace('.0', '')}`

  const lignes: { cle: Parameters<typeof t>[1]; a: number | null; b: number | null; format?: (n: number) => string; aide?: Parameters<typeof t>[1] }[] = [
    { cle: 'pr.match-coups', a: g.coups, b: p.coups },
    { cle: 'pr.match-coups-s', a: parSeconde(g), b: parSeconde(p), format: (n) => n.toFixed(2).replace('.', locale === 'fr' ? ',' : '.'), aide: 'pr.match-coups-s-aide' },
    { cle: 'pr.match-combo', a: g.combo, b: p.combo },
    ...(boxing ? [] : [{ cle: 'pr.match-soupes' as const, a: g.soupes, b: p.soupes }]),
    ...(boxing ? [] : [{ cle: 'pr.match-vie' as const, a: g.vie, b: p.vie, format: coeurs }]),
  ]

  return (
    <PagePublique locale={locale}>
      <header className="relative overflow-hidden pt-[clamp(28px,4vw,56px)] pb-[clamp(28px,4vw,48px)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(55% 70% at 20% 40%, ${mode.couleur}22, transparent 70%)` }}
        />
        <Enveloppe className="relative">
          <Link
            href={lien(locale, cheminProfil(vu))}
            className="font-mono text-[11px] tracking-[.12em] text-gris uppercase transition-colors hover:text-or"
          >
            {t(locale, 'pr.match-retour').replace('{p}', vu)}
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] tracking-[.16em] text-or uppercase">{t(locale, 'pr.match-etiquette')}</span>
            <PastilleMode mode={m.mode} />
            <span className="font-mono text-[11px] text-gris">#{m.id}</span>
          </div>

          {m.annule && (
            <p className="mt-5 rounded-carte border border-soupe/50 bg-soupe/10 px-4 py-3 text-[14px] font-semibold text-soupe">
              ⚠ {t(locale, 'pr.match-annule').replace('{r}', t(locale, cleAnnulation(m.annule)).toLowerCase())}
            </p>
          )}

          <div className="mt-5 grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <CarteJoueur c={g} gagnant annule={!!m.annule} locale={locale} />
            <span className="text-center font-titre text-[22px] text-gris">VS</span>
            <CarteJoueur c={p} gagnant={false} annule={!!m.annule} locale={locale} />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              ['pr.match-date', formaterDateHeure(m.instant, locale)],
              ['pr.match-duree', formaterDuree(m.duree)],
              ['pr.match-fin', t(locale, cleRaison(m.raison))],
              ['pr.match-carte', m.carte ?? '—'],
            ].map(([cle, valeur]) => (
              <div key={cle} className="rounded-carte border border-bord bg-charbon px-4 py-3">
                <dt className="font-mono text-[9.5px] tracking-[.14em] text-gris uppercase">{t(locale, cle as Parameters<typeof t>[1])}</dt>
                <dd className="mt-1 text-[14px] leading-snug font-semibold">{valeur}</dd>
              </div>
            ))}
          </dl>
          {m.facteurFarm < 1 && <p className="mt-3 font-mono text-[11px] text-soupe">⚠ {t(locale, 'pr.match-anti-farm')}</p>}
        </Enveloppe>
      </header>

      <Section fond="charbon" etiquette={t(locale, 'pr.match-chiffres-etiquette')} titre={t(locale, 'pr.match-chiffres-titre')}>
        {!mesure && (
          <p className="mb-4 rounded-carte border border-dashed border-bord px-5 py-4 font-mono text-[12px] text-gris">{t(locale, 'pr.match-ancien')}</p>
        )}
        <div className="overflow-hidden rounded-carte border border-bord bg-braise">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] border-b border-bord px-4 py-3 font-mono text-[11px] tracking-[.1em] uppercase">
            <span className="truncate text-vert">{g.pseudo}</span>
            <span />
            <span className="truncate text-right text-rouge">{p.pseudo}</span>
          </div>
          {lignes.map((l) => {
            const total = (l.a ?? 0) + (l.b ?? 0)
            const partA = total > 0 && l.a != null && l.b != null ? (l.a / total) * 100 : 50
            return (
              <div key={l.cle} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] items-center gap-3 border-b border-bord px-4 py-3.5 last:border-b-0">
                <span className={`font-titre text-[22px] tabular-nums ${l.a != null && l.b != null && l.a > l.b ? 'text-creme' : 'text-gris'}`}>
                  <Valeur v={l.a} locale={locale} format={l.format} />
                </span>
                <span className="text-center">
                  <span className="block font-mono text-[10.5px] tracking-[.12em] text-gris uppercase" title={l.aide ? t(locale, l.aide) : undefined}>
                    {t(locale, l.cle)}
                    {l.aide && <span className="ml-1 cursor-help text-or/80">*</span>}
                  </span>
                  {l.a != null && l.b != null && (
                    <span aria-hidden className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-bord">
                      <span className="h-full bg-vert/80" style={{ width: `${partA}%` }} />
                      <span className="h-full flex-1 bg-rouge/70" />
                    </span>
                  )}
                </span>
                <span className={`text-right font-titre text-[22px] tabular-nums ${l.a != null && l.b != null && l.b > l.a ? 'text-creme' : 'text-gris'}`}>
                  <Valeur v={l.b} locale={locale} format={l.format} />
                </span>
              </div>
            )
          })}
        </div>
        <p className="mt-3 font-mono text-[11px] text-gris"><span className="text-or/80">*</span> {t(locale, 'pr.match-coups-s-aide')}</p>
      </Section>

      <Section etiquette={t(locale, 'pr.match-inventaires-etiquette')} titre={t(locale, 'pr.match-inventaires-titre')}>
        <div className="grid gap-6 lg:grid-cols-2">
          {[g, p].map((c, k) => (
            <div key={c.uuid + k} className="rounded-bloc border border-bord bg-charbon p-4 sm:p-5">
              <p className="mb-3 flex items-center gap-2.5 font-semibold">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urlTete(c.pseudo, 32)} alt="" width={22} height={22} className="rounded-micro [image-rendering:pixelated]" />
                {c.pseudo}
                <span className={`font-mono text-[10px] tracking-[.14em] uppercase ${k === 0 ? 'text-vert' : 'text-rouge'}`}>
                  {t(locale, k === 0 ? 'pr.match-vainqueur' : 'pr.match-perdant')}
                </span>
              </p>
              <Inventaire inventaire={c.inventaire} locale={locale} />
            </div>
          ))}
        </div>
      </Section>
    </PagePublique>
  )
}
