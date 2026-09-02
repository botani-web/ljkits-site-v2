'use client'

import { useEffect, useRef, useState } from 'react'

import type { CombatRecent, LigneElo } from '@/lib/elo'

/**
 * Garde le classement à jour sans rechargement de page.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  TROIS PRÉCAUTIONS, ET AUCUNE N'EST DÉCORATIVE
 * ═══════════════════════════════════════════════════════════════════════
 *
 * 1. ON NE SONDE PAS UN ONGLET CACHÉ. Un classement reste ouvert en fond
 *    pendant des heures ; sans cette garde, chaque onglet oublié
 *    continuerait d'appeler l'API toute la nuit. `visibilitychange`
 *    suspend la boucle et déclenche une lecture immédiate au retour, pour
 *    que l'onglet ne montre jamais des chiffres périmés.
 *
 * 2. ON ANNULE LA REQUÊTE EN COURS AU DÉMONTAGE. Sans l'AbortController,
 *    une réponse qui arrive après le départ de l'utilisateur écrirait
 *    dans un composant démonté.
 *
 * 3. UNE ERREUR RÉSEAU NE VIDE PAS LE TABLEAU. On garde les dernières
 *    données valides : mieux vaut un classement d'il y a une minute
 *    qu'une page vide parce que le wifi a hoqueté.
 */

export type DonneesClassement = {
  lignes: LigneElo[]
  combats: CombatRecent[]
  derniereMaj: string | null
}

/**
 * Intervalle de sondage. Aligné sur le `s-maxage` de la route.
 *
 * ET UNE LECTURE IMMÉDIATE AU MONTAGE — voir `demarrer()`. Sans elle, la
 * page vivait quinze secondes sur le HTML servi par le CDN, qui peut avoir
 * plusieurs minutes (constaté le 02/09/2026 : `x-vercel-cache: STALE`,
 * `age: 199`). Un visiteur qui regarde et repart avant la première lecture
 * ne voyait jamais les chiffres à jour, et concluait que le direct était
 * cassé. Il fallait rafraîchir à la main pour tomber, par chance, sur une
 * page régénérée.
 */
const INTERVALLE_MS = 15_000

/**
 * La même donnée, pour le bloc des derniers combats.
 *
 * Il sonde la MÊME route que le classement. Ça peut surprendre, mais ça ne
 * double rien : les deux requêtes tombent à quelques millisecondes d'écart
 * sur une réponse mise en cache par le CDN (`s-maxage=15`), et la base n'est
 * donc pas interrogée deux fois. L'alternative — remonter l'état dans un
 * contexte partagé — aurait couplé deux blocs qui n'ont rien à se dire.
 */
export function useCombatsDirect(initiaux: CombatRecent[]): CombatRecent[] {
  const { donnees } = useClassementDirect({
    lignes: [],
    combats: initiaux,
    derniereMaj: null,
  })
  return donnees.combats
}

export function useClassementDirect(initiales: DonneesClassement) {
  const [donnees, setDonnees] = useState(initiales)
  const [enDirect, setEnDirect] = useState(true)
  const controleur = useRef<AbortController | null>(null)

  useEffect(() => {
    let minuteur: ReturnType<typeof setInterval> | null = null

    async function lire() {
      controleur.current?.abort()
      const abandon = new AbortController()
      controleur.current = abandon

      try {
        const reponse = await fetch('/api/classement', { signal: abandon.signal })
        if (!reponse.ok) throw new Error(String(reponse.status))

        const charge = (await reponse.json()) as {
          lignes: LigneElo[]
          combats: (Omit<CombatRecent, 'instant'> & { instant: string })[]
          chiffres: { derniereMaj: string | null } | null
        }

        setDonnees({
          lignes: charge.lignes,
          // Le JSON rend les dates en chaînes : on les reconstruit, sinon
          // tout formatage de date planterait sur un `string`.
          combats: charge.combats.map((combat) => ({
            ...combat,
            instant: new Date(combat.instant),
          })),
          derniereMaj: charge.chiffres?.derniereMaj ?? null,
        })
        setEnDirect(true)
      } catch (erreur) {
        // Un abandon volontaire n'est pas une panne : on ne signale rien.
        if (erreur instanceof DOMException && erreur.name === 'AbortError') return
        setEnDirect(false)
      }
    }

    function demarrer() {
      if (minuteur) return
      // Tout de suite, puis à intervalle : le HTML initial vient du CDN et
      // peut être vieux de plusieurs minutes — on ne le laisse pas s'afficher
      // quinze secondes sans le corriger.
      void lire()
      minuteur = setInterval(() => void lire(), INTERVALLE_MS)
    }

    function arreter() {
      if (!minuteur) return
      clearInterval(minuteur)
      minuteur = null
    }

    function surVisibilite() {
      if (document.visibilityState === 'visible') {
        demarrer() // lit immédiatement, puis relance la boucle
      } else {
        arreter()
      }
    }

    document.addEventListener('visibilitychange', surVisibilite)
    if (document.visibilityState === 'visible') demarrer()

    return () => {
      document.removeEventListener('visibilitychange', surVisibilite)
      arreter()
      controleur.current?.abort()
    }
  }, [])

  return { donnees, enDirect }
}
