import Image from 'next/image'
import Link from 'next/link'

import { BoutonCopieIp, ToastCopie } from '@/components/public/CopieIp'
import { SITE } from '@/lib/site'

/**
 * Pied de page commun à toutes les pages publiques.
 * Il embarque le toast de copie d'IP, monté une seule fois par page.
 */
export function Footer() {
  const annee = new Date().getFullYear()

  return (
    <>
      <footer className="mt-10 border-t border-bord bg-charbon px-6 pt-13 pb-9">
        <div className="mx-auto flex max-w-contenu flex-wrap justify-between gap-8">
          <div className="max-w-[340px]">
            <Link href="/" aria-label="LJKITS — retour à l’accueil">
              <Image
                src="/logo-texte.png"
                alt="LJKITS"
                width={81}
                height={22}
                className="mb-3.5"
              />
            </Link>
            <p className="text-[14.5px] text-gris">
              Le PvP Soup à l’ancienne. Un projet passion, sans pay-to-win, porté par la
              nostalgie du soup français de 2014.
            </p>
          </div>

          <ColonneFooter titre="Serveur">
            <LienFooter href="/#jouer">Comment jouer</LienFooter>
            <LienFooter href="/kits">Les kits</LienFooter>
            <LienFooter href="/boutique">Boutique</LienFooter>
            <LienFooter href="/#vote">Voter</LienFooter>
            <LienFooter href="/classement">Classement</LienFooter>
          </ColonneFooter>

          <ColonneFooter titre="Communauté">
            <a
              href={SITE.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2.5 block text-[15px] text-creme opacity-85 transition hover:text-or hover:opacity-100"
            >
              Discord
            </a>
            <LienFooter href="/reglement">Règlement</LienFooter>
          </ColonneFooter>

          <ColonneFooter titre="Jouer">
            <BoutonCopieIp className="mb-2.5 block text-left text-[15px] text-creme opacity-85 transition hover:text-or hover:opacity-100">
              {SITE.ip}
            </BoutonCopieIp>
            <span className="block text-[15px] text-creme opacity-85">Java 1.8 → 1.21+</span>
          </ColonneFooter>
        </div>

        <div className="mx-auto mt-10 flex max-w-contenu flex-wrap justify-between gap-4 border-t border-bord pt-6 text-[13px] text-gris">
          <span>
            © {annee} LJKITS — Hommage indépendant, sans lien avec les anciens
            administrateurs de MJKits.
          </span>
          <span>Non affilié à Mojang ni Microsoft.</span>
        </div>
      </footer>

      <ToastCopie />
    </>
  )
}

function ColonneFooter({
  titre,
  children,
}: {
  titre: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="mb-4 text-xs font-bold tracking-[2px] text-gris uppercase">{titre}</h2>
      {children}
    </div>
  )
}

function LienFooter({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-2.5 block text-[15px] text-creme opacity-85 transition hover:text-or hover:opacity-100"
    >
      {children}
    </Link>
  )
}
