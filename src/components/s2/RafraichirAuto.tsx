'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Pendant un événement en direct (24/10/2026) : la page se relit toute seule toutes les
 * `secondes`, sans recharger le navigateur (router.refresh garde le défilement). Onglet
 * caché = pas de requête.
 */
export function RafraichirAuto({ secondes = 30 }: { secondes?: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, secondes * 1000)
    return () => clearInterval(id)
  }, [router, secondes])
  return null
}
