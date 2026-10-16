import type { Metadata } from 'next'

import { metadataProfil, PageProfil } from '@/components/s2/PageProfil'
import { lireClassement } from '@/lib/practice'
import { saisonParDefaut } from '@/lib/saison'

/**
 * LE PROFIL D'UN JOUEUR, SAISON PAR DÉFAUT (refonte S2, 16/10/2026).
 *
 * Gardé 60 s par le CDN. Le top 100 global est pré-rendu au build ; les autres
 * profils le sont à leur première visite, puis servis depuis le cache.
 */
export const revalidate = 60

type Params = { params: Promise<{ locale: string; pseudo: string }> }

export async function generateStaticParams() {
  try {
    const top = await lireClassement(saisonParDefaut(), 'global', 100)
    return ['en', 'fr'].flatMap((locale) => top.map((j) => ({ locale, pseudo: j.pseudo })))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, pseudo } = await params
  return metadataProfil(pseudo, locale, null)
}

export default async function PageJoueur({ params }: Params) {
  const { locale, pseudo } = await params
  return <PageProfil pseudo={pseudo} brut={locale} saison={null} />
}
