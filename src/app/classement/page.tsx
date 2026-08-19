import type { Metadata } from 'next'

import { TableauClassement } from '@/components/classement/TableauClassement'
import { BoutonCopieIp } from '@/components/public/CopieIp'
import { PagePublique } from '@/components/public/PagePublique'
import { lireClassements, lireDatesDeReset, lireDerniereMiseAJour } from '@/lib/classement'
import { formaterDateHeure } from '@/lib/format'
import { IMAGE_OG, SITE } from '@/lib/site'

/**
 * Le classement des joueurs.
 *
 * Rendu statique avec une revalidation courte : les chiffres viennent du
 * serveur Minecraft et bougent en continu, mais une page régénérée toutes les
 * minutes suffit — inutile de frapper la base à chaque visite.
 *
 * ⚠ LECTURE SEULE : la table `joueur` et `config_classement` appartiennent au
 * serveur Minecraft. Cette page ne fait que des lectures.
 */
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Classement',
  description:
    'Le classement des joueurs de LJKITS : points de la semaine, du mois, et kills à vie. Podium, ratio K/D et records de série.',
  alternates: { canonical: '/classement' },
  openGraph: {
    type: 'website',
    title: 'Classement — LJKITS',
    description:
      'Qui domine l’arène cette semaine ? Points hebdomadaires, mensuels et kills à vie.',
    url: '/classement',
    images: IMAGE_OG,
  },
  twitter: {
    card: 'summary',
    title: 'Classement — LJKITS',
    description: 'Points de la semaine, du mois, et kills à vie.',
    images: IMAGE_OG,
  },
}

export default async function PageClassement() {
  const [classements, dates, derniereMaj] = await Promise.all([
    lireClassements(),
    lireDatesDeReset(),
    lireDerniereMiseAJour(),
  ])

  const nombreClasses = new Set(
    [...classements.semaine, ...classements.mois, ...classements.vie].map((l) => l.pseudo),
  ).size

  return (
    <PagePublique>
      <header className="halo-hero overflow-hidden px-6 pt-[150px] pb-8">
        <div className="mx-auto max-w-contenu text-center">
          <p className="mb-3.5 font-mono text-xs font-bold tracking-[3px] text-oni uppercase [text-shadow:0_0_18px_rgba(233,40,19,.35)]">
            {nombreClasses > 0 ? `${nombreClasses} joueurs classés` : 'Arène ouverte'}
          </p>
          <h1 className="font-titre text-[clamp(30px,5vw,54px)] leading-[1.05] uppercase">
            Le <span className="texte-accent">classement</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[17px] text-gris">
            Les points se gagnent en tuant, les places se perdent en mourant. Tout se remet à
            zéro chaque semaine et chaque cycle — sauf les kills, qui restent à vie.
          </p>

          {derniereMaj && (
            <p className="mt-5 font-mono text-[12.5px] text-gris">
              Classement à jour au{' '}
              <time dateTime={derniereMaj.toISOString()}>{formaterDateHeure(derniereMaj)}</time>
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-contenu px-6 pb-16">
        <TableauClassement
          classements={classements}
          finSemaine={dates.semaine}
          finMois={dates.mois}
        />

        {/* ----------------------------- APPEL ----------------------------- */}
        <div className="mt-12 rounded-xl border border-dashed border-soupe bg-linear-[100deg] from-soupe/7 to-transparent px-6 py-8 text-center">
          <h2 className="font-titre text-[clamp(19px,2.4vw,25px)] uppercase">
            Ta place est à prendre
          </h2>
          <p className="mx-auto mt-2 mb-5 max-w-[480px] text-[15px] text-gris">
            Les compteurs tournent en continu. Connecte-toi, choisis ton kit, et va chercher
            le haut du tableau.
          </p>
          <BoutonCopieIp
            aria-label={`Copier l’adresse du serveur, ${SITE.ip}`}
            className="inline-block rounded-lg bg-soupe px-6.5 py-3 font-mono text-[15px] font-bold text-[#1a0f00] transition-all hover:-translate-y-px hover:bg-or"
          >
            {SITE.ip}
          </BoutonCopieIp>
        </div>
      </main>
    </PagePublique>
  )
}
