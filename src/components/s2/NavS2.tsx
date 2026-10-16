'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useReglages } from '@/components/public/ContexteReglages'
import { BoutonCopieIp } from '@/components/public/CopieIp'
import { IconeDiscord } from '@/components/public/IconeDiscord'
import { useStatutServeur } from '@/components/public/StatutServeur'
import { RechercheNav } from '@/components/s2/RechercheNav'
import { estLocale, LANGUE_DEFAUT, lien, type Locale } from '@/lib/i18n'
import { type CleS2, ts } from '@/lib/i18n-s2'
import { promoEnCours } from '@/lib/promo'

/**
 * LA BARRE DE NAVIGATION DE LA REFONTE (16/10/2026).
 *
 * 64 px + 1 px de filet (= --spacing-nav, sur lequel s'arriment les barres
 * collantes de la boutique). Logo, quatre liens, la recherche de joueur, la
 * langue, Discord, et le bouton « Jouer » qui copie l'IP en montrant le nombre
 * de joueurs en ligne. Sous 900 px : logo, Jouer et un panneau déroulant.
 */
const LIENS: { href: string; cle: CleS2 }[] = [
  { href: '/classement', cle: 'nav.classements' },
  { href: '/matchs', cle: 'nav.matchs' },
  { href: '/reglement', cle: 'nav.reglement' },
  // En dernier, et en orange : c'est le bouton de la barre (16/10/2026).
  { href: '/boutique', cle: 'nav.boutique' },
]

function langueDe(chemin: string): Locale {
  const premier = chemin.split('/')[1]
  return estLocale(premier) ? premier : LANGUE_DEFAUT
}

/** La même page dans l'autre langue : changer de langue ne fait pas perdre sa place. */
function versLautreLangue(chemin: string, locale: Locale): string {
  const autre: Locale = locale === 'fr' ? 'en' : 'fr'
  const morceaux = chemin.split('/')
  if (estLocale(morceaux[1])) {
    morceaux[1] = autre
    return morceaux.join('/')
  }
  return lien(autre, chemin)
}

function estActif(href: string, chemin: string) {
  return chemin === href || chemin.startsWith(`${href}/`)
}

