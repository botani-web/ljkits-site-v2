import type { Metadata } from 'next'

import { metadataMatch, PageRecap } from '@/components/s2/PageRecap'
import { lireDerniersMatchs } from '@/lib/practice'
import { saisonParDefaut } from '@/lib/saison'

/**
 * LE RÉCAP D'UN MATCH, À SON ADRESSE COURTE (refonte S2, 16/10/2026).
 *
 * Un match terminé ne change plus (sauf une annulation par le staff, rare) : la
 * page est gardée une heure par le CDN. Les 120 derniers matchs sont pré-rendus
 * au build, les autres le sont à la première visite puis servis en cache.
 * L'ancienne adresse /joueur/<pseudo>/match/<id> affiche la même page.
 */
export const revalidate = 3600

type Params = { params: Promise<{ id: string; locale: string }> }

export async function generateStaticParams() {
  try {
    const recents = await lireDerniersMatchs(saisonParDefaut(), 120)
    return ['en', 'fr'].flatMap((locale) => recents.map((m) => ({ locale, id: m.id })))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id, locale } = await params
  return metadataMatch(id, locale)
}

export default async function PageMatch({ params }: Params) {
  const { id, locale } = await params
  return <PageRecap id={id} brut={locale} />
}
