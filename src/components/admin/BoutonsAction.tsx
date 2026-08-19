'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

/**
 * Les petits boutons des tableaux de bord : ↑ ↓, bascules, suppression.
 *
 * Chacun vit dans son propre <form> dont l'action est une Server Action
 * pré-liée à l'id concerné. Pas de fetch, pas d'état client à synchroniser :
 * la page se re-rend avec les données fraîches après chaque action.
 */

/** Bouton générique qui se grise pendant l'envoi de son formulaire. */
function BoutonEnvoi({
  children,
  className,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={disabled || pending} className={className} {...props}>
      {children}
    </button>
  )
}

/** Flèche ↑ ou ↓ de réordonnancement. */
export function BoutonOrdre({
  action,
  direction,
  desactive,
}: {
  action: () => Promise<void>
  direction: 'haut' | 'bas'
  desactive: boolean
}) {
  return (
    <form action={action}>
      <BoutonEnvoi
        disabled={desactive}
        aria-label={direction === 'haut' ? 'Monter d’un cran' : 'Descendre d’un cran'}
        className="flex size-7 items-center justify-center rounded border border-bord text-gris transition-colors hover:border-soupe hover:text-soupe disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-bord disabled:hover:text-gris"
      >
        {direction === 'haut' ? '↑' : '↓'}
      </BoutonEnvoi>
    </form>
  )
}

/**
 * Pastille cliquable pour un booléen (visible, achetable, bientôt…).
 * L'état courant est lisible d'un coup d'œil : allumée = actif.
 */
export function BoutonBascule({
  action,
  actif,
  label,
  couleur = 'soupe',
}: {
  action: () => Promise<void>
  actif: boolean
  label: string
  couleur?: 'soupe' | 'vert' | 'violet'
}) {
  const couleursActives = {
    soupe: 'border-soupe bg-soupe/15 text-soupe',
    vert: 'border-vert bg-vert/15 text-vert',
    violet: 'border-violet bg-violet/15 text-violet',
  }[couleur]

  return (
    <form action={action}>
      <BoutonEnvoi
        aria-pressed={actif}
        title={`${label} — ${actif ? 'activé' : 'désactivé'}, cliquer pour basculer`}
        className={`rounded border px-2.5 py-1 font-mono text-[10.5px] font-bold tracking-wide uppercase transition-colors ${
          actif
            ? couleursActives
            : 'border-bord text-gris/60 hover:border-[#43305E] hover:text-gris'
        }`}
      >
        {label}
      </BoutonEnvoi>
    </form>
  )
}

/**
 * Suppression en deux temps : un premier clic demande confirmation,
 * le second envoie. Évite la boîte de dialogue native du navigateur.
 */
export function BoutonSupprimer({
  action,
  libelle = 'Supprimer',
}: {
  action: () => Promise<void>
  libelle?: string
}) {
  const [confirmation, setConfirmation] = useState(false)

  if (!confirmation) {
    return (
      <button
        type="button"
        onClick={() => setConfirmation(true)}
        className="rounded-lg border border-bord px-3 py-1.5 text-[13px] font-semibold text-gris transition-colors hover:border-rouge hover:text-rouge"
      >
        {libelle}
      </button>
    )
  }

  return (
    <form action={action} className="flex items-center gap-1.5">
      <BoutonEnvoi className="rounded-lg border border-rouge bg-rouge/15 px-3 py-1.5 text-[13px] font-bold text-rouge transition-colors hover:bg-rouge/25 disabled:opacity-60">
        Confirmer
      </BoutonEnvoi>
      <button
        type="button"
        onClick={() => setConfirmation(false)}
        className="rounded-lg border border-bord px-3 py-1.5 text-[13px] text-gris transition-colors hover:text-creme"
      >
        Annuler
      </button>
    </form>
  )
}

/**
 * Bouton d'action simple posté vers une Server Action pré-liée.
 * Sert aux changements de statut d'une commande.
 */
export function BoutonFormulaire({
  action,
  children,
  variante = 'neutre',
}: {
  action: () => Promise<void>
  children: React.ReactNode
  variante?: 'principal' | 'neutre' | 'danger'
}) {
  const styles = {
    principal:
      'bg-linear-[135deg] from-soupe to-or text-[#1A1005] hover:shadow-[0_4px_18px_rgba(254,147,1,.35)]',
    neutre: 'border border-bord text-gris hover:border-soupe hover:text-soupe',
    danger: 'border border-bord text-gris hover:border-rouge hover:text-rouge',
  }[variante]

  return (
    <form action={action}>
      <BoutonEnvoi
        className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${styles}`}
      >
        {children}
      </BoutonEnvoi>
    </form>
  )
}
