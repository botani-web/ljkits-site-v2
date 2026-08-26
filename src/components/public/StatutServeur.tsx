'use client'

import { useEffect, useState } from 'react'

import { useReglages } from '@/components/public/ContexteReglages'
import { SITE } from '@/lib/site'

export type StatutServeur = { enLigne: boolean; joueurs: number }

/**
 * Le nombre de joueurs en ligne, rafraîchi toutes les 60 secondes depuis
 * l'API publique mcstatus.io.
 *
 * L'appel est fait côté navigateur, et pas côté serveur, exprès : les pages
 * publiques sont en rendu statique, un fetch au build afficherait un chiffre
 * figé pendant une heure.
 *
 * `actif` permet de ne rien interroger tant que ça n'a pas de sens. Avant
 * l'ouverture, l'encart de l'accueil affiche un décompte : inutile de
 * bombarder mcstatus.io pour une adresse qui ne répond pas encore.
 *
 * Renvoie `null` tant que la première réponse n'est pas arrivée — c'est
 * différent de « hors ligne », et l'appelant doit distinguer les deux.
 */
export function useStatutServeur(actif: boolean): StatutServeur | null {
  const { ip } = useReglages()
  const [statut, setStatut] = useState<StatutServeur | null>(null)

  useEffect(() => {
    if (!actif) return

    let annule = false

    async function rafraichir() {
      try {
        const reponse = await fetch(SITE.apiStatut + ip, { cache: 'no-store' })
        if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)

        const donnees = await reponse.json()
        if (annule) return

        setStatut({
          enLigne: Boolean(donnees?.online),
          joueurs: typeof donnees?.players?.online === 'number' ? donnees.players.online : 0,
        })
      } catch {
        // Serveur éteint, API injoignable ou hors ligne : on affiche « hors ligne ».
        if (!annule) setStatut({ enLigne: false, joueurs: 0 })
      }
    }

    rafraichir()
    const minuteur = setInterval(rafraichir, SITE.statutRefreshMs)

    return () => {
      annule = true
      clearInterval(minuteur)
    }
  }, [ip, actif])

  return statut
}
