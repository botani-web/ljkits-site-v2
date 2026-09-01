'use client'

import { CadreTable, EnteteTable } from '@/components/ui/CadreTable'
import { EtatVide } from '@/components/ui/EtatVide'
import { Section } from '@/components/ui/Section'
import { useCombatsDirect } from '@/hooks/useClassementDirect'
import { COMBATS_MINIMUM, formaterKit, type CombatRecent } from '@/lib/elo'
import { formaterDateHeure } from '@/lib/format'

/**
 * Les derniers combats de la saison, mis à jour en direct.
 *
 * Composant client SÉPARÉ du tableau, mais qui partage sa source : les deux
 * lisent le même hook, donc la même réponse d'API. Les fusionner aurait
 * imbriqué une section entière dans le composant du classement pour la seule
 * raison qu'ils sondent la même route — deux blocs indépendants à l'écran
 * doivent rester deux composants.
 */
export function DerniersCombats({
  combatsInitiaux,
  joueurs,
}: {
  combatsInitiaux: CombatRecent[]
  joueurs: number
}) {
  const combats = useCombatsDirect(combatsInitiaux)

  return (
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
        {joueurs} joueur{joueurs > 1 ? 's' : ''} ayant combattu cette saison ·{' '}
        {COMBATS_MINIMUM} combats minimum pour le cashprize · la liaison Discord est
        obligatoire pour apparaître ici.
      </p>
    </Section>
  )
}
