'use client'

import Link from 'next/link'
import { useState } from 'react'

import { lien, t, type Locale } from '@/lib/i18n'
import { palierAffiche } from '@/lib/paliers'
import { cheminProfil, formaterTempsJeu, urlTete } from '@/lib/practice-commun'
import type { LigneClassement } from '@/lib/practice'

import { BadgePalier, couleurWinrate } from './Petits'

const TAILLES = [10, 25, 50, 100] as const

/** Les trois premiers gardent les couleurs du podium (or, argent, bronze). */
const COULEURS_PODIUM = ['var(--color-or)', '#c9cfd8', '#d08a4f']

/**
 * LE CLASSEMENT EN TABLEAU, À LA PVPRIVALS (12/10/2026).
 *
 * Mêmes colonnes et même lecture que leur page : #, joueur, Elo, matchs,
 * victoires, winrate, série, temps de jeu ; puis « Lignes 10/25/50/100 » et
 * « 1–25 sur N ». Les couleurs et les polices restent les nôtres (paliers,
 * or des trois premiers).
 */
export function TableauRivals({ lignes, locale }: { lignes: LigneClassement[]; locale: Locale }) {
  const [taille, setTaille] = useState<number>(25)
  const [page, setPage] = useState(0)

  const pages = Math.max(1, Math.ceil(lignes.length / taille))
  const debut = page * taille
  const visibles = lignes.slice(debut, debut + taille)

  const enTete = 'px-3 py-3 font-mono text-[10.5px] font-bold tracking-[.12em] text-gris uppercase'

  return (
    <div className="overflow-hidden rounded-carte border border-bord bg-charbon">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-nuit">
            <tr>
              <th scope="col" className={`${enTete} w-[64px] pl-5`}>#</th>
              <th scope="col" className={enTete}>{t(locale, 'lb.col-joueur')}</th>
              <th scope="col" className={`${enTete} text-right`}>{t(locale, 'lb.col-rating')}</th>
              <th scope="col" className={`${enTete} text-right`}>{t(locale, 'lb.col-matchs')}</th>
              <th scope="col" className={`${enTete} text-right`}>{t(locale, 'lb.col-victoires')}</th>
              <th scope="col" className={`${enTete} text-right`}>{t(locale, 'lb.col-winrate')}</th>
              <th scope="col" className={`${enTete} text-right`}>{t(locale, 'lb.col-serie')}</th>
              <th scope="col" className={`${enTete} pr-5 text-right`}>{t(locale, 'lb.col-temps')}</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((l) => {
              const couleurRang = l.rang <= 3 ? COULEURS_PODIUM[l.rang - 1] : undefined
              return (
                <tr key={l.uuid} className="border-t border-bord transition-colors hover:bg-braise">
                  <td className="py-3 pr-3 pl-5 font-titre text-[18px] tabular-nums" style={{ color: couleurRang ?? 'var(--color-gris)' }}>
                    {l.rang}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={lien(locale, cheminProfil(l.pseudo))} className="group flex min-w-0 items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={urlTete(l.pseudo, 64)}
                        alt=""
                        width={34}
                        height={34}
                        loading="lazy"
                        className="rounded-micro [image-rendering:pixelated]"
                        style={couleurRang ? { boxShadow: `0 0 0 2px ${couleurRang}` } : undefined}
                      />
                      <span className="truncate font-semibold transition-colors group-hover:text-or">{l.pseudo}</span>
                      <BadgePalier elo={l.elo} etat={l.etatPalier} locale={locale} petit />
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right font-titre text-[18px] tabular-nums" style={{ color: palierAffiche(l.elo, l.etatPalier).couleur }}>
                    {l.elo}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[13px] tabular-nums">{l.matchs}</td>
                  <td className="px-3 py-3 text-right font-mono text-[13px] text-vert tabular-nums">{l.victoires}</td>
                  <td className="px-3 py-3 text-right font-mono text-[13px] tabular-nums" style={{ color: couleurWinrate(l.winrate) }}>
                    {l.winrate}%
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-[13px] tabular-nums">
                    {l.serie > 0 ? <span className="text-soupe">🔥 {l.serie}</span> : <span className="text-gris">0</span>}
                  </td>
                  <td className="py-3 pr-5 pl-3 text-right font-mono text-[13px] text-gris tabular-nums">{formaterTempsJeu(l.temps)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pied de tableau : lignes par page et position, comme PvPRivals. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bord bg-nuit px-5 py-3 font-mono text-[12px] text-gris">
        <label className="flex items-center gap-2">
          <span className="tracking-[.12em] uppercase">{t(locale, 'lb.lignes')}</span>
          <select
            value={taille}
            onChange={(e) => {
              setTaille(Number(e.target.value))
              setPage(0)
            }}
            className="rounded-micro border border-bord bg-charbon px-2 py-1 text-creme"
          >
            {TAILLES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3">
          <span className="tabular-nums">
            {lignes.length === 0 ? 0 : debut + 1}–{Math.min(debut + taille, lignes.length)} {t(locale, 'lb.sur')} {lignes.length}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label={t(locale, 'lb.precedent')}
            className="rounded-micro border border-bord px-2.5 py-1 text-creme transition hover:border-or/60 disabled:opacity-30"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={page >= pages - 1}
            aria-label={t(locale, 'lb.suivant')}
            className="rounded-micro border border-bord px-2.5 py-1 text-creme transition hover:border-or/60 disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
