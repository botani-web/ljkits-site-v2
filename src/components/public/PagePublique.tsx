import { FournisseurReglages } from '@/components/public/ContexteReglages'
import { NavS2 } from '@/components/s2/NavS2'
import { PiedS2 } from '@/components/s2/PiedS2'
import type { Locale } from '@/lib/i18n'
import { lireReglages } from '@/lib/reglages'

/**
 * Enveloppe commune aux pages publiques (barre et pied de la refonte S2 depuis le 16/10/2026) : barre de navigation en haut,
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
      <NavS2 />
      {children}
      <PiedS2 locale={locale} />
    </FournisseurReglages>
  )
}
