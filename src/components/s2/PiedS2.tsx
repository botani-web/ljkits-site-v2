import Link from 'next/link'

import { BoutonCopieIp, ToastCopie } from '@/components/public/CopieIp'
import { Conteneur } from '@/components/s2/Briques'
import { lien, t, type Locale } from '@/lib/i18n'
import { ts } from '@/lib/i18n-s2'
import { lireReglages } from '@/lib/reglages'

/** Le pied de page de la refonte (16/10/2026) : la marque et trois colonnes de liens. */
export async function PiedS2({ locale }: { locale: Locale }) {
  const { ip, discord } = await lireReglages()

  return (
    <>
      <footer className="mt-20 border-t border-bord bg-charbon/60">
        <Conteneur className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={lien(locale, '/')} className="inline-flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marque/icone-48.png" alt="" width={40} height={40} loading="lazy" className="rounded-[9px]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marque/ljkits-96.webp" alt="LJKITS" width={103} height={35} loading="lazy" className="h-[35px] w-auto" />
            </Link>
            <p className="mt-3 max-w-[38ch] text-[14px] leading-relaxed text-gris">{ts(locale, 'pied.baseline')}</p>
            <BoutonCopieIp className="mt-4 inline-flex items-center gap-2 rounded-[6px] border border-bord bg-nuit px-3 py-2 font-mono text-[13.5px] font-bold text-or hover:border-or/60">
              {ip}
            </BoutonCopieIp>
          </div>

          <Colonne titre={ts(locale, 'pied.jeu')}>
            <Lien href={lien(locale, '/classement')}>{ts(locale, 'nav.classements')}</Lien>
            <Lien href={lien(locale, '/matchs')}>{ts(locale, 'nav.matchs')}</Lien>
            <Lien href={lien(locale, '/evenements')}>{ts(locale, 'nav.evenements')}</Lien>
            <Lien href={lien(locale, '/boutique')}>{ts(locale, 'nav.boutique')}</Lien>
          </Colonne>

          <Colonne titre={ts(locale, 'pied.communaute')}>
            <a href={discord} target="_blank" rel="noopener noreferrer" className="block py-1.5 text-[14px] text-gris hover:text-creme">
              Discord
            </a>
            <Lien href={lien(locale, '/suggestions')}>{ts(locale, 'pied.suggestions')}</Lien>
            <Lien href={lien(locale, '/avis')}>{ts(locale, 'pied.avis')}</Lien>
            <Lien href={lien(locale, '/recrutement')}>{ts(locale, 'pied.recrutement')}</Lien>
          </Colonne>

          <Colonne titre={ts(locale, 'pied.serveur')}>
            <Lien href={lien(locale, '/reglement')}>{ts(locale, 'nav.reglement')}</Lien>
            <Lien href={lien(locale, '/ljscan')}>{ts(locale, 'pied.ljscan')}</Lien>
            <span className="block py-1.5 text-[14px] text-gris">{ts(locale, 'pied.versions')}</span>
          </Colonne>
        </Conteneur>

        <div className="border-t border-bord">
          <Conteneur className="flex flex-wrap gap-x-6 gap-y-1.5 py-5 text-[12px] text-gris/80">
            <span>© {new Date().getFullYear()} LJKITS</span>
            <span>{t(locale, 'pied.mojang')}</span>
          </Conteneur>
        </div>
      </footer>
      <ToastCopie />
    </>
  )
}

function Colonne({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-[12px] font-bold uppercase tracking-[.12em] text-creme">{titre}</h2>
      {children}
    </div>
  )
}

function Lien({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block py-1.5 text-[14px] text-gris hover:text-creme">
      {children}
    </Link>
  )
}
