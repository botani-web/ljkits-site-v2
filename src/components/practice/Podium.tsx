import Link from 'next/link'

import { lien, t, type Locale } from '@/lib/i18n'
import { palierDe } from '@/lib/paliers'
import { cheminProfil } from '@/lib/practice-commun'
import type { LigneClassement } from '@/lib/practice'

import { BadgePalier, FormeRecente } from './Petits'
import { Skin3D } from './Skin3D'

const MEDAILLES = [
  { couleur: 'var(--color-or)', hauteur: 'h-[290px] lg:h-[340px]', ordre: 'lg:order-2' },
  { couleur: 'var(--color-argent)', hauteur: 'h-[250px] lg:h-[280px]', ordre: 'lg:order-1' },
  { couleur: 'var(--color-bronze)', hauteur: 'h-[250px] lg:h-[260px]', ordre: 'lg:order-3' },
]

/**
 * Les trois premiers, en 3D : le premier lève les bras, les deux autres sont
 * en garde, épée en main. Sur grand écran, le 1er au centre et plus haut ;
 * sur téléphone, dans l'ordre.
 */
export function Podium({
  lignes,
  locale,
  cashprize,
}: {
  lignes: LigneClassement[]
  locale: Locale
  /** Vue globale seulement : ce que gagne chaque marche. */
  cashprize?: string[]
}) {
  const podium = lignes.slice(0, 3)
  if (podium.length === 0) return null

  return (
    <ol className="grid items-end gap-4 lg:grid-cols-3">
      {podium.map((ligne, index) => {
        const medaille = MEDAILLES[index]
        const palier = palierDe(ligne.elo)
        const prix = cashprize?.[index]
        return (
          <li key={ligne.uuid} className={medaille.ordre}>
            <Link
              href={lien(locale, cheminProfil(ligne.pseudo))}
              className="group relative block overflow-hidden rounded-bloc border bg-charbon transition-transform duration-300 hover:-translate-y-1"
              style={{ borderColor: `${palier.couleur}40` }}
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${medaille.couleur}, transparent)` }}
              />
              <div className="flex items-start justify-between px-5 pt-4.5">
                <span className="font-titre text-[34px] leading-none" style={{ color: medaille.couleur }}>
                  #{ligne.rang}
                </span>
                {prix && (
                  <span className="rounded-micro border border-or/50 bg-or/10 px-2 py-1 font-mono text-[11px] font-bold tracking-[.08em] text-or">
                    {t(locale, 'pr.cashprize')} · {prix}
                  </span>
                )}
              </div>

              <Skin3D
                pseudo={ligne.pseudo}
                alt={t(locale, 'pr.skin-alt').replace('{p}', ligne.pseudo)}
                pose={index === 0 ? 'victoire' : 'combat'}
                halo={palier.couleur}
                decalage={index * 0.6}
                interactif={false}
                className={`-mt-2 w-full ${medaille.hauteur}`}
              />

              <div className="relative border-t border-bord bg-braise/80 px-5 py-4 backdrop-blur">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-titre text-[22px] leading-none transition-colors group-hover:text-or">
                      {ligne.pseudo}
                    </p>
                    <BadgePalier elo={ligne.elo} locale={locale} className="mt-2.5" />
                  </div>
                  <p className="font-titre text-[34px] leading-none tabular-nums" style={{ color: palier.couleur }}>
                    {ligne.elo}
                  </p>
                </div>
                <div className="mt-3.5 flex items-center justify-between gap-3 font-mono text-[12px]">
                  <span>
                    <span className="text-vert">{ligne.victoires}V</span>
                    <span className="text-gris"> · </span>
                    <span className="text-rouge">{ligne.defaites}D</span>
                    <span className="text-gris"> · </span>
                    <span className="text-creme">{ligne.winrate}%</span>
                  </span>
                  <FormeRecente forme={ligne.forme} locale={locale} taille="petit" />
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
