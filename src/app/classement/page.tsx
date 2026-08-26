import type { Metadata } from 'next'

import { TableauClassement } from '@/components/classement/TableauClassement'
import { BoutonIpGeant } from '@/components/public/CopieIp'
import { PagePublique } from '@/components/public/PagePublique'
import { CadreTable } from '@/components/ui/CadreTable'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { BlocFinal, Section } from '@/components/ui/Section'
import { lireClassements, lireDatesDeReset, lireDerniereMiseAJour } from '@/lib/classement'
import { formaterDateHeure } from '@/lib/format'
import { IMAGE_OG } from '@/lib/site'

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

  return (
    <PagePublique>
      {/*
        En-tête, compte à rebours, onglets, podium et tableau : un seul
        composant client, parce qu'ils partagent tous la période choisie.
      */}
      <TableauClassement
        classements={classements}
        finSemaine={dates.semaine}
        finMois={dates.mois}
      />

      {derniereMaj && (
        <Enveloppe className="-mt-8 pb-8">
          <p className="font-mono text-[11px] text-gris">
            Classement à jour au{' '}
            <time dateTime={derniereMaj.toISOString()}>{formaterDateHeure(derniereMaj)}</time>
          </p>
        </Enveloppe>
      )}

      {/* ══════════════════════════ LE BARÈME ══════════════════════════ */}
      <Section
        fond="charbon"
        id="bareme"
        etiquette="Le barème"
        titre={
          <>
            Comment on marque <span className="text-or">des points</span>
          </>
        }
        chapeau="Quatre actions rapportent, et une seule est à la portée de tout le monde en permanence. Les trois autres valent cher parce qu’elles demandent d’aller chercher les autres joueurs là où ils sont."
      >
        <div className="grid gap-3 min-[560px]:grid-cols-2 lg:grid-cols-4">
          {BAREME.map((entree) => (
            <div key={entree.titre} className="rounded-carte border border-bord bg-braise p-5.5">
              <p className="font-titre text-[clamp(26px,3.4vw,36px)] leading-none text-or">
                {entree.points}
              </p>
              <h3 className="mt-3.5 font-titre text-[15px]">{entree.titre}</h3>
              <p className="mt-2.25 text-sm text-gris">{entree.texte}</p>
              <p className="mt-3 border-t border-bord pt-2.5 font-mono text-[11px] text-gris">
                {entree.note}
              </p>
            </div>
          ))}
        </div>

        <div className="hachures mt-3.5 flex flex-wrap items-start gap-5 rounded-carte border border-oni/40 p-6">
          <h3 className="shrink-0 font-titre text-base text-oni">Anti-farm</h3>
          <p className="flex-1 basis-[380px] text-[14.5px] text-gris">
            Retuer la même personne en moins de{' '}
            <b className="font-semibold text-creme">60 secondes</b> ne rapporte ni point, ni
            kill, ni série — seulement 2 coins. S’arranger avec un ami pour monter au
            classement ne fonctionne pas, et n’a jamais fonctionné.
          </p>
        </div>
      </Section>

      {/* ═══════════════════════ LES RÉCOMPENSES ═══════════════════════ */}
      <Section
        etiquette="Ce que ça rapporte"
        titre={
          <>
            Les récompenses, jusqu’à la <span className="text-or">dixième place</span>
          </>
        }
        chapeau="Deux classements distincts sont récompensés. Tu peux gagner sur les deux la même semaine, les lots se cumulent. Le classement à vie, lui, ne rapporte rien d’autre que d’y figurer."
      >
        <div className="grid gap-3.5 lg:grid-cols-2">
          {LOTS.map((bloc) => (
            <CadreTable key={bloc.titre}>
              <div className="border-b border-bord bg-braise px-5.5 py-4.5">
                <h3 className="font-titre text-[17px]">{bloc.titre}</h3>
                <p className="mt-1.5 font-mono text-[11px] tracking-[.06em] text-gris">
                  {bloc.quand}
                </p>
              </div>

              <ol>
                {bloc.places.map((place) => (
                  <li
                    key={place.rang}
                    className="grid grid-cols-[52px_1fr_auto] items-center gap-3.5 border-b border-bord px-5.5 py-3.25 last:border-b-0"
                  >
                    <span
                      className={`font-mono text-[12.5px] font-bold ${TONS_DE_PLACE[place.ton]}`}
                    >
                      {place.rang}
                    </span>
                    <span className="font-mono text-[12.5px] font-bold text-creme">
                      {place.lot}
                    </span>
                    <span className="text-right font-mono text-[11px] text-vert">
                      {place.bonus}
                    </span>
                  </li>
                ))}
              </ol>
            </CadreTable>
          ))}
        </div>
      </Section>

      {/* ══════════════════════ CE QUE LE RESET CHANGE ══════════════════════ */}
      <Section
        fond="charbon"
        etiquette="Sans mauvaise surprise"
        titre={
          <>
            Ce que le reset <span className="text-oni">ne touche pas</span>
          </>
        }
        chapeau="Le reset est partiel. Seuls les compteurs de la période repartent à zéro — rien de ce que tu as gagné en jouant n’est repris."
      >
        <div className="grid gap-3.5 lg:grid-cols-2">
          <ListeReset titre="Tu gardes" ton="garde" entrees={CONSERVE} />
          <ListeReset titre="Tu repars à zéro" ton="perd" entrees={REMIS_A_ZERO} />
        </div>
      </Section>

      {/* ═════════════════════════════ APPEL ═════════════════════════════ */}
      <BlocFinal
        etiquette="Il reste de la place"
        titre={
          <>
            Un kill, et tu es <span className="text-or">dans le tableau</span>.
          </>
        }
        chapeau="Les compteurs tournent en continu. Connecte-toi, choisis ton kit, et va chercher le haut du tableau."
      >
        <BoutonIpGeant />
      </BlocFinal>
    </PagePublique>
  )
}

