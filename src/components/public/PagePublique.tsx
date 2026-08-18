import { Footer } from '@/components/public/Footer'
import { Nav } from '@/components/public/Nav'

/**
 * Enveloppe commune aux quatre pages publiques : barre de navigation en haut,
 * contenu, pied de page. Les pages d'administration ne l'utilisent pas.
 */
export function PagePublique({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  )
}
