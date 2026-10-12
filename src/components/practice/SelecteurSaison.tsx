import Link from 'next/link'

import { t, type Locale } from '@/lib/i18n'
import type { Saison } from '@/lib/saisons'

/**
 * LE CHOIX DE LA SAISON (12/10/2026), en menu déroulant comme sur PvPRivals.
 *
 * Un <details> natif : pas de JavaScript, et chaque saison est un vrai lien
 * (`?saison=`), partageable et compris par le moteur de recherche.
 */
export function SelecteurSaison({
  saisons,
  actuelle,
  hrefPour,
  locale,
}: {
  saisons: Saison[]
  actuelle: Saison
  hrefPour: (id: number) => string
  locale: Locale
}) {
  const nom = (s: Saison) => t(locale, 'lb.saison-n').replace('{n}', String(s.id))
  const etat = (s: Saison) => (s.terminee ? t(locale, 'lb.terminee') : t(locale, 'lb.en-cours'))
  return (
    <details className="group relative w-full shrink-0 sm:w-auto">
      <summary className="flex h-11 cursor-pointer whitespace-nowrap list-none items-center gap-3 rounded-controle border border-bord bg-charbon px-4 transition hover:border-gris/60 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-col gap-1 text-left">
          <span className="block font-mono text-[9.5px] tracking-[.14em] text-gris uppercase">{t(locale, 'lb.saison')}</span>
          <span className="block font-titre text-[14px] leading-none text-creme">{nom(actuelle)}</span>
        </span>
        <span aria-hidden className="ml-auto text-gris transition-transform group-open:rotate-180">▾</span>
      </summary>
      <ul className="absolute z-40 mt-2 min-w-[220px] overflow-hidden rounded-carte border border-bord bg-charbon shadow-xl">
        {saisons.map((s) => (
          <li key={s.id}>
            <Link
              href={hrefPour(s.id)}
              scroll={false}
              aria-current={s.id === actuelle.id ? 'true' : undefined}
              className={`flex items-center justify-between gap-4 px-4 py-3 font-mono text-[13px] transition-colors hover:bg-braise ${
                s.id === actuelle.id ? 'text-or' : 'text-creme'
              }`}
            >
              <span>{nom(s)}</span>
              <span className="text-[10.5px] text-gris uppercase">{etat(s)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  )
}
