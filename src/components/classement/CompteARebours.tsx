'use client'

import { useEffect, useState } from 'react'

import { Panneau } from '@/components/ui/Panneau'

/**
 * Décompte jusqu'à la prochaine remise à zéro du classement, en panneau de
 * quatre cases.
 *
 * Composant client, et pas une valeur calculée au rendu : la page est statique
 * avec une revalidation de 60 secondes, un décompte figé au build serait faux
 * dès la minute suivante.
 *
 * L'heure vient du navigateur, donc elle diffère forcément de celle du serveur.
 * Le premier rendu affiche donc des tirets, et le décompte se remplit après le
 * montage — sinon React signalerait une divergence d'hydratation.
 *
 * ⚠ `finUnix` vient de la table `config_classement`, écrite par le serveur
 * Minecraft. Jamais d'une date en dur : le cycle mensuel est glissant, et le
 * serveur peut décaler un reset.
 */
export function CompteARebours({
  /** Timestamp unix en SECONDES de la prochaine remise à zéro, ou null à vie. */
  finUnix,
  titre,
  pied,
}: {
  finUnix: number | null
  titre: string
  pied: string
}) {
  const [restant, setRestant] = useState<number | null>(null)

  useEffect(() => {
    if (finUnix === null) return

    function calculer() {
      setRestant(finUnix! - Math.floor(Date.now() / 1000))
    }

    calculer()
    // Chaque seconde : la seconde affichée bascule ainsi pile à l'heure.
    const minuteur = setInterval(calculer, 1000)
    return () => clearInterval(minuteur)
  }, [finUnix])

  const cases = decouper(finUnix, restant)

  return (
    <Panneau titre={titre} pied={<p className="font-mono text-[11px] text-gris">{pied}</p>}>
      <div className="flex gap-2 p-4.5">
        {cases.map((une) => (
          <div
            key={une.unite}
            className="flex-1 rounded-controle border border-bord bg-nuit px-1 py-3 text-center"
          >
            <div className="font-mono text-[clamp(19px,2.4vw,24px)] leading-none font-bold text-or">
              {une.valeur}
            </div>
            <div className="mt-1.75 font-mono text-[9px] tracking-[.14em] text-gris uppercase">
              {une.unite}
            </div>
          </div>
        ))}
      </div>
    </Panneau>
  )
}

/**
 * Découpe le reste en jours / heures / minutes / secondes.
 *
 * `null` = pas encore monté côté client, ou classement à vie : quatre tirets,
 * ou quatre infinis. Une valeur négative signifie que le serveur Minecraft n'a
 * pas encore repoussé la date — on affiche des zéros plutôt qu'un décompte
 * négatif, la remise à zéro est imminente.
 */
function decouper(finUnix: number | null, restant: number | null) {
  const unites = ['Jours', 'Heures', 'Min', 'Sec']

  if (finUnix === null) return unites.map((unite) => ({ unite, valeur: '∞' }))
  if (restant === null) return unites.map((unite) => ({ unite, valeur: '—' }))

  const seconds = Math.max(0, restant)
  const deuxChiffres = (valeur: number) => String(valeur).padStart(2, '0')

  return [
    { unite: 'Jours', valeur: String(Math.floor(seconds / 86_400)) },
    { unite: 'Heures', valeur: deuxChiffres(Math.floor((seconds % 86_400) / 3_600)) },
    { unite: 'Min', valeur: deuxChiffres(Math.floor((seconds % 3_600) / 60)) },
    { unite: 'Sec', valeur: deuxChiffres(seconds % 60) },
  ]
}
