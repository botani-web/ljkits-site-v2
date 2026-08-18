'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Les deux sections de l'administration. */
const ONGLETS = [
  { href: '/admin/kits', label: 'Kits' },
  { href: '/admin/reglement', label: 'Règlement' },
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
