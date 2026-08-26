'use client'

import { useEffect, useState } from 'react'

import { useReglages } from '@/components/public/ContexteReglages'

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
  const { ip } = useReglages()

  async function copier() {
    try {
      await navigator.clipboard.writeText(ip)
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

/**
 * Le grand bouton de copie des blocs d'appel de fin de page : l'adresse en
 * gros, précédée d'une icône de presse-papier.
 *
 * C'est le seul bouton du site qui ne passe pas par `classesBouton` : il est
 * deux fois plus grand, en or plutôt qu'en soupe, et sur fond de carte plutôt
 * qu'en aplat. Le mutualiser aurait demandé une quatrième variante utilisée à
 * un seul endroit par page.
 */
export function BoutonIpGeant({ className = '' }: { className?: string }) {
  const { ip } = useReglages()

  return (
    <BoutonCopieIp
      aria-label={`Copier l’adresse du serveur, ${ip}`}
      className={`inline-flex min-h-11 items-center gap-3.5 rounded-carte border border-bord bg-charbon px-5.5 py-4 font-mono text-[clamp(15px,2.4vw,21px)] font-bold text-or transition-colors hover:border-soupe ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        className="size-[19px] shrink-0 text-gris"
      >
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h10" />
      </svg>
      {ip}
    </BoutonCopieIp>
  )
}

/** Le toast « Adresse copiée ». À monter une seule fois par page. */
export function ToastCopie() {
  const { ip } = useReglages()
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
      className={`fixed bottom-6.5 left-1/2 z-[200] -translate-x-1/2 rounded-carte bg-soupe px-5.5 py-3.5 font-mono text-[12.5px] font-bold tracking-[.06em] text-encre shadow-[0_16px_40px_rgba(0,0,0,.6)] transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-[150%]'
      }`}
    >
      Adresse copiée : {ip}
    </div>
  )
}
