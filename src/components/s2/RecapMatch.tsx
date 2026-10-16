import Link from 'next/link'

import { Inventaire } from '@/components/practice/Inventaire'
import { BadgeGrade, Conteneur, Delta, Elo, IconeMode, NomPalier, Panneau, Tete } from '@/components/s2/Briques'
import { cheminFlux } from '@/lib/chemins-s2'
import { formaterDateHeure } from '@/lib/format'
import type { Grade } from '@/lib/grades-commun'
import { lien, t, type Locale } from '@/lib/i18n'
import { type CleS2, ts } from '@/lib/i18n-s2'
import type { CoteMatch, DetailMatch } from '@/lib/practice'
import { cheminProfil, cleAnnulation, cleRaison, formaterDuree, infosMode, urlCorps } from '@/lib/practice-commun'

/**
 * LE RÉCAP D'UN MATCH RANKED (refonte S2, 16/10/2026).
 *
 * En haut, le face-à-face : les deux skins, l'Elo avant → après, qui a gagné et
 * comment. Puis les chiffres côte à côte avec une barre de partage (coups, coups
 * par seconde, combo, soupes, vie), les deux inventaires de fin, et le bilan des
 * deux joueurs entre eux dans la saison.
 */
export function RecapMatch({
  m,
  locale,
  grades,
  duel,
}: {
  m: DetailMatch
  locale: Locale
  grades: Map<string, Grade>
  duel: { a: number; b: number }
}) {
  const g = m.gagnant
  const p = m.perdant
  const mode = infosMode(m.mode)
  const annule = m.annule != null
  const mesure = g.coups != null || p.coups != null
  const parSeconde = (c: CoteMatch) => (c.coups == null || m.duree <= 0 ? null : c.coups / m.duree)
  const virgule = (n: number) => n.toFixed(2).replace('.', locale === 'fr' ? ',' : '.')
  const coeurs = (v: number) => `${(v / 2).toFixed(1).replace(/[.,]0$/, '').replace('.', locale === 'fr' ? ',' : '.')} ♥`
  const avecSoupes = (g.soupes ?? 0) + (p.soupes ?? 0) > 0
  const avecVie = m.mode !== 'boxing' && (g.vie != null || p.vie != null)

  const lignes: { cle: CleS2; a: number | null; b: number | null; format?: (n: number) => string }[] = [
    { cle: 'm.coups', a: g.coups, b: p.coups },
    { cle: 'm.coups-s', a: parSeconde(g), b: parSeconde(p), format: virgule },
    { cle: 'm.combo', a: g.combo, b: p.combo },
    ...(avecSoupes ? [{ cle: 'm.soupes' as const, a: g.soupes, b: p.soupes }] : []),
    ...(avecVie ? [{ cle: 'm.vie' as const, a: g.vie, b: p.vie, format: coeurs }] : []),
  ]

  return (
    <main className="pb-6">
      {/* ─────────── le face-à-face ─────────── */}
      <section className="relative overflow-hidden border-b border-bord">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(45% 80% at 15% 50%, rgba(91,224,107,.08), transparent 70%), radial-gradient(45% 80% at 85% 50%, rgba(224,91,91,.07), transparent 70%), radial-gradient(40% 60% at 50% 0%, ${mode.couleur}18, transparent 70%)`,
          }}
        />
        <Conteneur className="relative pt-6 pb-8 sm:pt-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-gris">
            <Link href={lien(locale, cheminFlux(m.mode))} className="inline-flex items-center gap-2 font-semibold text-creme hover:text-or">
              <IconeMode mode={m.mode} taille={20} />
              {mode.nom}
            </Link>
            <span className="rounded-[4px] bg-or/12 px-1.5 py-0.5 font-mono text-[11px] font-bold text-or uppercase">{ts(locale, 'c.ranked')}</span>
            <span>·</span>
            <span>{ts(locale, 'c.saison', { n: m.saison })}</span>
            <span>·</span>
            <span className="font-mono">{ts(locale, 'm.match', { id: m.id })}</span>
          </div>

          {annule && (
            <p className="mt-4 rounded-[6px] border border-soupe/40 bg-soupe/10 px-3.5 py-2.5 text-[14px] font-semibold text-soupe">
              {ts(locale, 'm.annule', { r: t(locale, cleAnnulation(m.annule!)).toLowerCase() })}
            </p>
          )}

          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 sm:gap-6">
            <Cote c={g} gagnant annule={annule} locale={locale} grade={grades.get(g.uuid)} />
            <div className="flex flex-col items-center pb-6 text-center sm:pb-10">
              <span className="font-titre text-[22px] text-gris/70 sm:text-[30px]">{ts(locale, 'c.vs')}</span>
              <span className="mt-1 font-mono text-[15px] font-bold text-creme sm:text-[18px]">{formaterDuree(m.duree)}</span>
            </div>
            <Cote c={p} gagnant={false} annule={annule} locale={locale} grade={grades.get(p.uuid)} />
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Info libelle={ts(locale, 'm.fin')} valeur={t(locale, cleRaison(m.raison))} />
            <Info libelle={ts(locale, 'm.duree')} valeur={formaterDuree(m.duree)} />
            <Info libelle={ts(locale, 'm.carte')} valeur={m.carte ?? '—'} />
            <Info libelle={ts(locale, 'm.date')} valeur={formaterDateHeure(new Date(m.instant), locale)} />
          </dl>
          {m.facteurFarm < 1 && <p className="mt-3 text-[12.5px] text-soupe">{t(locale, 'pr.match-anti-farm')}</p>}
        </Conteneur>
      </section>

      <Conteneur className="grid gap-6 pt-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* ─────────── les chiffres ─────────── */}
        <section aria-labelledby="titre-stats">
          <h2 id="titre-stats" className="mb-3 text-[18px] font-bold text-creme">
            {ts(locale, 'm.stats')}
          </h2>
          <Panneau className="overflow-hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-3 border-b border-bord px-4 py-2.5 text-[12.5px] font-semibold">
              <span className="truncate text-vert">{g.pseudo}</span>
              <span />
              <span className="truncate text-right text-rouge">{p.pseudo}</span>
            </div>
            {mesure ? (
              lignes.map((l) => {
                const connus = l.a != null && l.b != null
                const total = (l.a ?? 0) + (l.b ?? 0)
                const partA = connus && total > 0 ? (l.a! / total) * 100 : 50
                const format = l.format ?? String
                return (
                  <div
                    key={l.cle}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-3 border-b border-bord/60 px-4 py-3 last:border-0"
                  >
                    <span className={`font-mono text-[19px] font-bold tabular-nums ${connus && l.a! > l.b! ? 'text-creme' : 'text-gris'}`}>
                      {l.a == null ? '—' : format(l.a)}
                    </span>
                    <span className="text-center">
                      <span className="block text-[12px] font-medium text-gris">{ts(locale, l.cle)}</span>
                      {connus && (
                        <span aria-hidden className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-bord">
                          <span className="h-full bg-vert/80" style={{ width: `${partA}%` }} />
                          <span className="h-full flex-1 bg-rouge/70" />
                        </span>
                      )}
                    </span>
                    <span className={`text-right font-mono text-[19px] font-bold tabular-nums ${connus && l.b! > l.a! ? 'text-creme' : 'text-gris'}`}>
                      {l.b == null ? '—' : format(l.b)}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="px-4 py-6 text-[14px] text-gris">{ts(locale, 'm.non-mesure')}</p>
            )}
          </Panneau>
          {mesure && <p className="mt-2 text-[12px] text-gris/80">{t(locale, 'pr.match-coups-s-aide')}</p>}
        </section>

        {/* ─────────── entre eux ─────────── */}
        <section aria-labelledby="titre-duel" className="flex flex-col gap-4">
          <div>
            <h2 id="titre-duel" className="mb-3 text-[18px] font-bold text-creme">
              {ts(locale, 'm.historique-duo')}
            </h2>
            <Panneau className="flex items-center justify-between gap-3 px-4 py-4">
              <Link href={lien(locale, cheminProfil(g.pseudo))} className="flex min-w-0 items-center gap-2.5 hover:text-or">
                <Tete pseudo={g.pseudo} taille={32} />
                <span className="truncate font-semibold">{g.pseudo}</span>
              </Link>
              <span className="shrink-0 font-mono text-[24px] font-bold tabular-nums">
                <span className={duel.a >= duel.b ? 'text-vert' : 'text-creme'}>{duel.a}</span>
                <span className="mx-1.5 text-gris">–</span>
                <span className={duel.b > duel.a ? 'text-vert' : 'text-creme'}>{duel.b}</span>
              </span>
              <Link href={lien(locale, cheminProfil(p.pseudo))} className="flex min-w-0 items-center justify-end gap-2.5 hover:text-or">
                <span className="truncate font-semibold">{p.pseudo}</span>
                <Tete pseudo={p.pseudo} taille={32} />
              </Link>
            </Panneau>
          </div>
          <Panneau className="flex items-start gap-3 px-4 py-3.5 text-[14px] text-gris">
            <svg viewBox="0 0 20 20" className="mt-0.5 size-[18px] shrink-0 text-or" fill="currentColor" aria-hidden>
              <path d="M6 4.5v11l9-5.5z" />
            </svg>
            <span>
              {ts(locale, 'm.replay', { p: g.pseudo })}
            </span>
          </Panneau>
          <div className="flex flex-wrap gap-2">
            {[g, p].map((c) => (
              <Link
                key={c.uuid}
                href={lien(locale, cheminProfil(c.pseudo))}
                className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-bord px-3 text-[13.5px] font-semibold text-gris hover:border-gris hover:text-creme"
              >
                <Tete pseudo={c.pseudo} taille={18} />
                {ts(locale, 'm.autres', { p: c.pseudo })}
              </Link>
            ))}
          </div>
        </section>
      </Conteneur>

      {/* ─────────── les inventaires ─────────── */}
      {(g.inventaire || p.inventaire) && (
        <Conteneur className="pt-8">
          <h2 className="mb-3 text-[18px] font-bold text-creme">{ts(locale, 'm.inventaires')}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {[g, p].map((c, k) => (
              <Panneau key={c.uuid + k} className="p-4">
                <p className="mb-3 flex items-center gap-2 text-[14px] font-semibold">
                  <Tete pseudo={c.pseudo} taille={20} />
                  {c.pseudo}
                  <span className={`text-[12px] ${k === 0 ? 'text-vert' : 'text-rouge'}`}>
                    {ts(locale, k === 0 ? 'm.vainqueur' : 'm.perdant')}
                  </span>
                </p>
                <Inventaire inventaire={c.inventaire} locale={locale} />
              </Panneau>
            ))}
          </div>
        </Conteneur>
      )}
    </main>
  )
}

function Cote({
  c,
  gagnant,
  annule,
  locale,
  grade,
}: {
  c: CoteMatch
  gagnant: boolean
  annule: boolean
  locale: Locale
  grade: Grade | undefined
}) {
  return (
    <Link
      href={lien(locale, cheminProfil(c.pseudo))}
      className={`group flex min-w-0 flex-col items-center text-center ${gagnant ? '' : 'opacity-[.92]'}`}
    >
      <span
        className={`mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-[.08em] ${
          gagnant ? 'bg-vert/15 text-vert' : 'bg-rouge/12 text-rouge'
        }`}
      >
        {gagnant && (
          <svg viewBox="0 0 20 20" className="size-3.5" fill="currentColor" aria-hidden>
            <path d="M3 6l3.5 3L10 4l3.5 5L17 6l-1.5 9h-11z" />
          </svg>
        )}
        {ts(locale, gagnant ? 'm.vainqueur' : 'm.perdant')}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urlCorps(c.pseudo, 240)}
        alt=""
        width={84}
        height={190}
        className={`h-[150px] w-auto drop-shadow-[0_10px_18px_rgba(0,0,0,.55)] sm:h-[190px] ${gagnant ? '' : '[filter:saturate(.75)]'}`}
      />
      <span className="mt-3 flex max-w-full items-center gap-1.5">
        <span className="truncate text-[17px] font-bold text-creme group-hover:text-or sm:text-[21px]">{c.pseudo}</span>
        <BadgeGrade grade={grade} />
      </span>
      <span className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2 text-[14px]">
        <span className="font-mono text-gris tabular-nums">{c.eloAvant}</span>
        <span className="text-gris">→</span>
        <Elo valeur={c.eloApres} className="text-[17px]" />
        <Delta valeur={c.delta} annule={annule} className="text-[14px]" />
      </span>
      <NomPalier elo={c.eloApres} locale={locale} className="mt-0.5" />
    </Link>
  )
}

function Info({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="rounded-[6px] border border-bord bg-charbon/80 px-3.5 py-2.5">
      <dt className="text-[11px] font-medium uppercase tracking-[.08em] text-gris">{libelle}</dt>
      <dd className="mt-0.5 truncate text-[14px] font-semibold text-creme">{valeur}</dd>
    </div>
  )
}
