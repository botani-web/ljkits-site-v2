'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Le suivi d'audience du site public, pour /admin/stats.
 *
 * Il enregistre une ligne par page vue, puis la complète avec le temps passé
 * dessus quand le visiteur s'en va. Rien d'autre : ni IP, ni user-agent, ni
 * cookie, ni identifiant qui survivrait à la fermeture de l'onglet.
 *
 * Le départ est capté sur `pagehide` et sur le passage en arrière-plan, PAS
 * sur `beforeunload` : ce dernier n'est pas déclenché de façon fiable sur
 * mobile, où l'on quitte une page en changeant d'application plutôt qu'en la
 * fermant. Sans ça, aucune durée ne remonterait jamais depuis un téléphone.
 */

const CLE_VISITE = 'ljkits.visite.v1'

/** Identifiant de visite, constant le temps d'un onglet. */
function identifiantDeVisite(): string | null {
  try {
    const existant = window.sessionStorage.getItem(CLE_VISITE)
    if (existant) return existant

    const nouveau = crypto.randomUUID()
    window.sessionStorage.setItem(CLE_VISITE, nouveau)
    return nouveau
  } catch {
    // Navigation privée stricte, stockage refusé : on renonce à mesurer
    // plutôt que de chercher un contournement.
    return null
  }
}

/**
 * Le type d'appareil, déduit du pointeur et de la largeur — jamais du
 * user-agent, qui ment et qui identifie.
 */
function typeAppareil(): 'MOBILE' | 'TABLETTE' | 'BUREAU' {
  const tactile = window.matchMedia('(pointer: coarse)').matches
  const largeur = window.innerWidth

  if (tactile && largeur < 768) return 'MOBILE'
  if (tactile) return 'TABLETTE'
  return largeur < 768 ? 'MOBILE' : 'BUREAU'
}

/** Le domaine d'où vient le visiteur. `null` si direct ou navigation interne. */
function domaineSource(): string | null {
  const referent = document.referrer
  if (!referent) return null

  try {
    const hote = new URL(referent).hostname
    return hote === window.location.hostname ? null : hote.slice(0, 120)
  } catch {
    return null
  }
}

export function SuiviAudience() {
  const chemin = usePathname()

  /** L'id de la vue en cours, renvoyé par l'API. */
  const vueId = useRef<string | null>(null)
  /** L'instant d'arrivée sur la page courante. */
  const arrivee = useRef<number>(0)
  /** Empêche d'envoyer deux fois la durée de la même vue. */
  const dureeEnvoyee = useRef(false)

  useEffect(() => {
    if (!chemin || chemin.startsWith('/admin')) return

    const visiteId = identifiantDeVisite()
    if (!visiteId) return

    let annule = false
    vueId.current = null
    dureeEnvoyee.current = false
    arrivee.current = Date.now()

    fetch('/api/stats/vue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'vue',
        chemin,
        visiteId,
        source: domaineSource(),
        appareil: typeAppareil(),
      }),
      // Une mesure ne doit jamais retarder la page ni la faire échouer.
      keepalive: true,
    })
      .then((reponse) => (reponse.ok ? reponse.json() : null))
      .then((donnees) => {
        if (!annule && donnees?.id) vueId.current = donnees.id
      })
      .catch(() => {
        // Bloqueur de pub, hors ligne : on abandonne en silence.
      })

    const envoyerDuree = () => {
      if (dureeEnvoyee.current || !vueId.current) return
      dureeEnvoyee.current = true

      const charge = JSON.stringify({
        type: 'duree',
        id: vueId.current,
        dureeMs: Date.now() - arrivee.current,
      })

      // sendBeacon survit à la fermeture de l'onglet, contrairement à fetch.
      try {
        const envoye = navigator.sendBeacon(
          '/api/stats/vue',
          new Blob([charge], { type: 'application/json' }),
        )
        if (envoye) return
      } catch {
        // On retombe sur fetch juste en dessous.
      }

      fetch('/api/stats/vue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: charge,
        keepalive: true,
      }).catch(() => {})
    }

    const surMasquage = () => {
      if (document.visibilityState === 'hidden') envoyerDuree()
    }

    window.addEventListener('pagehide', envoyerDuree)
    document.addEventListener('visibilitychange', surMasquage)

    return () => {
      annule = true
      window.removeEventListener('pagehide', envoyerDuree)
      document.removeEventListener('visibilitychange', surMasquage)
      // Changement de page interne : c'est aussi une sortie.
      envoyerDuree()
    }
  }, [chemin])

  return null
}
