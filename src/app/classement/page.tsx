import type { Metadata } from 'next'

import { TableauElo } from '@/components/classement/TableauElo'
import { PagePublique } from '@/components/public/PagePublique'
import { CadreTable, EnteteTable } from '@/components/ui/CadreTable'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { EtatVide } from '@/components/ui/EtatVide'
import { Section } from '@/components/ui/Section'
import {
  COMBATS_MINIMUM,
  PALIERS,
  formaterKit,
  lireChiffresSaison,
  lireClassementElo,
  lireDerniersCombats,
  lireSaisonCourante,
} from '@/lib/elo'
import { formaterDateHeure } from '@/lib/format'
import { IMAGE_OG } from '@/lib/site'

/**
 * Le classement Elo de la saison.
 *
 * Rendu statique avec une revalidation courte : les chiffres viennent du
 * serveur Minecraft et bougent en continu, mais une page régénérée toutes les
 * minutes suffit — inutile de frapper la base à chaque visite.
 *
 * ⚠ LECTURE SEULE : les tables `elo_*` appartiennent au plugin LJElo. Cette
 * page ne fait que des lectures.
 */
export const revalidate = 60

/** Le montant annoncé. Il doit rester en accord avec LJElo/config.yml. */
const CASHPRIZE = '150€'

export const metadata: Metadata = {
  title: 'Classement Elo',
  description:
    'Le classement Elo de LJKITS : paliers, combats, ratio K/D. Saison mensuelle avec cashprize à la clé.',
  alternates: { canonical: '/classement' },
  openGraph: {
    type: 'website',
    title: 'Classement Elo — LJKITS',
    description: 'Qui domine la saison ? Elo, paliers et éligibilité au cashprize.',
    url: '/classement',
    images: IMAGE_OG,
  },
  twitter: {
    card: 'summary',
    title: 'Classement Elo — LJKITS',
    description: 'Elo, paliers et cashprize mensuel.',
    images: IMAGE_OG,
  },
}

