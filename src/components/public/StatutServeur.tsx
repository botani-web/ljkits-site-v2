'use client'

import { useEffect, useState } from 'react'

import { useReglages } from '@/components/public/ContexteReglages'
import { SITE } from '@/lib/site'

type Statut = { enLigne: boolean; joueurs: number }

/**
 * Encart « joueurs en ligne », rafraîchi toutes les 60 secondes depuis
 * l'API publique mcstatus.io.
 *
 * L'appel est fait côté navigateur, et pas côté serveur, exprès : la page est
 * en rendu statique, un fetch au build afficherait un chiffre figé.
 */
export function StatutServeur() {
  const { ip } = useReglages()
  const [statut, setStatut] = useState<Statut | null>(null)

  useEffect(() => {
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
  }, [ip])

  // statut === null : première requête en cours, on n'affiche encore rien.
  const enLigne = statut?.enLigne ?? false

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[18px] border border-bord bg-charbon p-6.5">
      <div className="font-mono text-[46px] leading-none font-bold text-creme" aria-live="polite">
        {statut?.enLigne ? statut.joueurs : '—'}
      </div>
      <div
        className={`flex items-center gap-2 text-xs font-bold tracking-[2.5px] ${
          enLigne ? 'text-vert' : 'text-rouge'
        }`}
      >
        <span
          aria-hidden="true"
          className={
            enLigne ? 'pastille-statut' : 'size-2 shrink-0 rounded-full bg-rouge'
          }
        />
        {statut === null ? 'CONNEXION…' : enLigne ? 'EN LIGNE' : 'HORS LIGNE'}
      </div>
    </div>
  )
}
