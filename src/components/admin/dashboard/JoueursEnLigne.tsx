'use client'

import { useEffect, useState } from 'react'

import { SITE } from '@/lib/site'

type Statut = { enLigne: boolean; joueurs: number }

/**
 * Tuile « joueurs en ligne » du tableau de bord.
 *
 * DEUX sources, à dessein :
 *   - mcstatus.io, en temps réel (rafraîchi toutes les 60 s), pour le chiffre ;
 *   - l'âge du dernier échantillon reçu par /api/frequentation, en petit.
 * Les croiser révèle un collecteur mort : mcstatus qui affiche 12 alors que le
 * dernier échantillon date de 40 minutes = le bot ne poste plus. L'âge passe
 * en rouge au-delà de 30 minutes.
 *
 * Rendue côté client, et pas dans la page serveur en `force-dynamic` : si
 * mcstatus.io traîne, le reste du tableau de bord s'affiche quand même.
 *
 * Pas de flèche d'évolution : mcstatus ne donne qu'un instantané.
 */
export function JoueursEnLigne({
  ip,
  dernierEchantillon,
  echantillons24h,
}: {
  ip: string
  /** Instant ISO du dernier échantillon, lu côté serveur pour le premier rendu. */
  dernierEchantillon: string | null
  /** Nombre d'échantillons reçus sur 24 h, lu côté serveur pour le premier rendu. */
  echantillons24h: number
}) {
  const [statut, setStatut] = useState<Statut | null>(null)
  const [echantillon, setEchantillon] = useState<number | null>(
    dernierEchantillon ? new Date(dernierEchantillon).getTime() : null,
  )
  const [nombre24h, setNombre24h] = useState<number>(echantillons24h)
  const [maintenant, setMaintenant] = useState<number>(() => Date.now())

  useEffect(() => {
    let annule = false

    async function rafraichir() {
      // 1. Le chiffre temps réel, depuis mcstatus.io.
      try {
        const reponse = await fetch(SITE.apiStatut + ip, { cache: 'no-store' })
        if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)

        const donnees = await reponse.json()
        if (!annule) {
          setStatut({
            enLigne: Boolean(donnees?.online),
            joueurs: typeof donnees?.players?.online === 'number' ? donnees.players.online : 0,
          })
        }
      } catch {
        if (!annule) setStatut({ enLigne: false, joueurs: 0 })
      }

      // 2. L'âge du dernier échantillon reçu, pour surveiller le collecteur.
      try {
        const reponse = await fetch('/api/frequentation', { cache: 'no-store' })
        if (reponse.ok) {
          const donnees = await reponse.json()
          if (!annule) {
            setEchantillon(donnees?.releveLe ? new Date(donnees.releveLe).getTime() : null)
            if (typeof donnees?.echantillons24h === 'number') setNombre24h(donnees.echantillons24h)
          }
        }
      } catch {
        // Sans importance : on garde la dernière valeur connue.
      }

      if (!annule) setMaintenant(Date.now())
    }

    rafraichir()
    const minuteur = setInterval(rafraichir, SITE.statutRefreshMs)

    return () => {
      annule = true
      clearInterval(minuteur)
    }
  }, [ip])

  const enLigne = statut?.enLigne ?? false
  const ageMinutes = echantillon === null ? null : Math.floor((maintenant - echantillon) / 60_000)
  const collecteurMuet = ageMinutes !== null && ageMinutes > 30

  return (
    <div className="rounded-carte border border-bord bg-charbon px-5 py-4">
      <p className="font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
        Joueurs en ligne
      </p>
      <div className="mt-1.5 flex items-baseline gap-2.5">
        <p className="font-titre text-2xl text-creme" aria-live="polite">
          {statut === null ? '…' : enLigne ? statut.joueurs : '—'}
        </p>
      </div>
      <p
        className={`mt-0.5 flex items-center gap-1.5 text-[13px] ${
          enLigne ? 'text-vert' : 'text-gris'
        }`}
      >
        <span
          aria-hidden="true"
          className={enLigne ? 'pastille-statut' : 'size-2 shrink-0 rounded-full bg-gris'}
        />
        {statut === null ? 'Connexion…' : enLigne ? 'Serveur en ligne' : 'Serveur hors ligne'}
      </p>
      <p className="mt-1 font-mono text-[11px] text-gris">
        <span className={collecteurMuet ? 'text-rouge' : undefined}>
          {ageMinutes === null
            ? 'aucun échantillon reçu'
            : ageMinutes <= 0
              ? 'dernier relevé à l’instant'
              : `dernier relevé il y a ${ageMinutes} min`}
        </span>
        {' · '}
        {nombre24h} / 144 sur 24 h
      </p>
    </div>
  )
}