export function NavS2() {
  const chemin = usePathname()
  const locale = langueDe(chemin)
  const { ip, discord, promo } = useReglages()
  // La bulle de promo (réglée dans /admin/promo) : affichage seulement, cf. promo.ts.
  const bulle = promoEnCours(promo) && promo.bulle ? promo.bulle : null
  const statut = useStatutServeur(true)
  const [ouvert, setOuvert] = useState(false)

  // Le panneau se referme à chaque navigation.
  useEffect(() => setOuvert(false), [chemin])

  const autre = locale === 'fr' ? 'EN' : 'FR'

  return (
    <header className="sticky top-0 z-70 border-b border-bord bg-nuit/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-3 px-4 sm:px-6 lg:gap-6">
        <Link href={lien(locale, '/')} className="flex shrink-0 items-center transition-transform hover:scale-[1.04]" aria-label="LJKITS">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marque/ljkits-96.webp" alt="LJKITS" width={97} height={33} className="h-[33px] w-auto drop-shadow-[0_3px_10px_rgba(254,147,1,.25)]" />
        </Link>

        <nav className="hidden items-center gap-1 min-[900px]:flex" aria-label="Navigation">
          {LIENS.map((l) => {
            const href = lien(locale, l.href)
            const actif = estActif(href, chemin)
            // La boutique est mise en avant, à l'orange du site (16/10/2026).
            if (l.href === '/boutique') {
              return (
                <span key={l.href} className="relative ml-1 inline-flex">
                  <Link
                    href={href}
                    aria-current={actif ? 'page' : undefined}
                    className={`reflet inline-flex items-center gap-1.5 rounded-[6px] border px-3 py-[7px] text-[14.5px] font-bold transition-colors ${
                      actif
                        ? 'border-soupe bg-soupe text-encre'
                        : 'border-soupe/45 bg-soupe/12 text-soupe hover:border-soupe hover:bg-soupe hover:text-encre'
                    }`}
                  >
                    <IconePanier />
                    {ts(locale, l.cle)}
                  </Link>
                  {bulle && <BullePromo texte={bulle} />}
                </span>
              )
            }
            return (
              <Link
                key={l.href}
                href={href}
                aria-current={actif ? 'page' : undefined}
                className={`relative rounded-[6px] px-3 py-2 text-[14.5px] font-semibold transition-colors ${
                  actif ? 'bg-braise text-creme' : 'text-gris hover:bg-braise/60 hover:text-creme'
                }`}
              >
                {ts(locale, l.cle)}
              </Link>
            )
          })}
        </nav>

        <RechercheNav className="ml-auto hidden w-[220px] min-[900px]:block xl:w-[260px]" />

        <div className="ml-auto flex items-center gap-2 min-[900px]:ml-0">
          <Link
            href={versLautreLangue(chemin, locale)}
            hrefLang={autre.toLowerCase()}
            className="hidden h-10 items-center rounded-[6px] border border-bord px-2.5 font-mono text-[12px] font-bold text-gris hover:border-gris hover:text-creme min-[900px]:inline-flex"
          >
            {autre}
          </Link>
          <a
            href={discord}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
            className="hidden size-10 items-center justify-center rounded-[6px] border border-bord text-gris hover:border-[#5865f2] hover:text-[#8b95ff] min-[900px]:inline-flex"
          >
            <IconeDiscord className="size-[18px] fill-current" />
          </a>
          <BoutonCopieIp
            aria-label={`${ts(locale, 'nav.copier')} — ${ip}`}
            className="group inline-flex h-10 items-center gap-2.5 rounded-[6px] bg-gradient-to-b from-or to-soupe pr-3.5 pl-3 text-[14px] font-bold text-encre shadow-[0_6px_20px_-8px_rgba(254,147,1,.7)] transition-[filter] hover:brightness-110"
          >
            <span
              className={`size-2 rounded-full ${statut?.enLigne ? 'bg-[#0d7a1f]' : 'bg-encre/40'}`}
              aria-hidden
            />
            <span className="hidden sm:inline">{ip}</span>
            <span className="sm:hidden">{ts(locale, 'nav.jouer')}</span>
            {statut?.enLigne && (
              <span className="rounded-[4px] bg-encre/15 px-1.5 py-0.5 font-mono text-[11.5px]">{statut.joueurs}</span>
            )}
          </BoutonCopieIp>
          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            aria-expanded={ouvert}
            aria-controls="panneau-nav"
            aria-label={ts(locale, 'nav.menu')}
            className="relative inline-flex size-10 items-center justify-center rounded-[6px] border border-bord text-creme min-[900px]:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              {ouvert ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
            {bulle && !ouvert && <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-oni ring-2 ring-nuit" aria-hidden />}
          </button>
        </div>
      </div>

      {ouvert && (
        <div id="panneau-nav" className="border-t border-bord bg-nuit px-4 pt-3 pb-5 min-[900px]:hidden">
          <RechercheNav />
          <nav className="mt-3 grid gap-1" aria-label="Navigation">
            {LIENS.map((l) => {
              const href = lien(locale, l.href)
              return (
                <Link
                  key={l.href}
                  href={href}
                  className={`flex items-center gap-2 rounded-[6px] px-3 py-3 text-[16px] font-semibold ${
                    l.href === '/boutique'
                      ? 'border border-soupe/50 bg-soupe/12 font-bold text-soupe'
                      : estActif(href, chemin)
                        ? 'bg-braise text-creme'
                        : 'text-gris'
                  }`}
                >
                  {l.href === '/boutique' && <IconePanier />}
                  {ts(locale, l.cle)}
                  {l.href === '/boutique' && bulle && (
                    <span className="ml-auto rounded-full bg-oni px-2 py-0.5 text-[12px] font-extrabold text-white">{bulle}</span>
                  )}
                </Link>
              )
            })}
          </nav>
          <div className="mt-3 flex gap-2">
            <a
              href={discord}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[6px] bg-[#5865f2] font-semibold text-white"
            >
              <IconeDiscord className="size-[18px] fill-current" />
              Discord
            </a>
            <Link
              href={versLautreLangue(chemin, locale)}
              className="inline-flex h-11 items-center justify-center rounded-[6px] border border-bord px-4 font-mono text-[13px] font-bold text-creme"
            >
              {autre}
            </Link>
          </div>
          <p className="mt-3 text-center text-[13px] text-gris">
            {statut == null
              ? ip
              : statut.enLigne
                ? `${ip} · ${ts(locale, 'nav.en-ligne', { n: statut.joueurs })}`
                : ts(locale, 'nav.hors-ligne')}
          </p>
        </div>
      )}
    </header>
  )
}

/** Le petit sac de la boutique. */
function IconePanier() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="M4 7h12l-1 10H5z" />
      <path d="M7.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
    </svg>
  )
}

/** La bulle de promo, accrochée au coin du bouton Boutique. */
function BullePromo({ texte }: { texte: string }) {
  return (
    <span className="bulle-promo pointer-events-none absolute -top-2.5 -right-3 rounded-full bg-oni px-1.5 py-[2px] text-[10.5px] leading-none font-extrabold whitespace-nowrap text-white shadow-[0_4px_12px_rgba(233,40,19,.55)] ring-2 ring-nuit">
      {texte}
    </span>
  )
}
