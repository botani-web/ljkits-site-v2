import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { metadataProfil, PageProfil } from '@/components/s2/PageProfil'
import { lireSegmentSaison } from '@/lib/chemins-s2'

/** LE PROFIL D'UN JOUEUR DANS UNE SAISON PRÉCISE : /joueur/<pseudo>/saison-N (16/10/2026). */
export const revalidate = 60

/** Rien au build : chaque adresse est rendue à sa première visite, puis servie depuis le cache. */
export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ locale: string; pseudo: string; saison: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, pseudo, saison } = await params
  const n = lireSegmentSaison(saison)
  return n == null ? {} : metadataProfil(pseudo, locale, n)
}

export default async function PageJoueurSaison({ params }: Params) {
  const { locale, pseudo, saison } = await params
  const n = lireSegmentSaison(saison)
  if (n == null) notFound()
  return <PageProfil pseudo={pseudo} brut={locale} saison={n} />
}
