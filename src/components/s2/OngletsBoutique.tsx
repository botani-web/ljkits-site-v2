import Link from 'next/link'

import { IconeCoins } from '@/components/s2/IconeCoins'
import { lien, type Locale } from '@/lib/i18n'
import { ts } from '@/lib/i18n-s2'

/** Les deux rayons, dans le style des onglets de modes du classement (16/10/2026). */
export function OngletsBoutique({
  actif,
  locale,
  promo = 0,
  promoCoins = 0,
}: {
  actif: 'coins' | 'grades'
  locale: Locale
  /** Réduction affichée sur chaque rayon (bulle sur l'onglet). */
  promo?: number
  promoCoins?: number
}) {
  // 16/10/2026 : les GRADES d'abord — c'est ce que la boutique montre en arrivant.
  const onglets = [
    {
      cle: 'grades' as const,
      href: '/boutique',
      libelle: ts(locale, 'b.onglet-grades'),
      reduction: promo,
      // eslint-disable-next-line @next/next/no-img-element
      icone: <img src="/items/items-nether_star.png" alt="" width={20} height={20} className="[image-rendering:pixelated]" />,
    },
    { cle: 'coins' as const, href: '/boutique/coins', libelle: ts(locale, 'b.onglet-coins'), reduction: promoCoins, icone: <IconeCoins niveau={2} taille={22} /> },
  ]
  return (
    <nav className="flex gap-1 border-b border-bord" aria-label={ts(locale, 'b.titre')}>
      {onglets.map((o) => {
        const estActif = o.cle === actif
        return (
          <Link
            key={o.cle}
            href={lien(locale, o.href)}
            aria-current={estActif ? 'page' : undefined}
            className={`relative inline-flex h-12 items-center gap-2.5 px-4 text-[16px] font-bold transition-colors ${
              estActif ? 'text-creme' : 'text-gris hover:text-creme'
            }`}
          >
            {o.icone}
            {o.libelle}
            {o.reduction > 0 && <span className="rounded-full bg-oni px-1.5 py-0.5 text-[10.5px] font-extrabold text-white">-{o.reduction}%</span>}
            {estActif && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-or" aria-hidden />}
          </Link>
        )
      })}
    </nav>
  )
}
