'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Filtre } from '@/components/ui/Pilule'
import { lien, t, type Locale } from '@/lib/i18n'
import { palierDe } from '@/lib/paliers'
import {
  cheminProfil,
  cleRaison,
  formaterDuree,
  infosMode,
  pvSignificatifs,
  tempsRelatif,
  urlTete,
} from '@/lib/practice-commun'
import type { MatchProfil } from '@/lib/practice'

/** Un match tel qu'il arrive au navigateur : la date en texte. */
export type MatchClient = Omit<MatchProfil, 'instant'> & { instant: string }

const PAR_PAGE = 20

/**
 * L'historique d'un joueur : chaque match avec l'adversaire, l'Elo avant et
 * après, la durée, la façon dont il s'est fini et les cœurs restants du
 * vainqueur. Filtrable par mode et par résultat.
 */
export function HistoriqueMatchs({
  matchs,
  locale,
  limite,
}: {
  matchs: MatchClient[]
  locale: Locale
  /** Le nombre maximum de matchs chargés (pour l'expliquer s'il est atteint). */
  limite: number
}) {
  const [mode, setMode] = useState<string>('tous')
  const [resultat, setResultat] = useState<'tous' | 'V' | 'D'>('tous')
  const [affiches, setAffiches] = useState(PAR_PAGE)

  const modes = useMemo(() => [...new Set(matchs.map((m) => m.mode))], [matchs])
  const filtres = useMemo(
    () =>
      matchs.filter(
        (m) => (mode === 'tous' || m.mode === mode) && (resultat === 'tous' || (resultat === 'V') === m.victoire),
      ),
    [matchs, mode, resultat],
  )

  const choisirMode = (valeur: string) => {
    setMode(valeur)
    setAffiches(PAR_PAGE)
  }
  const choisirResultat = (valeur: 'tous' | 'V' | 'D') => {
    setResultat(valeur)
    setAffiches(PAR_PAGE)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filtre actif={mode === 'tous'} onClick={() => choisirMode('tous')}>
          {t(locale, 'pr.tous-modes')}
        </Filtre>
        {modes.map((m) => (
          <Filtre key={m} actif={mode === m} onClick={() => choisirMode(m)}>
            <span aria-hidden className="mr-1.5 inline-block size-2 rounded-full" style={{ background: infosMode(m).couleur }} />
            {infosMode(m).nom}
          </Filtre>
        ))}
        <span aria-hidden className="mx-1 hidden h-6 w-px bg-bord sm:block" />
        <Filtre actif={resultat === 'tous'} onClick={() => choisirResultat('tous')}>
          {t(locale, 'pr.tous')}
        </Filtre>
        <Filtre actif={resultat === 'V'} onClick={() => choisirResultat('V')}>
          {t(locale, 'pr.victoires')}
        </Filtre>
        <Filtre actif={resultat === 'D'} onClick={() => choisirResultat('D')}>
          {t(locale, 'pr.defaites')}
        </Filtre>
      </div>

      {filtres.length === 0 ? (
        <p className="rounded-carte border border-dashed border-bord px-6 py-12 text-center font-mono text-[13px] text-gris">
          {t(locale, 'pr.historique-vide')}
        </p>
      ) : (
        <ol className="overflow-hidden rounded-carte border border-bord bg-charbon">
          {filtres.slice(0, affiches).map((m) => {
            const infos = infosMode(m.mode)
            return (
              <li
                key={m.id}
                className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1.5 border-b border-bord px-4 py-3 last:border-b-0 md:grid-cols-[46px_110px_minmax(0,1fr)_150px_78px_minmax(0,150px)_110px] md:gap-4 md:px-5"
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-controle border font-mono text-[12px] font-bold md:h-10 md:w-10 ${
                    m.victoire ? 'border-vert/45 bg-vert/12 text-vert' : 'border-rouge/45 bg-rouge/12 text-rouge'
                  }`}
                  title={t(locale, m.victoire ? 'pr.victoire' : 'pr.defaite')}
                >
                  {t(locale, m.victoire ? 'pr.v' : 'pr.d')}
                </span>

                <span className="hidden items-center gap-1.5 font-mono text-[11px] tracking-[.06em] text-creme uppercase md:inline-flex">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: infos.couleur }} />
                  {infos.nom}
                </span>

                <Link
                  href={lien(locale, cheminProfil(m.adversairePseudo))}
                  className="flex min-w-0 items-center gap-2.5 transition-colors hover:text-or"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlTete(m.adversairePseudo, 32)} alt="" width={26} height={26} loading="lazy" className="shrink-0 rounded-micro [image-rendering:pixelated]" />
                  <span className="min-w-0">
                    <span className="block text-[10px] tracking-[.1em] text-gris uppercase md:hidden">
                      {infos.nom} · {t(locale, 'pr.contre')}
                    </span>
                    <span className="block truncate text-[14.5px] font-semibold">{m.adversairePseudo}</span>
                  </span>
                </Link>

                <span className="text-right font-mono text-[13px] tabular-nums md:text-left">
                  <span className="hidden text-gris md:inline">{m.eloAvant} → </span>
                  <span style={{ color: palierDe(m.eloApres).couleur }}>{m.eloApres}</span>{' '}
                  <span className={m.delta > 0 ? 'text-vert' : m.delta < 0 ? 'text-rouge' : 'text-gris'}>
                    ({m.delta > 0 ? `+${m.delta}` : m.delta})
                  </span>
                </span>

                <span className="col-start-2 font-mono text-[12px] text-gris md:col-start-auto md:text-creme">
                  ⏱ {formaterDuree(m.duree)}
                </span>

                <span className="col-start-2 hidden font-mono text-[11.5px] text-gris md:col-start-auto md:block">
                  {t(locale, cleRaison(m.raison))}
                  {pvSignificatifs(m.mode, m.raison, m.pvGagnant) && (
                    <span className="ml-1.5 text-rouge">♥ {(m.pvGagnant / 2).toFixed(1).replace('.0', '')}</span>
                  )}
                </span>

                <span className="col-span-1 text-right font-mono text-[11px] text-gris" suppressHydrationWarning>
                  {tempsRelatif(m.instant, locale)}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] text-gris">
          {matchs.length >= limite && t(locale, 'pr.historique-limite').replace('{n}', String(limite))}
        </p>
        {filtres.length > affiches && (
          <button
            type="button"
            onClick={() => setAffiches((n) => n + PAR_PAGE)}
            className="inline-flex min-h-11 items-center rounded-controle border border-bord bg-charbon px-5 font-mono text-[12px] tracking-[.12em] text-creme uppercase transition-colors hover:border-or/70 hover:text-or"
          >
            {t(locale, 'pr.voir-plus')} · {filtres.length - affiches}
          </button>
        )}
      </div>
    </div>
  )
}
