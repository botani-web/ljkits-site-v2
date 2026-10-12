import type { Metadata } from 'next'
import Link from 'next/link'

import { PagePublique } from '@/components/public/PagePublique'
import { classesBouton } from '@/components/ui/Bouton'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { Etiquette } from '@/components/ui/TeteSection'
import { estLocale, LANGUE_DEFAUT, lien, t, type Locale } from '@/lib/i18n'

/**
 * LA PAGE DE MAINTENANCE ENTRE DEUX SAISONS (12/10/2026).
 *
 * Le middleware y renvoie (réécriture, l'adresse ne change pas) toute page
 * publique autre que le classement et les profils tant que MAINTENANCE est
 * actif (`lib/site.ts`).
 */
type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  return { title: t(locale, 'mt.titre'), robots: { index: false } }
}

export default async function PageMaintenance({ params }: Props) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  return (
    <PagePublique locale={locale}>
      <section className="halo-hero relative py-[clamp(80px,12vw,160px)]">
        <Enveloppe className="text-center">
          <Etiquette>{t(locale, 'mt.etiquette')}</Etiquette>
          <h1 className="text-h1 mx-auto mt-4 max-w-[18ch] font-titre">
            <span className="text-or">{t(locale, 'mt.titre')}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[56ch] text-[16px] text-gris">{t(locale, 'mt.texte')}</p>
          <div className="mt-9 flex justify-center">
            <Link href={lien(locale, '/classement')} className={classesBouton({ variante: 'or', taille: 'grande' })}>
              {t(locale, 'mt.bouton')}
            </Link>
          </div>
        </Enveloppe>
      </section>
    </PagePublique>
  )
}
