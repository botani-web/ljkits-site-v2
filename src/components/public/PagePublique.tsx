import { FournisseurReglages } from '@/components/public/ContexteReglages'
import { Footer } from '@/components/public/Footer'
import { Nav } from '@/components/public/Nav'
import type { Locale } from '@/lib/i18n'
import { lireReglages } from '@/lib/reglages'

/**
 * Enveloppe commune aux quatre pages publiques : barre de navigation en haut,
 * contenu, pied de page. Les pages d'administration ne l'utilisent pas.
 *
 * C'est aussi ici que les réglages sont lus une fois et mis à disposition des
 * composants client (nav, bouton de copie de l'IP, statut du serveur).
 */
export async function PagePublique({
  children,
  locale,
}: {
  children: React.ReactNode
  locale: Locale
}) {
  const reglages = await lireReglages()

  return (
    <FournisseurReglages reglages={reglages}>
      <Nav />
      {children}
      <Footer locale={locale} />
    </FournisseurReglages>
  )
}
