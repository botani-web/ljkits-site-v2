'use client'

import { useStatutServeur } from '@/components/public/StatutServeur'

/**
 * Le nombre de joueurs en ligne, pour le bandeau de chiffres de l'accueil.
 * Un tiret tant que mcstatus.io n'a pas répondu, 0 si le serveur est éteint.
 */
export function NombreEnLigne() {
  const statut = useStatutServeur(true)
  return <span aria-live="polite">{statut === null ? '—' : statut.joueurs}</span>
}