/* -------------------------------------------------------------------------- */
/* Contenu et composants locaux                                               */
/* -------------------------------------------------------------------------- */

/**
 * Le barème de points.
 *
 * Aucune source en base : ce sont les règles du serveur Minecraft, pas des
 * données du site. Le KOTH est ici parce qu'il rapporte des POINTS ; le Totem,
 * qui rapporte des COINS, est présenté sur /kits.
 */
const BAREME = [
  {
    points: '+1',
    titre: 'Un kill',
    texte: 'La base. Chaque joueur tué vaut un point, quel que soit son niveau ou son kit.',
    note: 'Le suicide ne compte pas.',
  },
  {
    points: '+3',
    titre: 'Série stoppée',
    texte:
      'Tuer un joueur en pleine série rapporte trois fois plus. Plus sa série est longue, plus il vaut cher en coins.',
    note: 'Cumulé avec le point de kill.',
  },
  {
    points: '+5',
    titre: 'Zone tenue',
    texte:
      'Rester seul dans une zone de contrôle assez longtemps pour la valider. Un plafond journalier empêche d’en vivre.',
    note: '500 coins maximum par 24 h.',
  },
  {
    points: '+10',
    titre: 'KOTH remporté',
    texte:
      'L’action la plus rentable du serveur, et la plus disputée : tout le monde converge au même endroit.',
    note: 'Lancement auto dès 6 joueurs.',
  },
]

const TONS_DE_PLACE = {
  or: 'text-or',
  argent: 'text-argent',
  bronze: 'text-bronze',
  neutre: 'text-gris',
} as const

const LOTS = [
  {
    titre: 'Classement hebdomadaire',
    quand: 'Reset chaque lundi à 00h00',
    places: [
      { rang: '1er', lot: '5 000 coins', bonus: 'Titre Champion · 7 jours', ton: 'or' as const },
      { rang: '2e', lot: '3 000 coins', bonus: '', ton: 'argent' as const },
      { rang: '3e', lot: '2 000 coins', bonus: '', ton: 'bronze' as const },
      { rang: '4e — 10e', lot: '1 000 coins', bonus: '', ton: 'neutre' as const },
    ],
  },
  {
    titre: 'Classement mensuel',
    quand: 'Cycle glissant de 30 jours',
    places: [
      { rang: '1er', lot: '15 000 coins', bonus: 'Shogun · 30 jours', ton: 'or' as const },
      { rang: '2e', lot: '10 000 coins', bonus: 'Samouraï · 30 jours', ton: 'argent' as const },
      { rang: '3e', lot: '7 000 coins', bonus: 'Ronin · 30 jours', ton: 'bronze' as const },
      { rang: '4e — 10e', lot: '3 000 coins', bonus: '', ton: 'neutre' as const },
    ],
  },
]

const CONSERVE = [
  'Tous tes coins, jusqu’au dernier',
  'Tous les kits que tu as débloqués',
  'Ton grade et tout ce qui a été acheté',
  'Ton compteur de kills à vie',
  'La disposition de tes kits dans l’inventaire',
]

const REMIS_A_ZERO = [
  'Tes points de la période concernée',
  'Ta place dans le classement de la période',
  'Le titre Champion, s’il n’est pas reconduit',
]

function ListeReset({
  titre,
  ton,
  entrees,
}: {
  titre: string
  ton: 'garde' | 'perd'
  entrees: string[]
}) {
  const garde = ton === 'garde'

  return (
    <div
      className={`rounded-carte border bg-braise p-6.5 ${
        garde ? 'border-vert/30' : 'border-oni/30'
      }`}
    >
      <h3 className={`font-titre text-base ${garde ? 'text-vert' : 'text-oni'}`}>{titre}</h3>

      <ul className="mt-3.5">
        {entrees.map((entree) => (
          <li
            key={entree}
            className="flex gap-3 border-t border-bord py-2 text-[15px] text-gris first:border-t-0 first:pt-0"
          >
            {/* Le signe est décoratif : le titre du bloc dit déjà s'il s'agit
                de ce qu'on garde ou de ce qu'on perd. */}
            <span
              aria-hidden="true"
              className={`shrink-0 font-mono font-bold ${garde ? 'text-vert' : 'text-oni'}`}
            >
              {garde ? '✓' : '✗'}
            </span>
            {entree}
          </li>
        ))}
      </ul>
    </div>
  )
}
