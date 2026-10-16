import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { PagePublique } from '@/components/public/PagePublique'
import { RecapMatch } from '@/components/s2/RecapMatch'
import { estLocale, LANGUE_DEFAUT, lien, type Locale } from '@/lib/i18n'
import { ts } from '@/lib/i18n-s2'
import { gradesEnCache, lireDuel } from '@/lib/joueurs'
import { lireMatch } from '@/lib/practice'
import { cheminMatchCourt, infosMode } from '@/lib/practice-commun'
import { IMAGE_OG } from '@/lib/site'

/** Ce que partagent /match/<id> et l'ancienne adresse /joueur/<pseudo>/match/<id>. */

const lireMatchCache = cache((id: string) => lireMatch(id))

export async function metadataMatch(id: string, brut: string): Promise<Metadata> {
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const m = await lireMatchCache(id)
  if (!m) return {}
  const mode = infosMode(m.mode).nom
  const titre = ts(locale, 'm.meta-titre', { g: m.gagnant.pseudo, p: m.perdant.pseudo, m: mode })
  const description = ts(locale, 'm.meta-desc', { m: mode })
  return {
    title: titre,
    description,
    alternates: { canonical: lien(locale, cheminMatchCourt(m.id)) },
    openGraph: { title: titre, description, images: IMAGE_OG },
  }
}

export async function PageRecap({ id, brut }: { id: string; brut: string }) {
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const m = await lireMatchCache(id)
  if (!m) notFound()
  const [grades, duel] = await Promise.all([
    gradesEnCache([m.gagnant.uuid, m.perdant.uuid]),
    lireDuel(m.saison, m.gagnant.uuid, m.perdant.uuid),
  ])
  return (
    <PagePublique locale={locale}>
      <RecapMatch m={m} locale={locale} grades={grades} duel={duel} />
    </PagePublique>
  )
}
