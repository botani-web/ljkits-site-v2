'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { BoutonCopieIp } from '@/components/public/CopieIp'
import { IconeDiscord } from '@/components/public/IconeDiscord'
import { SITE } from '@/lib/site'

/**
 * Barre de navigation du site public — la barre flottante d'index.html.
 *
 * Les maquettes en proposaient deux variantes (flottante sur l'accueil et le
 * règlement, collée en haut sur les kits) : on garde la flottante, majoritaire,
 * pour que la navigation soit identique d'une page à l'autre.
 *
 * Composant client uniquement pour usePathname(), qui met en or le lien de la
 * page courante.
 */
const LIENS = [
  { href: '/#jouer', label: 'Jouer' },
  { href: '/kits', label: 'Kits' },
  { href: '/boutique', label: 'Boutique' },
  { href: '/#vote', label: 'Voter' },
  { href: '/reglement', label: 'Règlement' },
]

export function Nav() {
  const chemin = usePathname()

  return (
    <nav className="fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-contenu items-center justify-between rounded-2xl border border-bord bg-nuit/85 px-5.5 py-3 backdrop-blur-xl">
      <Link href="/" aria-label="LJKITS — retour à l’accueil" className="flex items-center">
        <Image src="/logo-texte.png" alt="LJKITS" width={81} height={22} priority />
      </Link>

      <div className="hidden gap-7 text-[15px] font-semibold md:flex">
        {LIENS.map((lien) => {
          // Un lien est actif si le chemin correspond ; les ancres de l'accueil
          // (/#jouer) ne sont actives que sur l'accueil elle-même.
          const actif = lien.href.startsWith('/#')
            ? chemin === '/'
            : chemin === lien.href || chemin.startsWith(`${lien.href}/`)

          return (
            <Link
              key={lien.href}
              href={lien.href}
              className={`transition-colors ${actif ? 'text-or' : 'text-gris hover:text-creme'}`}
            >
              {lien.label}
            </Link>
          )
        })}
      </div>

      <div className="flex items-center gap-2.5">
        <a
          href={SITE.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-[10px] bg-discord px-4.5 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#6a76f5] hover:shadow-[0_4px_18px_rgba(88,101,242,.35)]"
        >
          <IconeDiscord className="size-4.5 fill-white" />
          <span className="hidden sm:inline">Discord</span>
        </a>

        <BoutonCopieIp
          aria-label={`Copier l’adresse du serveur, ${SITE.ip}`}
          className="rounded-[10px] bg-linear-[135deg] from-soupe to-or px-5 py-2.5 text-sm font-extrabold tracking-wide text-[#1A1005] transition-shadow hover:shadow-[0_4px_18px_rgba(254,147,1,.45)]"
        >
          JOUER
        </BoutonCopieIp>
      </div>
    </nav>
  )
}
