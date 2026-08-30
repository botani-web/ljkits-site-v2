import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { FormulaireConnexion } from '@/components/admin/FormulaireConnexion'
import { Panneau, SectionPanneau } from '@/components/ui/Panneau'
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
 *
 * ⚠ Seul l'habillage a changé. L'authentification, la Server Action
 * `connecter` et la redirection ci-dessous sont intactes.
 *
 * Pas de <PagePublique> ici : ni barre de navigation ni pied de page. C'est
 * une porte de service, pas une page du site — et elle ne doit proposer aucun
 * chemin vers la boutique ou le classement.
 */
export default async function PageConnexion() {
  // Déjà connecté : inutile de repasser par le formulaire.
  const session = await auth()
  if (session?.user) redirect('/admin/kits')

  return (
    <main className="halo-hero flex min-h-screen items-center justify-center px-gouttiere py-16">
      <div className="w-full max-w-[400px]">
        <Link
          href="/"
          className="mb-8 flex min-h-11 items-center justify-center"
          aria-label="Retour à l’accueil"
        >
          <Image src="/logo-texte.png" alt="LJKITS" width={88} height={30} priority />
        </Link>

        <Panneau ombre titre="Administration">
          <SectionPanneau dernier>
            <p className="mb-5 text-sm text-gris">
              Espace réservé. Connecte-toi pour gérer les kits et le règlement.
            </p>

            <FormulaireConnexion />
          </SectionPanneau>
        </Panneau>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className="-my-3.5 inline-flex min-h-11 items-center font-mono text-[11px] tracking-[.08em] text-gris uppercase transition-colors hover:text-creme"
          >
            <span aria-hidden="true">←</span>&nbsp;Retour au site
          </Link>
        </p>
      </div>
    </main>
  )
}
