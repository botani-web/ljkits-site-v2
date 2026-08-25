'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Les sections de l'administration. Le tableau de bord ouvre la marche. */
const ONGLETS = [
  { href: '/admin', label: 'Tableau de bord' },
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
    // Six onglets ne tiennent pas dans 360 px. Défilement horizontal plutôt que
    // retour à la ligne : la barre garde une hauteur d'une ligne sur toutes les
    // largeurs, et le trait actif reste sur la même ligne que le contenu.
    <nav className="mx-auto flex max-w-contenu gap-1 overflow-x-auto px-6">
      {ONGLETS.map((onglet) => {
        // Le tableau de bord est la racine : tout /admin/* commence par
        // « /admin », il ne serait jamais désélectionné avec un simple
        // startsWith. On exige donc l'égalité pour lui, le préfixe pour le reste.
        const actif =
          onglet.href === '/admin' ? chemin === '/admin' : chemin.startsWith(onglet.href)

        return (
          <Link
            key={onglet.href}
            href={onglet.href}
            aria-current={actif ? 'page' : undefined}
            className={`-mb-px flex min-h-11 shrink-0 items-center border-b-2 px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
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
