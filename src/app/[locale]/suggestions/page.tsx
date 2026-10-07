import type { Metadata } from 'next'

import { FormulaireSuggestion } from '@/components/public/FormulaireSuggestion'
import { PagePublique } from '@/components/public/PagePublique'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { Etiquette } from '@/components/ui/TeteSection'
import { formaterDate } from '@/lib/format'
import { estLocale, LANGUE_DEFAUT, t, type Locale } from '@/lib/i18n'
import { saisonDu } from '@/lib/saison'

/**
 * LES SUGGESTIONS POUR LA SAISON 2 (07/10/2026).
 *
 * Lien partagé sur Discord. Une question de fond — qu'est-ce qui ferait
 * rester les joueurs — et une suggestion écrite obligatoire. Les réponses
 * se lisent dans /admin/suggestions et arrivent dans le salon staff via le bot.
 *
 * La date de fin vient de saisonDu() : elle reste juste si le calendrier
 * des saisons bouge.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const titre = t(locale, 'meta.sugg-titre')
  const description = t(locale, 'meta.sugg-desc')

  return {
    title: titre,
    description,
    alternates: { languages: { en: `/en/suggestions`, fr: `/fr/suggestions` } },
    openGraph: { title: `${titre} — LJKITS`, description },
  }
}

export default async function PageSuggestions({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const fin = formaterDate(saisonDu().fin, locale)

  return (
    <PagePublique locale={locale}>
      <header className="relative overflow-hidden pt-[clamp(28px,4vw,56px)] pb-[clamp(20px,3vw,36px)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(55% 70% at 20% 40%, #fe930126, transparent 70%), radial-gradient(40% 60% at 92% 0%, #fdc00312, transparent 70%)',
          }}
        />
        <Enveloppe className="relative max-w-[760px]">
          <Etiquette>{t(locale, 'sugg.etiquette')}</Etiquette>
          <h1 className="mt-3 font-titre text-[clamp(26px,5vw,44px)] leading-[1.05] text-creme">
            {t(locale, 'sugg.titre')}
          </h1>
          <p className="mt-4 max-w-[58ch] text-[clamp(15px,1.6vw,17px)] text-gris">
            {t(locale, 'sugg.chapeau').replace('{d}', fin)}
          </p>
          <p className="mt-3 font-mono text-[11.5px] tracking-[.1em] text-soupe uppercase">
            {t(locale, 'sugg.duree')}
          </p>
        </Enveloppe>
      </header>

      <section className="pb-section">
        <Enveloppe className="max-w-[760px]">
          <FormulaireSuggestion locale={locale} />
        </Enveloppe>
      </section>
    </PagePublique>
  )
}
