'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { ETAT_VIDE, type EtatFormulaire } from '@/actions/etat'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import {
  ChampCase,
  ChampTexte,
  ChampZoneTexte,
  MessageErreurGlobale,
} from '@/components/admin/Champs'
import { ChampsVenteEtLivraison } from '@/components/admin/ChampsTebex'
import { centimesVersEuros, formaterEuros } from '@/lib/format'

export type PackEnEdition = {
  slug: string
  nom: string
  description: string
  prixEurosCentimes: number
  prixBarreCentimes: number | null
  visible: boolean
  achetable: boolean
  tebexPackageId: number | null
  kitIds: string[]
}

/** Les kits sélectionnables, tels que la page les fournit. */
export type KitSelectionnable = {
  id: string
  nom: string
  slug: string
  prixEurosCentimes: number | null
}

export function FormulairePack({
  action,
  pack,
  kitsDisponibles,
  libelleBouton,
}: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>
  pack?: PackEnEdition
  kitsDisponibles: KitSelectionnable[]
  libelleBouton: string
}) {
  const [etat, envoyer] = useActionState(action, ETAT_VIDE)

  // Somme des kits cochés à l'ouverture : sert à afficher l'économie réalisée.
  const valeurUnitaire = kitsDisponibles
    .filter((kit) => pack?.kitIds.includes(kit.id))
    .reduce((somme, kit) => somme + (kit.prixEurosCentimes ?? 0), 0)

  return (
    <form action={envoyer} className="flex flex-col gap-6">
      <MessageErreurGlobale message={etat.erreur} />

      <section className="flex flex-col gap-4 rounded-2xl border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base uppercase">Identité</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChampTexte
            nom="nom"
            label="Nom"
            defaultValue={pack?.nom}
            required
            placeholder="Les six kits"
            erreurs={etat.champs?.nom}
          />
          <ChampTexte
            nom="slug"
            label="Slug"
            defaultValue={pack?.slug}
            required
            placeholder="pack-kits-exclusifs"
            erreurs={etat.champs?.slug}
          />
        </div>

        <ChampZoneTexte
          nom="description"
          label="Description"
          defaultValue={pack?.description}
          required
          rows={2}
          maxLength={300}
          placeholder="Le pack complet, débloqué d’un coup sur ton compte."
          erreurs={etat.champs?.description}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base uppercase">Prix et disponibilité</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChampTexte
            nom="prixEuros"
            label="Prix du pack"
            defaultValue={centimesVersEuros(pack?.prixEurosCentimes ?? null)}
            required
            placeholder="18"
            erreurs={etat.champs?.prixEurosCentimes}
          />
          <ChampTexte
            nom="prixBarre"
            label="Prix barré (facultatif)"
            defaultValue={centimesVersEuros(pack?.prixBarreCentimes ?? null)}
            placeholder="24"
            aide={
              valeurUnitaire > 0
                ? `Les kits cochés valent ${formaterEuros(valeurUnitaire)} à l’unité.`
                : 'Affiché barré à gauche du prix réel.'
            }
            erreurs={etat.champs?.prixBarreCentimes}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ChampCase
            nom="visible"
            label="Visible sur la boutique"
            defaultChecked={pack ? pack.visible : true}
          />
          <ChampCase
            nom="achetable"
            label="Achetable"
            aide="Décoché, il s’affiche mais ne peut pas être mis au panier."
            defaultChecked={pack ? pack.achetable : true}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
        <h2 className="mb-1.5 font-titre text-base uppercase">Kits inclus</h2>
        <p className="mb-4 text-[13px] text-gris">
          Sert à documenter le contenu du pack. La livraison, elle, dépend uniquement des
          commandes console saisies plus bas.
        </p>

        {kitsDisponibles.length === 0 ? (
          <p className="text-sm text-gris">Aucun kit disponible.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {kitsDisponibles.map((kit) => (
              <label
                key={kit.id}
                htmlFor={`kit-${kit.id}`}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-bord bg-nuit px-3 py-2.5 transition-colors hover:border-[#43305E]"
              >
                <input
                  id={`kit-${kit.id}`}
                  type="checkbox"
                  name="kitId"
                  value={kit.id}
                  defaultChecked={pack?.kitIds.includes(kit.id) ?? false}
                  className="size-4 shrink-0 accent-soupe"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{kit.nom}</span>
                  <span className="block font-mono text-[11px] text-gris">
                    {kit.prixEurosCentimes !== null
                      ? formaterEuros(kit.prixEurosCentimes)
                      : 'sans prix en euros'}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
        <h2 className="mb-4 font-titre text-base uppercase">Vente et livraison</h2>
        <ChampsVenteEtLivraison
          tebexPackageId={pack?.tebexPackageId}
          erreurs={etat.champs}
        />
      </section>

      <div className="flex items-center gap-3">
        <BoutonSoumettre>{libelleBouton}</BoutonSoumettre>
        <Link
          href="/admin/packs"
          className="rounded-lg border border-bord px-4 py-2.5 text-sm font-semibold text-gris transition-colors hover:text-creme"
        >
          Annuler
        </Link>
      </div>
    </form>
  )
}
