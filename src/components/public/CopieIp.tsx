'use client'

import { useEffect, useState } from 'react'

import { SITE } from '@/lib/site'

/**
 * Copie de l'adresse du serveur dans le presse-papier.
 *
 * Il y a plusieurs boutons de copie par page (nav, hero, footer, encart final)
 * mais un seul toast. Plutôt que de partager un état React entre des endroits
 * très éloignés de l'arbre, chaque bouton émet un évènement sur `window` et le
 * toast, monté une seule fois dans le pied de page, l'écoute.
 */
const EVENEMENT_COPIE = 'ljkits:ip-copiee'

/**
 * Bouton (ou lien) qui copie l'IP au clic.
 * Le style est passé par `className` : ce composant ne décide que du comportement.
 */
export function BoutonCopieIp({
  className,
  children,
  'aria-label': ariaLabel,
}: {
  className?: string
  children: React.ReactNode
  'aria-label'?: string
}) {
  async function copier() {
    try {
      await navigator.clipboard.writeText(SITE.ip)
    } catch {
      // Presse-papier refusé (page non sécurisée, permission) : on affiche
      // quand même le toast, l'adresse y est lisible et sélectionnable.
    }
    window.dispatchEvent(new CustomEvent(EVENEMENT_COPIE))
  }

  return (
    <button type="button" onClick={copier} className={className} aria-label={ariaLabel}>
      {children}
    </button>
  )
}

/** Le toast « Adresse copiée ». À monter une seule fois par page. */
export function ToastCopie() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let minuteur: ReturnType<typeof setTimeout>

    function afficher() {
      setVisible(true)
      clearTimeout(minuteur)
      minuteur = setTimeout(() => setVisible(false), 2200)
    }

    window.addEventListener(EVENEMENT_COPIE, afficher)
    return () => {
      window.removeEventListener(EVENEMENT_COPIE, afficher)
      clearTimeout(minuteur)
    }
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-7 left-1/2 z-[200] -translate-x-1/2 rounded-xl border border-or bg-braise px-6 py-3 text-[15px] font-semibold text-creme shadow-[0_10px_30px_rgba(0,0,0,.5)] transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-20'
      }`}
    >
      Adresse copiée : {SITE.ip}
    </div>
  )
}
