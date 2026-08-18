'use client'

import { useFormStatus } from 'react-dom'

/**
 * Bouton d'envoi qui se désactive pendant que la Server Action tourne.
 * useFormStatus() lit l'état du <form> parent : ce composant doit donc être
 * placé À L'INTÉRIEUR du formulaire, jamais autour.
 */
export function BoutonSoumettre({
  children,
  enCours = 'Enregistrement…',
}: {
  children: React.ReactNode
  enCours?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-linear-[135deg] from-soupe to-or px-5 py-2.5 text-sm font-bold text-[#1A1005] transition-all hover:shadow-[0_4px_18px_rgba(254,147,1,.35)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
    >
      {pending ? enCours : children}
    </button>
  )
}
