import type { Metadata } from 'next'

import { PagePublique } from '@/components/public/PagePublique'
import { TestClics } from '@/components/public/TestClics'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { Etiquette } from '@/components/ui/TeteSection'
import { estLocale, LANGUE_DEFAUT, t, type Locale } from '@/lib/i18n'

/**
 * LA VÉRIFICATION DE CLIC (/verifauto en jeu).  (28/09/2026)
 *
 * ── POURQUOI ELLE EXISTE ──────────────────────────────────────────────────
 * En jeu, le client 1.8 arrondit chaque clic au tick de 50 ms : un
 * autoclicker discret y ressemble à une main. Un navigateur, lui, date chaque
 * appui à la milliseconde. Le staff envoie donc ici un joueur qui a des logs
 * d'autoclick, avec un code à 6 caractères, et le panel compare sa façon de
 * cliquer ici avec celle du jeu.
 *
 * ── CE QUE LA PAGE NE FAIT PAS ────────────────────────────────────────────
 * Elle ne juge rien : elle envoie les instants bruts au panel
 * (panel.ljkits.eu/api/verif), qui calcule le verdict. Le joueur ne le voit
 * pas — un tricheur ne doit pas pouvoir régler son autoclicker à tâtons.
 *
 * ── PAS D'INDEXATION ──────────────────────────────────────────────────────
 * Une page d'outil, sans intérêt pour un moteur de recherche.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  return {
    title: t(locale, 'meta.verif-titre'),
    description: t(locale, 'meta.verif-desc'),
    robots: { index: false, follow: false },
  }
}

export default async function PageVerif({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT

  return (
    <PagePublique locale={locale}>
      <header className="relative overflow-hidden pt-[clamp(28px,4vw,56px)] pb-[clamp(16px,2.5vw,28px)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(55% 70% at 20% 40%, #fe930126, transparent 70%), radial-gradient(40% 60% at 92% 0%, #fdc00312, transparent 70%)',
          }}
        />
        <Enveloppe className="relative max-w-[760px]">
          <Etiquette>{t(locale, 'verif.etiquette')}</Etiquette>
          <h1 className="mt-3 font-titre text-[clamp(26px,5vw,44px)] leading-[1.05] text-creme">
            {t(locale, 'verif.titre')}
          </h1>
          <p className="mt-4 max-w-[60ch] text-[clamp(15px,1.6vw,17px)] text-gris">
            {t(locale, 'verif.chapeau')}
          </p>
        </Enveloppe>
      </header>

      <section className="pb-section">
        <Enveloppe className="max-w-[760px]">
          <TestClics locale={locale} />
          <p className="mt-6 text-[13px] text-gris/80">{t(locale, 'verif.vie-privee')}</p>
        </Enveloppe>
      </section>
    </PagePublique>
  )
}
