import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FormulaireConnexion } from '@/components/admin/FormulaireConnexion'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Connexion',
  // Cette page n'a rien à faire dans les moteurs de recherche.
  robots: { index: false, follow: false },
}

/**
 * Formulaire de connexion à l'administration.
 *
 * Volontairement placé HORS de /admin : ainsi la règle « tout ce qui commence
 * par /admin exige une session » n'a aucune exception à gérer.
 */
export default async function PageConnexion() {
  // Déjà connecté : inutile de repasser par le formulaire.
  const session = await auth()
  if (session?.user) redirect('/admin/kits')

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="mb-8 flex min-h-11 items-center justify-center" aria-label="Retour à l’accueil">
          <Image src="/logo-texte.png" alt="LJKITS" width={110} height={30} priority />
        </Link>

        <div className="rounded-2xl border border-bord bg-charbon px-7 py-8">
          <h1 className="mb-1.5 font-titre text-xl uppercase">Administration</h1>
          <p className="mb-6 text-sm text-gris">
            Espace réservé. Connecte-toi pour gérer les kits et le règlement.
          </p>

          <FormulaireConnexion />
        </div>

        <p className="mt-6 text-center text-[13px] text-gris">
          <Link
            href="/"
            className="-my-3.5 inline-flex min-h-11 items-center transition-colors hover:text-creme"
          >
            ← Retour au site
          </Link>
        </p>
      </div>
    </main>
  )
}
