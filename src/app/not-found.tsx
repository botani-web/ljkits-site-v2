import Link from 'next/link'

import { PagePublique } from '@/components/public/PagePublique'

/** Page 404 : kit inexistant, kit masqué, adresse mal tapée. */
export default function PageIntrouvable() {
  return (
    <PagePublique>
      <main className="halo-hero mx-auto max-w-lecture px-6 pt-[170px] pb-28 text-center">
        <p className="mb-3.5 font-mono text-xs font-bold tracking-[3px] text-oni uppercase">
          Erreur 404
        </p>
        <h1 className="font-titre text-[clamp(30px,5vw,54px)] uppercase">
          Page <span className="texte-accent">introuvable</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[480px] text-gris">
          Cette page n’existe pas, ou plus. Le kit que tu cherchais a peut-être été retiré.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-linear-[135deg] from-soupe to-or px-5 py-2.5 text-sm font-bold text-[#1A1005]"
          >
            Retour à l’accueil
          </Link>
          <Link
            href="/kits"
            className="rounded-lg border border-bord px-5 py-2.5 text-sm font-semibold text-gris transition-colors hover:text-creme"
          >
            Voir les kits
          </Link>
        </div>
      </main>
    </PagePublique>
  )
}
