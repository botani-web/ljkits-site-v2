'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Les sections de l'administration. */
const ONGLETS = [
  { href: '/admin/kits', label: 'Kits' },
  { href: '/admin/grades', label: 'Grades' },
  { href: '/admin/packs', label: 'Packs' },
  { href: '/admin/commandes', label: 'Commandes' },
  { href: '/admin/reglement', label: 'Règlement' },
  { href: '/admin/reglages', label: 'Réglages' },
]

export function OngletsAdmin() {
  const chemin = usePathname()

  return (
    <nav className="mx-auto flex max-w-contenu gap-1 px-6">
      {ONGLETS.map((onglet) => {
        const actif = chemin.startsWith(onglet.href)

        return (
          <Link
            key={onglet.href}
            href={onglet.href}
            aria-current={actif ? 'page' : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              actif
                ? 'border-soupe text-soupe'
                : 'border-transparent text-gris hover:text-creme'
            }`}
          >
            {onglet.label}
          </Link>
        )
      })}
    </nav>
  )
}
