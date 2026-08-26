import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { deconnecter } from '@/actions/auth'
import { OngletsAdmin } from '@/components/admin/OngletsAdmin'
import { Badge } from '@/components/ui/Badge'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: { default: 'Administration', template: '%s — Admin LJKITS' },
  robots: { index: false, follow: false },
}

/**
 * Enveloppe de toutes les pages /admin.
 *
 * La redirection ci-dessous protège l'AFFICHAGE. Elle ne protège pas les
 * Server Actions, qui sont des routes HTTP indépendantes appelables sans
 * jamais charger ce layout : chacune refait sa propre vérification avec
 * exigerAdmin() (cf. src/actions/garde.ts).
 *
 * ⚠ La structure de cet en-tête n'a pas bougé d'un cran à la refonte : même
 * disposition, mêmes éléments, onglets au même endroit. Seul l'habillage suit
 * le système du site public.
 */
export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/connexion')

  return (
    <div className="min-h-screen">
      <header className="border-b border-bord bg-charbon">
        <div className="mx-auto flex max-w-contenu flex-wrap items-center justify-between gap-4 px-gouttiere py-3.5">
          <div className="flex items-center gap-4">
            {/* min-h-11 : le logo ne fait que 20 px de haut, le lien qui le
                porte doit rester une cible tactile de 44 px. */}
            <Link href="/" aria-label="Voir le site" className="flex min-h-11 items-center">
              <Image src="/logo-texte.png" alt="LJKITS" width={73} height={20} />
            </Link>
            <Badge>Admin</Badge>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center font-mono text-[11px] tracking-[.08em] text-gris uppercase transition-colors hover:text-creme"
            >
              Voir le site <span aria-hidden="true">↗</span>
            </Link>

            <span className="hidden font-mono text-[11px] text-gris sm:inline">
              {session.user.email}
            </span>

            <form action={deconnecter}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-controle border border-bord px-3 font-mono text-[11px] font-bold tracking-[.08em] text-gris uppercase transition-colors hover:border-rouge hover:text-rouge"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>

        <OngletsAdmin />
      </header>

      <main className="mx-auto max-w-contenu px-gouttiere py-8">{children}</main>
    </div>
  )
}
