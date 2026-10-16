import Link from 'next/link'

import { IconeMode } from '@/components/s2/Briques'
import { lien, type Locale } from '@/lib/i18n'
import { ts } from '@/lib/i18n-s2'
import type { Saison } from '@/lib/saisons'

/**
 * Les sélecteurs de saison et de mode, en simples liens : aucun JavaScript, et
 * Next précharge chaque onglet visible — le clic affiche une page déjà là.
 */

export function PucesSaison({
  saisons,
  actuelle,
  locale,
  href,
}: {
  saisons: Saison[]
  actuelle: number
  locale: Locale
  href: (saison: number) => string
}) {
  if (saisons.length < 2) return null
  return (
    <div className="flex flex-wrap gap-1.5" role="list">
      {saisons.map((s) => {
        const actif = s.id === actuelle
        return (
          <Link
            key={s.id}
            role="listitem"
            href={lien(locale, href(s.id))}
            aria-current={actif ? 'page' : undefined}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors ${
              actif ? 'border-or/60 bg-or/10 text-or' : 'border-bord text-gris hover:border-gris hover:text-creme'
            }`}
          >
            {!s.terminee && <span className="size-1.5 rounded-full bg-vert" aria-hidden />}
            {ts(locale, 'c.saison', { n: s.id })}
            <span className="font-normal opacity-70">· {ts(locale, s.terminee ? 'c.terminee' : 'c.en-cours')}</span>
          </Link>
        )
      })}
    </div>
  )
}

export type Onglet = { cle: string; libelle: string; href: string; mode?: string; nombre?: number }

/** La rangée d'onglets des modes : défile à l'horizontale sur téléphone. */
export function OngletsModes({ onglets, actif, locale }: { onglets: Onglet[]; actif: string; locale: Locale }) {
  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none]" aria-label={ts(locale, 'c.mode')}>
      <div className="flex min-w-max gap-1 border-b border-bord">
        {onglets.map((o) => {
          const estActif = o.cle === actif
          return (
            <Link
              key={o.cle}
              href={lien(locale, o.href)}
              aria-current={estActif ? 'page' : undefined}
              className={`relative inline-flex h-11 items-center gap-2 px-3 text-[14px] font-semibold transition-colors ${
                estActif ? 'text-creme' : 'text-gris hover:text-creme'
              }`}
            >
              {o.mode ? (
                <IconeMode mode={o.mode} taille={18} />
              ) : (
                <svg viewBox="0 0 20 20" className="size-[18px] text-or" fill="currentColor" aria-hidden>
                  <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
                </svg>
              )}
              {o.libelle}
              {o.nombre != null && o.nombre > 0 && (
                <span className="font-mono text-[11px] font-normal text-gris">{o.nombre}</span>
              )}
              {estActif && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-or" aria-hidden />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
