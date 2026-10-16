import type { Metadata } from 'next'

import { metadataBoutique, PageBoutique } from '@/components/s2/PageBoutique'

/** LA BOUTIQUE, RAYON GRADES (par défaut depuis le 16/10/2026) (refonte S2, 16/10/2026). Gardée 5 min : la promo s'éteint seule à sa date de fin. */
export const revalidate = 300

type Params = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params
  return metadataBoutique(locale, 'grades')
}

export default async function PageBoutiqueGrades({ params }: Params) {
  const { locale } = await params
  return <PageBoutique brut={locale} rayon="grades" />
}
