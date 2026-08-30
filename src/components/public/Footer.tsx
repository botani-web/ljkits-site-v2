import Image from 'next/image'
import Link from 'next/link'

import { BoutonCopieIp, ToastCopie } from '@/components/public/CopieIp'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { lireReglages } from '@/lib/reglages'

/**
 * Pied de page commun à toutes les pages publiques.
 *
 * Grille « 2fr 1fr 1fr 1fr » : la marque occupe le double d'une colonne de
 * liens. Sous 1024px elle passe sur sa propre ligne, pleine largeur, et les
 * trois colonnes de liens se serrent en dessous.
 *
 * Il embarque le toast de copie d'IP, monté une seule fois par page.
 */
export async function Footer() {
  const { ip, discord } = await lireReglages()
  const annee = new Date().getFullYear()

  return (
    <>
      <footer className="border-t border-bord bg-charbon pt-[clamp(46px,6vw,64px)]">
        <Enveloppe>
          <div className="grid gap-9 min-[560px]:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <div className="min-[560px]:col-span-2 lg:col-span-1">
              <Link
                href="/"
                aria-label="LJKITS — retour à l’accueil"
                className="inline-flex items-center"
              >
                <Image
                  src="/logo-texte.png"
                  alt="LJKITS"
                  width={71}
                  height={24}
                  className="mb-4"
                />
              </Link>
              <p className="max-w-[34ch] text-sm text-gris">
                Le PvP Soup à l’ancienne. Un projet passion, sans pay-to-win, porté par la
                nostalgie du soup français de 2014.
              </p>
            </div>

            <ColonneFooter titre="Serveur">
              <LienFooter href="/kits">Les kits</LienFooter>
              <LienFooter href="/classement">Classement</LienFooter>
              <LienFooter href="/boutique">Boutique</LienFooter>
            </ColonneFooter>

            <ColonneFooter titre="Communauté">
              <a
                href={discord}
                target="_blank"
                rel="noopener noreferrer"
                className="-my-1 flex min-h-11 items-center text-[14.5px] text-gris transition-colors hover:text-creme"
              >
                Discord
              </a>
              <LienFooter href="/reglement">Règlement</LienFooter>
            </ColonneFooter>

            <ColonneFooter titre="Jouer">
              <BoutonCopieIp className="-my-1 flex min-h-11 items-center text-left text-[14.5px] text-gris transition-colors hover:text-creme">
                {ip}
              </BoutonCopieIp>
              <span className="flex min-h-11 items-center text-[14.5px] text-gris">
                Java 1.8 → 1.21+
              </span>
            </ColonneFooter>
          </div>

          <div className="mt-11 flex flex-wrap gap-x-6.5 gap-y-2.5 border-t border-bord pt-5.5 pb-7 font-mono text-[11px] text-gris">
            <span>© {annee} LJKITS</span>
            <span>
              Hommage indépendant, sans lien avec les anciens administrateurs de MJKits.
            </span>
            <span>
              Not an official Minecraft product. Not approved by or associated with Mojang or
              Microsoft.
            </span>
          </div>
        </Enveloppe>
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
      <h2 className="mb-3.5 font-mono text-[10.5px] font-bold tracking-[.2em] text-soupe uppercase">
        {titre}
      </h2>
      {children}
    </div>
  )
}

function LienFooter({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="-my-1 flex min-h-11 items-center text-[14.5px] text-gris transition-colors hover:text-creme"
    >
      {children}
    </Link>
  )
}
