'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { ETAT_VIDE, type EtatFormulaire } from '@/actions/etat'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import { ChampCase, ChampTexte, MessageErreurGlobale } from '@/components/admin/Champs'
import { ChampsVenteEtLivraison } from '@/components/admin/ChampsTebex'
import { ListeAvantages } from '@/components/admin/ListeAvantages'
import { centimesVersEuros } from '@/lib/format'

export type GradeEnEdition = {
  slug: string
  nom: string
  kanji: string | null
  sousTitre: string | null
  etiquette: string | null
  prixEurosCentimes: number
  visible: boolean
  achetable: boolean
  heriteDuPrecedent: boolean
  tebexPackageId: number | null
  avantages: string[]
}

export function FormulaireGrade({
  action,
  grade,
  libelleBouton,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
  grade?: GradeEnEdition
  libelleBouton: string
}) {
  const [etat, envoyer] = useActionState(action, ETAT_VIDE)

  return (
    <form action={envoyer} className="flex flex-col gap-6">
      <MessageErreurGlobale message={etat.erreur} />

      <section className="flex flex-col gap-4 rounded-2xl border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base uppercase">Identité</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChampTexte
            nom="nom"
            label="Nom"
            defaultValue={grade?.nom}
            required
            placeholder="Ronin"
            erreurs={etat.champs?.nom}
          />
          <ChampTexte
            nom="slug"
            label="Slug"
            defaultValue={grade?.slug}
            required
            placeholder="ronin"
            aide="Minuscules, chiffres et tirets. Sert de clé au panier."
            erreurs={etat.champs?.slug}
          />
          <ChampTexte
            nom="kanji"
            label="Kanji (facultatif)"
            defaultValue={grade?.kanji ?? ''}
            placeholder="浪人"
            erreurs={etat.champs?.kanji}
          />
          <ChampTexte
            nom="sousTitre"
            label="Sous-titre (facultatif)"
            defaultValue={grade?.sousTitre ?? ''}
            placeholder="le sans-maître"
            aide="Affiché après le kanji, séparé par un point médian."
            erreurs={etat.champs?.sousTitre}
          />
        </div>

        <ChampTexte
          nom="etiquette"
          label="Étiquette de mise en avant (facultatif)"
          defaultValue={grade?.etiquette ?? ''}
          placeholder="Le plus pris"
          aide="Remplie, la carte passe en avant : bordure orange et bandeau. Vide, carte normale."
          erreurs={etat.champs?.etiquette}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base uppercase">Prix et disponibilité</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <ChampTexte
            nom="prixEuros"
            label="Prix en euros"
            defaultValue={centimesVersEuros(grade?.prixEurosCentimes ?? null)}
            required
            placeholder="5"
            aide="Accepte 5 ou 5,50."
            erreurs={etat.champs?.prixEurosCentimes}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ChampCase
            nom="visible"
            label="Visible sur la boutique"
            aide="Décoché, le grade disparaît complètement du site."
            defaultChecked={grade ? grade.visible : true}
          />
          <ChampCase
            nom="achetable"
            label="Achetable"
            aide="Décoché, il s’affiche mais ne peut pas être mis au panier."
            defaultChecked={grade ? grade.achetable : true}
          />
          <ChampCase
            nom="heriteDuPrecedent"
            label="Hérite du grade précédent"
            aide="Ajoute « ↳ Tout le grade X » en tête des avantages."
            defaultChecked={grade?.heriteDuPrecedent ?? false}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
        <ListeAvantages
          valeurInitiale={grade?.avantages}
          erreurs={etat.champs?.avantages}
        />
      </section>

      <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
        <h2 className="mb-4 font-titre text-base uppercase">Vente et livraison</h2>
        <ChampsVenteEtLivraison
          tebexPackageId={grade?.tebexPackageId}
          erreurs={etat.champs}
        />
      </section>

      <div className="flex items-center gap-3">
        <BoutonSoumettre>{libelleBouton}</BoutonSoumettre>
        <Link
          href="/admin/grades"
          className="rounded-lg border border-bord px-4 py-2.5 text-sm font-semibold text-gris transition-colors hover:text-creme"
        >
          Annuler
        </Link>
      </div>
    </form>
  )
}
