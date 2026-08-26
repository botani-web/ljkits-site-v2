'use client'

import { useActionState, useState } from 'react'

import { ETAT_VIDE, type EtatFormulaire } from '@/actions/etat'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'

/**
 * La suppression définitive d'une candidature, en deux temps.
 *
 * POURQUOI CETTE CÉRÉMONIE : le `CASCADE` du schéma emporte toutes les
 * réponses avec la candidature. Ce sont des textes écrits par une personne
 * réelle, sous un consentement figé, et rien ne les reconstituera. Un bouton
 * « Supprimer » ordinaire à côté d'un bouton « Corbeille » serait un piège.
 *
 * Premier temps : le panneau s'ouvre et dit ce qui va disparaître.
 * Second temps : il faut RETAPER le pseudo Minecraft du candidat.
 *
 * La saisie est revérifiée CÔTÉ SERVEUR (cf. supprimerDefinitivement) : ce
 * composant est un garde-fou d'ergonomie, pas une sécurité.
 */
export function SuppressionDefinitive({
  action,
  pseudoMinecraft,
  reponses,
  consentementAt,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
  pseudoMinecraft: string
  reponses: number
  consentementAt: string
}) {
  const [etat, envoyer] = useActionState(action, ETAT_VIDE)
  const [ouvert, setOuvert] = useState(false)
  const [saisie, setSaisie] = useState('')

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex min-h-11 items-center rounded-controle border border-bord px-3 text-[13px] font-semibold text-gris transition-colors hover:border-rouge hover:text-rouge"
      >
        Supprimer définitivement
      </button>
    )
  }

  const correspond = saisie.trim().toLowerCase() === pseudoMinecraft.toLowerCase()

  return (
    <form action={envoyer} className="rounded-controle border border-rouge/50 bg-rouge/10 p-4">
      <p className="text-[14px] font-bold text-rouge">
        Suppression définitive, sans retour possible.
      </p>

      <p className="mt-2 text-[13px] text-creme">
        Vont disparaître : la candidature de{' '}
        <strong className="font-mono">{pseudoMinecraft}</strong>, ses {reponses} réponse
        {reponses > 1 ? 's' : ''}, et le consentement recueilli le {consentementAt}.
        Aucune sauvegarde ne les rendra.
      </p>

      <label
        htmlFor="confirmation"
        className="mt-4 mb-1.5 block text-[13px] font-semibold text-creme"
      >
        Retape « {pseudoMinecraft} » pour confirmer
      </label>
      <input
        id="confirmation"
        name="confirmation"
        type="text"
        value={saisie}
        onChange={(evenement) => setSaisie(evenement.target.value)}
        autoComplete="off"
        spellCheck={false}
        className="w-full max-w-xs rounded-controle border border-bord bg-nuit px-3.5 py-2.5 font-mono text-[15px] text-creme focus:border-rouge focus:outline-none"
      />

      {etat.erreur && (
        <p role="alert" className="mt-2 text-[13px] text-rouge">
          {etat.erreur}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Le bouton ne s'arme que quand la saisie correspond : il n'y a pas
            de clic malheureux possible. */}
        {correspond ? (
          <BoutonSoumettre enCours="Suppression…">Supprimer définitivement</BoutonSoumettre>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 cursor-not-allowed items-center rounded-controle border border-bord px-4 text-[13px] font-semibold text-gris opacity-50"
          >
            Supprimer définitivement
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setOuvert(false)
            setSaisie('')
          }}
          className="inline-flex min-h-11 items-center rounded-controle border border-bord px-4 text-[13px] text-gris transition-colors hover:text-creme"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