export default async function PageClassement() {
  const saison = await lireSaisonCourante()

  // Aucune saison ouverte : le serveur n'a jamais démarré le plugin. On le dit
  // au lieu d'afficher un tableau vide qui laisserait croire à une panne.
  if (!saison) {
    return (
      <PagePublique>
        <Enveloppe className="py-[clamp(60px,8vw,120px)]">
          <EtatVide message="Le classement Elo n’a pas encore démarré. Reviens à l’ouverture de la première saison." />
        </Enveloppe>
      </PagePublique>
    )
  }

  const [lignes, chiffres, combats] = await Promise.all([
    lireClassementElo(saison.id),
    lireChiffresSaison(saison.id),
    lireDerniersCombats(saison.id, 10),
  ])

  return (
    <PagePublique>
      <TableauElo lignes={lignes} saison={saison.nom} cashprize={CASHPRIZE} />

      {chiffres.derniereMaj && (
        <Enveloppe className="-mt-8 pb-8">
          <p className="font-mono text-[11px] text-gris">
            Classement à jour au{' '}
            <time dateTime={chiffres.derniereMaj.toISOString()}>
              {formaterDateHeure(chiffres.derniereMaj)}
            </time>{' '}
            · {chiffres.combats} combat{chiffres.combats > 1 ? 's' : ''} cette saison
          </p>
        </Enveloppe>
      )}

      {/* ══════════════════════════ LES PALIERS ══════════════════════════ */}
      <Section
        fond="charbon"
        id="paliers"
        etiquette="Les paliers"
        titre={
          <>
            Huit rangs, de Fer à <span className="text-or">Légende</span>
          </>
        }
        chapeau="Les bornes sont resserrées autour de 1000, le point de départ : la grande majorité des joueurs vit entre 800 et 1500, et des paliers larges rendraient la progression invisible. Ton palier change en direct, à chaque combat."
      >
        <div className="grid gap-3 min-[560px]:grid-cols-2 lg:grid-cols-4">
          {PALIERS.map((palier) => (
            <div key={palier.nom} className="rounded-carte border border-bord bg-braise p-5.5">
              <p
                className="font-titre text-[clamp(22px,2.8vw,28px)] leading-none"
                style={{ color: palier.couleur }}
              >
                {palier.nom}
              </p>
              <p className="mt-3 font-mono text-[13px] text-creme">
                {palier.minimum === 0 ? 'moins de 850' : `${palier.minimum} Elo et plus`}
              </p>
            </div>
          ))}
        </div>

        <div className="hachures mt-3.5 flex flex-wrap items-start gap-5 rounded-carte border border-oni/40 p-6">
          <h3 className="shrink-0 font-titre text-base text-oni">Anti-farm</h3>
          <p className="flex-1 basis-[380px] text-[14.5px] text-gris">
            Retuer la même personne rapporte de moins en moins :{' '}
            <b className="font-semibold text-creme">moitié au 2ᵉ kill</b>, un quart au 3ᵉ, puis
            plus rien pendant deux heures. Le coefficient s’applique aussi{' '}
            <b className="font-semibold text-creme">à la perte</b> — se faire tuer en boucle par
            un ami ne vide pas ton Elo, mais ne remplit pas le sien non plus.
          </p>
        </div>
      </Section>

      {/* ═══════════════════════ LES DERNIERS COMBATS ═══════════════════════ */}
      <Section
        etiquette="En direct"
        titre={
          <>
            Les derniers <span className="text-or">combats</span>
          </>
        }
        chapeau="Chaque duel de la saison est enregistré : les deux kits, l’Elo échangé et les points de vie qui restaient au vainqueur."
      >
        {combats.length === 0 ? (
          <EtatVide message="Aucun combat classé pour le moment." />
        ) : (
          <CadreTable fond="braise">
            <div className="max-lg:hidden">
              <EnteteTable
                colonnes="minmax(0,1fr) 150px 150px 92px 110px"
                libelles={['Vainqueur', 'Kit', 'Vaincu', 'Elo', 'Quand']}
                alignerADroite={[3, 4]}
              />
            </div>

            <ol>
              {combats.map((combat) => (
                <li
                  key={combat.id}
                  className="grid items-center gap-3 border-b border-bord px-4.5 py-[13px] last:border-b-0 max-lg:grid-cols-[minmax(0,1fr)_92px] lg:grid-cols-[minmax(0,1fr)_150px_150px_92px_110px]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-creme">
                      {combat.tueurPseudo}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-gris lg:hidden">
                      bat {combat.victimePseudo} · {formaterKit(combat.kitTueur)}
                    </span>
                  </span>

                  <span className="max-lg:hidden font-mono text-[12px] text-gris">
                    {formaterKit(combat.kitTueur)}
                  </span>

                  <span className="max-lg:hidden min-w-0">
                    <span className="block truncate font-mono text-[12px] text-gris">
                      {combat.victimePseudo}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-gris/60">
                      {formaterKit(combat.kitVictime)}
                    </span>
                  </span>

                  <span className="text-right font-mono text-[13px]">
                    <span className="font-bold text-vert">+{combat.gain}</span>
                    <span className="text-gris"> / </span>
                    <span className="text-oni">−{combat.perte}</span>
                  </span>

                  <span className="max-lg:hidden text-right font-mono text-[11px] text-gris">
                    {combat.pvRestants !== null
                      ? `${combat.pvRestants} PV restants`
                      : formaterDateHeure(combat.instant)}
                  </span>
                </li>
              ))}
            </ol>
          </CadreTable>
        )}

        <p className="mt-3.5 font-mono text-[11px] text-gris">
          {chiffres.joueurs} joueur{chiffres.joueurs > 1 ? 's' : ''} a
          {chiffres.joueurs > 1 ? 'yant' : 'yant'} combattu cette saison ·{' '}
          {COMBATS_MINIMUM} combats minimum pour le cashprize · la liaison Discord est
          obligatoire pour apparaître ici.
        </p>
      </Section>
    </PagePublique>
  )
}
