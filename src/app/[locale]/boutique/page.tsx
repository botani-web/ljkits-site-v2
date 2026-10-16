import type { Metadata } from 'next'

import { metadataBoutique, PageBoutique } from '@/components/s2/PageBoutique'

/** LA BOUTIQUE, RAYON COINS (refonte S2, 16/10/2026). Les prix changent rarement : une heure de cache. */
export const revalidate = 3600

type Params = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params
  return metadataBoutique(locale, 'coins')
}

export default async function PageBoutiqueCoins({ params }: Params) {
  const { locale } = await params
  return <PageBoutique brut={locale} rayon="coins" />
}
