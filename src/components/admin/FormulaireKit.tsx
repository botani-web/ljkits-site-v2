'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { ETAT_VIDE, type EtatFormulaire } from '@/actions/etat'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import {
  ChampCase,
  ChampSelection,
  ChampTexte,
  MessageErreurGlobale,
} from '@/components/admin/Champs'
import { ChampsVenteEtLivraison } from '@/components/admin/ChampsTebex'
import { EditeurMarkdown } from '@/components/admin/EditeurMarkdown'
import { ListeCaracteristiques } from '@/components/admin/ListeCaracteristiques'
import { centimesVersEuros } from '@/lib/format'

/** Valeurs de départ du formulaire : celles d'un kit existant, ou rien. */
export type KitEnEdition = {
  slug: string
  nom: string
  kanji: string | null
  role: string
  descriptionCourte: string
  descriptionLongue: string
  prixCoins: number
  prixEurosCentimes: number | null
  type: 'GRATUIT' | 'EXCLUSIF'
  visible: boolean
  achetable: boolean
  bientot: boolean
  kitDeDepart: boolean
  commandeLivraison: string
  commandeRetrait: string
  tebexPackageId: number | null
  caracteristiques: { libelle: string; valeur: string }[]
}

export function FormulaireKit({
  action,
  kit,
  libelleBouton,
}: {
  /** Server Action déjà liée : creerKit, ou modifierKit.bind(null, id). */
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
  kit?: KitEnEdition
  libelleBouton: string
}) {
  const [etat, envoyer] = useActionState(action, ETAT_VIDE)

  return (
    <form action={envoyer} className="flex flex-col gap-6">
      <MessageErreurGlobale message={etat.erreur} />

      {/* ------------------------- identité du kit ------------------------- */}
      <section className="flex flex-col gap-4 rounded-2xl border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base uppercase">Identité</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChampTexte
            nom="nom"
            label="Nom"
            defaultValue={kit?.nom}
            required
            placeholder="Kitsune"
            erreurs={etat.champs?.nom}
          />
          <ChampTexte
            nom="slug"
            label="Slug (adresse de la page)"
            defaultValue={kit?.slug}
            required
            placeholder="kitsune"
            aide="Minuscules, chiffres et tirets. Donne /kits/kitsune."
            erreurs={etat.champs?.slug}
          />
          <ChampTexte
            nom="role"
            label="Rôle"
            defaultValue={kit?.role}
            required
            placeholder="Tromperie"
            aide="Le surtitre affiché sur la carte."
            erreurs={etat.champs?.role}
          />
          <ChampTexte
            nom="kanji"
            label="Kanji (facultatif)"
            defaultValue={kit?.kanji ?? ''}
            placeholder="狐"
            aide="Réservé aux kits exclusifs."
            erreurs={etat.champs?.kanji}
          />
        </div>

        <ChampTexte
          nom="descriptionCourte"
          label="Description courte"
          defaultValue={kit?.descriptionCourte}
          required
          maxLength={300}
          placeholder="Une ou deux phrases, affichées sur la carte."
          erreurs={etat.champs?.descriptionCourte}
        />
      </section>

      {/* --------------------------- prix et type -------------------------- */}
      <section className="flex flex-col gap-4 rounded-2xl border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base uppercase">Prix et catégorie</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <ChampTexte
            nom="prixCoins"
            label="Prix en coins"
            type="number"
            min={0}
            step={1}
            defaultValue={kit?.prixCoins ?? 0}
            required
            aide="0 affiche « Gratuit »."
            erreurs={etat.champs?.prixCoins}
          />
          <ChampTexte
            nom="prixEuros"
            label="Prix en euros (facultatif)"
            defaultValue={centimesVersEuros(kit?.prixEurosCentimes ?? null)}
            placeholder="4"
            aide="Laisser vide si non concerné."
            erreurs={etat.champs?.prixEurosCentimes}
          />
          <ChampSelection
            nom="type"
            label="Type"
            defaultValue={kit?.type ?? 'GRATUIT'}
            options={[
              { valeur: 'GRATUIT', label: 'Classique (en coins)' },
              { valeur: 'EXCLUSIF', label: 'Exclusif' },
            ]}
            erreurs={etat.champs?.type}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ChampCase
            nom="visible"
            label="Visible sur le site"
            aide="Décoché, le kit reste ici sans apparaître publiquement."
            defaultChecked={kit ? kit.visible : true}
          />
          <ChampCase
            nom="achetable"
            label="Achetable en euros"
            aide="Prépare la boutique. Sans effet en phase 1."
            defaultChecked={kit?.achetable ?? false}
          />
          <ChampCase
            nom="bientot"
            label="Bientôt disponible"
            aide="Affiche le badge « Bientôt » sur la carte."
            defaultChecked={kit?.bientot ?? false}
          />
          <ChampCase
            nom="kitDeDepart"
            label="Kit de départ"
            aide="Affiche le badge vert « Kit de départ »."
            defaultChecked={kit?.kitDeDepart ?? false}
          />
        </div>
      </section>

      {/* ------------------------ fiche technique -------------------------- */}
      <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
        <ListeCaracteristiques
          valeurInitiale={kit?.caracteristiques}
          erreurs={etat.champs?.caracteristiques}
        />
      </section>

      {/* --------------------- vente et livraison en jeu -------------------- */}
      <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
        <h2 className="mb-4 font-titre text-base uppercase">Vente et livraison</h2>
        <ChampsVenteEtLivraison
          tebexPackageId={kit?.tebexPackageId}
          commandeLivraison={kit?.commandeLivraison}
          commandeRetrait={kit?.commandeRetrait}
          exempleLivraison="kitadmin add {pseudo} kenshi"
          exempleRetrait="kitadmin remove {pseudo} kenshi"
          erreurs={etat.champs}
        />
      </section>

      {/* ------------------------ description longue ----------------------- */}
      <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
        <EditeurMarkdown
          nom="descriptionLongue"
          label="Description longue (page du kit)"
          valeurInitiale={kit?.descriptionLongue ?? ''}
          erreurs={etat.champs?.descriptionLongue}
        />
      </section>

      <div className="flex items-center gap-3">
        <BoutonSoumettre>{libelleBouton}</BoutonSoumettre>
        <Link
          href="/admin/kits"
          className="rounded-lg border border-bord px-4 py-2.5 text-sm font-semibold text-gris transition-colors hover:text-creme"
        >
          Annuler
        </Link>
      </div>
    </form>
  )
}
