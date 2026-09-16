'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Filtre } from '@/components/ui/Pilule'
import { lien, t, type Locale } from '@/lib/i18n'
import { palierDe } from '@/lib/paliers'
import { cheminProfil, infosMode, urlTete } from '@/lib/practice-commun'
import type { LigneClassement } from '@/lib/practice'

import { BadgePalier, BarreWinrate, FormeRecente } from './Petits'

type Tri = 'elo' | 'winrate' | 'matchs' | 'serie'

const PAR_PAGE = 50

/**
 * Le classement, à partir de la 4e place (le podium montre les trois premiers).
 *
 * Filtrer par pseudo ou changer de tri fait revenir TOUT le classement dans la
 * liste : chercher « Lestoo » doit le trouver même s'il est 2e. Le rang affiché
 * reste toujours le rang Elo, quel que soit le tri.
 */
export function TableauClassement({
  lignes,
  locale,
  global,
}: {
  lignes: LigneClassement[]
  locale: Locale
  /** Vue globale : on montre l'Elo de chaque mode sous le pseudo. */
  global: boolean
}) {
  const [filtre, setFiltre] = useState('')
  const [tri, setTri] = useState<Tri>('elo')
  const [affiches, setAffiches] = useState(PAR_PAGE)

  const visibles = useMemo(() => {
    const recherche = filtre.trim().toLowerCase()
    let liste = recherche ? lignes.filter((l) => l.pseudo.toLowerCase().includes(recherche)) : lignes
    if (!recherche && tri === 'elo') liste = liste.filter((l) => l.rang > 3)
    if (tri !== 'elo') {
      const cle: Record<Exclude<Tri, 'elo'>, (l: LigneClassement) => number> = {
        winrate: (l) => l.winrate * 10000 + l.matchs,
        matchs: (l) => l.matchs,
        serie: (l) => l.serie * 1000 + l.recordSerie,
      }
      liste = [...liste].sort((a, b) => cle[tri](b) - cle[tri](a) || a.rang - b.rang)
    }
    return liste
  }, [lignes, filtre, tri])

  const tris: { id: Tri; libelle: string }[] = [
    { id: 'elo', libelle: t(locale, 'pr.tri-elo') },
    { id: 'winrate', libelle: t(locale, 'pr.tri-winrate') },
    { id: 'matchs', libelle: t(locale, 'pr.tri-matchs') },
    { id: 'serie', libelle: t(locale, 'pr.tri-serie') },
  ]

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center gap-3">
        <div className="flex h-11 min-w-0 flex-1 basis-[240px] items-center gap-2.5 rounded-controle border border-bord bg-charbon px-3.5 focus-within:border-or/70">
          <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-gris" aria-hidden>
            <path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={filtre}
            onChange={(e) => {
              setFiltre(e.target.value)
              setAffiches(PAR_PAGE)
            }}
            placeholder={t(locale, 'pr.filtre-placeholder')}
            aria-label={t(locale, 'pr.filtre-placeholder')}
            className="w-full bg-transparent text-[14.5px] text-creme outline-none placeholder:text-gris/70"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t(locale, 'pr.tri')}>
          <span className="mr-1 font-mono text-[10.5px] tracking-[.14em] text-gris uppercase">{t(locale, 'pr.tri')}</span>
          {tris.map((option) => (
            <Filtre key={option.id} actif={tri === option.id} onClick={() => setTri(option.id)}>
              {option.libelle}
            </Filtre>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-carte border border-bord bg-charbon">
        <div
          className="hidden grid-cols-[64px_minmax(0,1.7fr)_88px_minmax(0,1fr)_92px_86px_150px] gap-4 border-b border-bord bg-nuit px-5 py-3 font-mono text-[10.5px] tracking-[.16em] text-gris uppercase lg:grid"
          aria-hidden
        >
          <span>{t(locale, 'pr.col-rang')}</span>
          <span>{t(locale, 'pr.col-joueur')}</span>
          <span className="text-right">{t(locale, 'pr.col-elo')}</span>
          <span>{t(locale, 'pr.col-winrate')}</span>
          <span className="text-center">{t(locale, 'pr.col-bilan')}</span>
          <span className="text-center">{t(locale, 'pr.col-serie')}</span>
          <span>{t(locale, 'pr.col-forme')}</span>
        </div>

        {visibles.length === 0 ? (
          <p className="px-6 py-12 text-center font-mono text-[13px] text-gris">{t(locale, 'pr.aucun-filtre')}</p>
        ) : (
          <ol>
            {visibles.slice(0, affiches).map((ligne) => {
              const palier = palierDe(ligne.elo)
              return (
                <li key={ligne.uuid} className="border-b border-bord last:border-b-0">
                  <Link
                    href={lien(locale, cheminProfil(ligne.pseudo))}
                    className="group relative grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2 px-4 py-3.5 transition-colors hover:bg-braise lg:grid-cols-[64px_minmax(0,1.7fr)_88px_minmax(0,1fr)_92px_86px_150px] lg:gap-4 lg:px-5"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-[3px] scale-y-0 transition-transform duration-200 group-hover:scale-y-100"
                      style={{ background: palier.couleur }}
                    />
                    <span className="font-mono text-[13px] tabular-nums text-gris">#{ligne.rang}</span>

                    <span className="flex min-w-0 items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={urlTete(ligne.pseudo, 40)}
                        alt=""
                        width={34}
                        height={34}
                        loading="lazy"
                        className="shrink-0 rounded-micro [image-rendering:pixelated]"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold transition-colors group-hover:text-or">
                          {ligne.pseudo}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <BadgePalier elo={ligne.elo} locale={locale} petit />
                          {global &&
                            ligne.modes.map((m) => (
                              <span key={m.mode} className="hidden items-center gap-1 font-mono text-[10px] text-gris sm:inline-flex">
                                <span aria-hidden className="size-1.5 rounded-full" style={{ background: infosMode(m.mode).couleur }} />
                                {infosMode(m.mode).nom}
                                <span className="tabular-nums" style={{ color: palierDe(m.elo).couleur }}>
                                  {m.elo}
                                </span>
                              </span>
                            ))}
                        </span>
                      </span>
                    </span>

                    <span className="text-right font-titre text-[19px] leading-none tabular-nums lg:text-[21px]" style={{ color: palier.couleur }}>
                      {ligne.elo}
                    </span>

                    <BarreWinrate valeur={ligne.winrate} className="col-span-2 col-start-2 lg:col-span-1 lg:col-start-auto" />

                    <span className="hidden text-center font-mono text-[13px] tabular-nums lg:block">
                      <span className="text-vert">{ligne.victoires}</span>
                      <span className="text-gris"> – </span>
                      <span className="text-rouge">{ligne.defaites}</span>
                    </span>

                    <span className="hidden text-center font-mono text-[13px] tabular-nums lg:block">
                      {ligne.serie > 0 ? (
                        <span className="text-soupe">🔥 {ligne.serie}</span>
                      ) : (
                        <span className="text-gris">0</span>
                      )}
                      <span className="block text-[10px] text-gris">max {ligne.recordSerie}</span>
                    </span>

                    <FormeRecente forme={ligne.forme} locale={locale} taille="petit" className="hidden lg:inline-flex" />
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {visibles.length > affiches && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setAffiches((n) => n + PAR_PAGE)}
            className="inline-flex min-h-11 items-center rounded-controle border border-bord bg-charbon px-5 font-mono text-[12px] tracking-[.12em] text-creme uppercase transition-colors hover:border-or/70 hover:text-or"
          >
            {t(locale, 'pr.voir-plus')} · {visibles.length - affiches}
          </button>
        </div>
      )}
    </div>
  )
}
