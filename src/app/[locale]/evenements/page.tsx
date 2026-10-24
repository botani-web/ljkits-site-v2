import type { Metadata } from 'next'

import { PagePublique } from '@/components/public/PagePublique'
import { Conteneur, TitreSection } from '@/components/s2/Briques'
import { CarteEvenement } from '@/components/s2/Evenements'
import { RafraichirAuto } from '@/components/s2/RafraichirAuto'
import { lireEvenementsPublics } from '@/lib/evenements'
import { estLocale, LANGUE_DEFAUT, type Locale } from '@/lib/i18n'
import { te } from '@/lib/i18n-evenements'
import { IMAGE_OG } from '@/lib/site'

/**
 * LES ÉVÉNEMENTS (24/10/2026) : en direct, à venir, terminés. Gardée 20 s par le CDN.
 */
export const revalidate = 20

type Params = { params: Promise<{ locale: string }> }

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fr' }]
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const titre = te(locale, 'meta.titre')
  const description = te(locale, 'meta.desc')
  return { title: titre, description, openGraph: { title: titre, description, images: IMAGE_OG } }
}

export default async function PageEvenements({ params }: Params) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  let tous: Awaited<ReturnType<typeof lireEvenementsPublics>> = []
  try {
    tous = await lireEvenementsPublics()
  } catch {
    tous = []
  }
  const direct = tous.filter((r) => r.statut === 'en-direct')
  const avenir = tous.filter((r) => r.statut === 'a-venir').reverse()
  const passes = tous.filter((r) => r.statut === 'termine')
  const groupes = [
    { cle: 'liste.direct' as const, l: direct },
    { cle: 'liste.avenir' as const, l: avenir },
    { cle: 'liste.passes' as const, l: passes },
  ].filter((g) => g.l.length > 0)

  return (
    <PagePublique locale={locale}>
      {direct.length > 0 && <RafraichirAuto />}
      <main className="pb-10">
        <section className="border-b border-bord bg-[radial-gradient(60%_120%_at_10%_0%,rgba(254,147,1,.09),transparent_70%)]">
          <Conteneur className="pt-9 pb-7 sm:pt-12">
            <h1 className="entree text-[30px] leading-tight font-extrabold tracking-[-.02em] text-creme sm:text-[38px]">{te(locale, 'liste.titre')}</h1>
            <p className="mt-1.5 max-w-[640px] text-[15px] text-gris">{te(locale, 'liste.sous')}</p>
          </Conteneur>
        </section>
        <Conteneur className="flex flex-col gap-9 pt-7">
          {groupes.length === 0 && <p className="py-12 text-center text-[14.5px] text-gris">{te(locale, 'liste.vide')}</p>}
          {groupes.map((g) => (
            <section key={g.cle}>
              <TitreSection titre={te(locale, g.cle)} />
              <div className="cascade flex flex-col gap-3">
                {g.l.map((r) => (
                  <CarteEvenement key={r.evenement.id} r={r} locale={locale} />
                ))}
              </div>
            </section>
          ))}
        </Conteneur>
      </main>
    </PagePublique>
  )
}
