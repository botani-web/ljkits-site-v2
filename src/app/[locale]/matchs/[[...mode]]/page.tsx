import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PagePublique } from '@/components/public/PagePublique'
import { Conteneur, Panneau } from '@/components/s2/Briques'
import { LigneMatchNeutre } from '@/components/s2/LignesMatch'
import { OngletsModes } from '@/components/s2/Selecteurs'
import { cheminFlux } from '@/lib/chemins-s2'
import { estLocale, LANGUE_DEFAUT, lien, type Locale } from '@/lib/i18n'
import { ts } from '@/lib/i18n-s2'
import { gradesEnCache } from '@/lib/joueurs'
import { lireDerniersMatchsCache } from '@/lib/practice'
import { modesDeSaison, type Vue } from '@/lib/practice-commun'
import { saisonParDefaut } from '@/lib/saison'
import { IMAGE_OG } from '@/lib/site'

/**
 * LE FLUX DES DERNIERS MATCHS RANKED (refonte S2, 16/10/2026).
 *
 * Tous les modes ou un seul (/matchs/hg). Gardé 20 s par le CDN : assez frais
 * pour voir passer les matchs, sans lire la base à chaque visite.
 */
export const revalidate = 20

const NOMBRE = 60

type Params = { params: Promise<{ locale: string; mode?: string[] }> }

export function generateStaticParams() {
  const modes: (string[] | undefined)[] = [undefined, ...modesDeSaison(saisonParDefaut()).map((m) => [m.id])]
  return ['en', 'fr'].flatMap((locale) => modes.map((mode) => ({ locale, mode })))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const titre = ts(locale, 'f.meta-titre')
  const description = ts(locale, 'f.meta-desc')
  return { title: titre, description, openGraph: { title: titre, description, images: IMAGE_OG } }
}

export default async function PageFlux({ params }: Params) {
  const { locale: brut, mode: segments } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const saison = saisonParDefaut()
  const modes = modesDeSaison(saison)
  if ((segments?.length ?? 0) > 1) notFound()
  const mode = segments?.[0] ?? null
  if (mode && !modes.some((m) => m.id === mode)) notFound()

  const matchs = await lireDerniersMatchsCache(saison, NOMBRE, (mode ?? 'global') as Vue)
  const grades = await gradesEnCache([...new Set(matchs.flatMap((m) => [m.gagnant, m.perdant]))])

  const onglets = [
    { cle: 'tous', libelle: ts(locale, 'f.tous'), href: cheminFlux(null) },
    ...modes.map((m) => ({ cle: m.id, libelle: m.nom, href: cheminFlux(m.id), mode: m.id })),
  ]

  return (
    <PagePublique locale={locale}>
      <main className="pb-6">
        <section className="border-b border-bord bg-[radial-gradient(60%_120%_at_10%_0%,rgba(254,147,1,.09),transparent_70%)]">
          <Conteneur className="pt-9 pb-6 sm:pt-12">
            <h1 className="entree text-[30px] leading-tight font-extrabold tracking-[-.02em] text-creme sm:text-[38px]">{ts(locale, 'f.titre')}</h1>
            <p className="mt-1.5 text-[15px] text-gris">
              {ts(locale, 'f.sous', { n: NOMBRE })} · {ts(locale, 'c.saison', { n: saison })}
            </p>
          </Conteneur>
          <Conteneur>
            <OngletsModes onglets={onglets} actif={mode ?? 'tous'} locale={locale} />
          </Conteneur>
        </section>
        <Conteneur className="pt-6">
          <Panneau className="cascade cascade-defilement overflow-hidden">
            {matchs.length === 0 ? (
              <p className="px-4 py-12 text-center text-[14.5px] text-gris">{ts(locale, 'f.vide')}</p>
            ) : (
              matchs.map((m) => <LigneMatchNeutre key={m.id} m={m} locale={locale} grades={grades} />)
            )}
          </Panneau>
          <p className="mt-3 text-[12.5px] text-gris">
            <Link href={lien(locale, '/classement')} className="hover:text-creme">
              {ts(locale, 'nav.classements')} →
            </Link>
          </p>
        </Conteneur>
      </main>
    </PagePublique>
  )
}
