import type { Metadata } from 'next'

import { FormulaireAvis } from '@/components/public/FormulaireAvis'
import { PagePublique } from '@/components/public/PagePublique'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { Etiquette } from '@/components/ui/TeteSection'
import { estLocale, LANGUE_DEFAUT, t, type Locale } from '@/lib/i18n'
import { CASHPRIZE, euros } from '@/lib/saison'

/**
 * LA PAGE D'AVIS DES JOUEURS.
 *
 * ── POURQUOI ELLE EXISTE ──────────────────────────────────────────────────
 * Le serveur se règle jusqu'ici sur ce qui remonte du Discord et de ce qu'on
 * entend en jeu : c'est-à-dire l'avis des plus bavards. Cinq questions et une
 * minute donnent la parole aux autres — ceux qui se connectent, trouvent que
 * quelque chose cloche, et repartent sans rien dire.
 *
 * ── LE PSEUDO EST FACULTATIF ──────────────────────────────────────────────
 * Assumé : on préfère une critique anonyme utile à un silence poli. Qui
 * signe peut être recontacté, qui ne signe pas est lu quand même.
 *
 * ── LA QUESTION DU CASHPRIZE N'EST PAS UNE QUESTION DE PLUS ───────────────
 * Elle mesure NOTRE communication, pas le joueur : si la moitié des
 * répondants ignore qu'il y a de l'argent à gagner chaque mois, le problème
 * n'est pas le montant, c'est qu'on ne le dit pas assez fort. Et la page de
 * remerciement le leur apprend — c'est le seul moment où on est certain
 * d'avoir leur attention.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const titre = t(locale, 'meta.avis-titre')
  const description = t(locale, 'meta.avis-desc')

  return {
    title: titre,
    description,
    alternates: { languages: { en: `/en/avis`, fr: `/fr/avis` } },
    openGraph: { title: `${titre} — LJKITS`, description },
  }
}

export default async function PageAvis({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT

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
          <Etiquette>{t(locale, 'avis.etiquette')}</Etiquette>
          <h1 className="mt-3 font-titre text-[clamp(26px,5vw,44px)] leading-[1.05] text-creme">
            {t(locale, 'avis.titre')}
          </h1>
          <p className="mt-4 max-w-[58ch] text-[clamp(15px,1.6vw,17px)] text-gris">
            {t(locale, 'avis.chapeau').replace('{c}', euros(CASHPRIZE.total, locale))}
          </p>
          <p className="mt-3 font-mono text-[11.5px] tracking-[.1em] text-soupe uppercase">
            {t(locale, 'avis.duree')}
          </p>
        </Enveloppe>
      </header>

      <section className="pb-section">
        <Enveloppe className="max-w-[760px]">
          <FormulaireAvis locale={locale} />
        </Enveloppe>
      </section>
    </PagePublique>
  )
}
