import type { Metadata } from 'next'

import { metadataMatch, PageRecap } from '@/components/s2/PageRecap'

/**
 * L'ANCIENNE ADRESSE D'UN MATCH (05/10/2026), vue depuis un profil.
 *
 * Ces liens ont circulé : ils affichent la même page que /match/<id>, dont
 * l'adresse courte est déclarée canonique.
 */
export const revalidate = 3600

/** Rien au build : chaque adresse est rendue à sa première visite, puis servie depuis le cache. */
export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ pseudo: string; id: string; locale: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id, locale } = await params
  return metadataMatch(id, locale)
}

export default async function PageMatchProfil({ params }: Params) {
  const { id, locale } = await params
  return <PageRecap id={id} brut={locale} />
}
