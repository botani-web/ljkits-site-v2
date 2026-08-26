'use client'

import { useFormStatus } from 'react-dom'

import { classesBouton } from '@/components/ui/Bouton'

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
      className={classesBouton({
        variante: 'plein',
        className:
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-soupe disabled:hover:shadow-none',
      })}
    >
      {pending ? enCours : children}
    </button>
  )
}
