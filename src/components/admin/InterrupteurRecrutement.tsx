'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

import { basculerRecrutement } from '@/actions/recrutement'
import { LIEN_FORMULAIRE } from '@/lib/recrutement-partage'

function BoutonEnvoi({
  children,
  className,
}: {
  children: React.ReactNode
  className: string
}) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? 'Un instant…' : children}
    </button>
  )
}

/**
 * L'interrupteur d'ouverture du recrutement.
 *
 * DISSYMÉTRIQUE, VOLONTAIREMENT.
 *
 * FERMER est immédiat : c'est le geste qu'on fait quand quelque chose dérape,
 * il ne doit rien demander.
 *
 * OUVRIR passe par une confirmation en une étape, parce que ce clic change la
 * nature de la page : elle cesse d'être une page fermée pour devenir un
 * formulaire que remplira quiconque possède le lien — et un lien partagé sur
 * Discord se recopie. Pas de modale : un texte explicite là où on va cliquer,
 * qui dit exactement ce qui va se passer.
 */
export function InterrupteurRecrutement({ ouvert }: { ouvert: boolean }) {
  const [confirmation, setConfirmation] = useState(false)

  /* --- ouvert : on peut fermer d'un clic ------------------------------- */
  if (ouvert) {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-carte border border-vert/40 bg-vert/5 px-5 py-4">
        <div className="min-w-[220px] flex-1">
          <p className="text-[15px] font-bold text-vert">Recrutement ouvert</p>
          <p className="mt-1 text-[13px] text-gris">
            Le formulaire accepte les candidatures. Toute personne ayant le lien peut
            l’envoyer.
          </p>
        </div>

        <form action={basculerRecrutement}>
          <BoutonEnvoi className="inline-flex min-h-11 items-center rounded-controle border border-bord px-4 text-[13px] font-semibold text-gris transition-colors hover:border-rouge hover:text-rouge">
            Fermer le recrutement
          </BoutonEnvoi>
        </form>
      </div>
    )
  }

  /* --- fermé : confirmation avant d'ouvrir ------------------------------ */
  return (
    <div className="rounded-carte border border-bord bg-charbon px-5 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-[220px] flex-1">
          <p className="text-[15px] font-bold text-creme">Recrutement fermé</p>
          <p className="mt-1 text-[13px] text-gris">
            La page affiche ton message de fermeture. Aucune candidature ne peut être
            envoyée.
          </p>
        </div>

        {!confirmation && (
          <button
            type="button"
            onClick={() => setConfirmation(true)}
            className="inline-flex min-h-11 items-center rounded-controle bg-soupe px-4 text-[13px] font-bold text-encre transition-colors hover:bg-or"
          >
            Ouvrir le recrutement
          </button>
        )}
      </div>

      {confirmation && (
        <div className="mt-4 rounded-controle border border-soupe/40 bg-soupe/5 p-4">
          <p className="text-[14px] text-creme">
            En ouvrant, <strong className="font-bold">n’importe qui ayant le lien</strong>{' '}
            pourra envoyer une candidature. La page reste invisible sur le site et non
            indexée, mais un lien partagé se recopie : considère-le comme public dès que
            tu l’envoies à quelqu’un.
          </p>

          <p className="mt-2 font-mono text-[12.5px] break-all text-gris">
            {LIEN_FORMULAIRE}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <form action={basculerRecrutement}>
              <BoutonEnvoi className="inline-flex min-h-11 items-center rounded-controle bg-soupe px-4 text-[13px] font-bold text-encre transition-colors hover:bg-or">
                J’ai compris, ouvrir le formulaire à quiconque a le lien
              </BoutonEnvoi>
            </form>

            <button
              type="button"
              onClick={() => setConfirmation(false)}
              className="inline-flex min-h-11 items-center rounded-controle border border-bord px-4 text-[13px] text-gris transition-colors hover:text-creme"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
