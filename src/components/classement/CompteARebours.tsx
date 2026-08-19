'use client'

import { useEffect, useState } from 'react'

/**
 * Décompte jusqu'à la prochaine remise à zéro du classement.
 *
 * Composant client, et pas une valeur calculée au rendu : la page est statique
 * avec une revalidation de 60 secondes, un décompte figé au build serait faux
 * dès la minute suivante.
 *
 * L'heure vient du navigateur, donc elle diffère forcément de celle du serveur.
 * Le premier rendu affiche donc un tiret, et le décompte se remplit après le
 * montage — sinon React signalerait une divergence d'hydratation.
 */
export function CompteARebours({
  /** Timestamp unix en SECONDES de la prochaine remise à zéro. */
  finUnix,
  libelle,
}: {
  finUnix: number
  libelle: string
}) {
  const [restant, setRestant] = useState<number | null>(null)

  useEffect(() => {
    function calculer() {
      setRestant(finUnix - Math.floor(Date.now() / 1000))
    }

    calculer()
    // Chaque seconde : la minute affichée bascule ainsi pile à l'heure.
    const minuteur = setInterval(calculer, 1000)
    return () => clearInterval(minuteur)
  }, [finUnix])

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-xl border border-bord bg-charbon px-5 py-3">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className="size-4 text-soupe"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>

      <span className="font-mono text-[11px] tracking-[1.4px] text-gris uppercase">
        {libelle}
      </span>

      <span aria-live="polite" className="font-titre text-[15px] text-or">
        {formater(restant)}
      </span>
    </div>
  )
}

/**
 * `null` = pas encore monté côté client.
 * Une valeur négative ou nulle = le serveur n'a pas encore repoussé la date ;
 * on annonce une remise à zéro imminente plutôt qu'un décompte négatif.
 */
function formater(restant: number | null): string {
  if (restant === null) return '—'
  if (restant <= 0) return 'imminente'

  const jours = Math.floor(restant / 86_400)
  const heures = Math.floor((restant % 86_400) / 3_600)
  const minutes = Math.floor((restant % 3_600) / 60)

  if (jours > 0) return `${jours} j ${heures} h ${minutes} min`
  if (heures > 0) return `${heures} h ${minutes} min`
  return `${minutes} min`
}
