'use client'

import { useActionState, useState } from 'react'

import { ETAT_VIDE } from '@/actions/etat'
import { enregistrerEvenement } from '@/actions/evenements'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import { ChampCase, ChampTexte, ChampZoneTexte, MessageErreurGlobale } from '@/components/admin/Champs'
import type { Evenement } from '@/lib/evenements'

/** « 2026-10-24T21:00 » dans l'heure locale du navigateur, pour un <input type="datetime-local">. */
function versChampLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const z = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`
}

/** Le formulaire d'un événement (24/10/2026) : vide pour en créer un, rempli pour le modifier. */
export function FormulaireEvenement({ evenement }: { evenement?: Evenement }) {
  const [etat, envoyer] = useActionState(enregistrerEvenement, ETAT_VIDE)
  const [debut, setDebut] = useState(versChampLocal(evenement?.debut))
  const [fin, setFin] = useState(versChampLocal(evenement?.fin))
  // Converties ici, dans le fuseau de l'admin (Paris) : le serveur Vercel, lui, est en UTC.
  const debutIso = debut ? new Date(debut).toISOString() : ''
  const finIso = fin ? new Date(fin).toISOString() : ''
  const e = evenement

  return (
    <form action={envoyer} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={e?.id ?? 0} />
      <input type="hidden" name="debutIso" value={debutIso} />
      <input type="hidden" name="finIso" value={finIso} />
      <MessageErreurGlobale message={etat.erreur} />
      {etat.succes && (
        <p role="status" className="rounded-controle border border-vert/40 bg-vert/10 px-4 py-3 text-sm text-vert">
          {etat.succes}
        </p>
      )}

      <section className="flex flex-col gap-4 rounded-carte border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base">L&apos;événement</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampTexte nom="nom" label="Nom" defaultValue={e?.nom} placeholder="Tournoi HG Run #1" required erreurs={etat.champs?.nom} />
          <ChampTexte nom="nomEn" label="Nom en anglais" aide="Vide = le nom français." defaultValue={e?.nomEn} erreurs={etat.champs?.nomEn} />
        </div>
        <ChampTexte
          nom="slug"
          label="Adresse"
          aide="ljkits.eu/evenements/… — vide = tirée du nom."
          defaultValue={e?.slug}
          placeholder="tournoi-hg-run-1"
          erreurs={etat.champs?.slug}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampTexte
            nom="debutAffiche"
            label="Début (heure de Paris)"
            type="datetime-local"
            value={debut}
            onChange={(x) => setDebut(x.target.value)}
            aide="Les parties du HG Run finies après ce moment comptent."
            erreurs={etat.champs?.debut}
          />
          <ChampTexte
            nom="finAffiche"
            label="Fin (heure de Paris)"
            type="datetime-local"
            value={fin}
            onChange={(x) => setFin(x.target.value)}
            aide="…et avant celui-ci. Garde de la marge après la dernière manche."
            erreurs={etat.champs?.fin}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampZoneTexte nom="description" label="Description" rows={3} defaultValue={e?.description} erreurs={etat.champs?.description} />
          <ChampZoneTexte nom="descriptionEn" label="Description en anglais" rows={3} defaultValue={e?.descriptionEn} erreurs={etat.champs?.descriptionEn} />
        </div>
        <ChampCase nom="publie" label="Visible sur le site" aide="Décoché, la page n'est pas affichée." defaultChecked={e?.publie ?? true} />
      </section>

      <section className="flex flex-col gap-4 rounded-carte border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base">Cashprize et barème</h2>
        <ChampTexte nom="cashprize" label="Cashprize (total affiché)" defaultValue={e?.cashprize} placeholder="35 €" erreurs={etat.champs?.cashprize} />
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampZoneTexte
            nom="prix"
            label="Les prix (une ligne par prix)"
            rows={4}
            defaultValue={e?.prix}
            placeholder={'Top 3 — 30 €\nMeilleur clip — 5 € (vote de la communauté)'}
            erreurs={etat.champs?.prix}
          />
          <ChampZoneTexte nom="prixEn" label="Les prix en anglais" rows={4} defaultValue={e?.prixEn} erreurs={etat.champs?.prixEn} />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <ChampTexte
            nom="points"
            label="Points par place (1er, 2e, …)"
            defaultValue={(e?.points ?? [20, 15, 12, 10, 8, 6, 5, 4, 3, 2, 1, 1, 1, 1, 1]).join(', ')}
            aide="Le même barème que /compet en jeu (config du Run)."
            erreurs={etat.champs?.points}
          />
          <ChampTexte nom="pointsKill" label="Points par kill" type="number" min={0} max={100} defaultValue={e?.pointsKill ?? 2} erreurs={etat.champs?.pointsKill} />
        </div>
      </section>

      <div>
        <BoutonSoumettre>{e ? 'Enregistrer' : "Créer l'événement"}</BoutonSoumettre>
      </div>
    </form>
  )
}
