'use client'

import { useMemo, useState } from 'react'

import { CarteKitBoutique } from '@/components/boutique/Cartes'
import type { KitBoutique } from '@/components/boutique/types'
import { Recherche } from '@/components/ui/BarreOutils'
import { EtatVide } from '@/components/ui/EtatVide'
import { Filtre } from '@/components/ui/Pilule'
import { formaterEuros } from '@/lib/format'
import type { ArticlePanier } from '@/lib/panier'
import { contient } from '@/lib/panier'

/**
 * La grille des kits en vente, ses deux filtres et sa recherche.
 *
 * Contrairement à celle de /kits, sa barre d'outils n'est PAS collante : la
 * boutique en a déjà une, celle du pseudo et du panier. Deux barres empilées
 * au scroll mangeraient un tiers d'un écran de téléphone.
 */
type CleFiltre = 'tous' | 'classique' | 'exclusif'

export function GrilleKitsBoutique({
  kits,
  panier,
  onBasculer,
}: {
  kits: KitBoutique[]
  panier: ArticlePanier[]
  onBasculer: (article: ArticlePanier) => void
}) {
  const [filtre, setFiltre] = useState<CleFiltre>('tous')
  const [recherche, setRecherche] = useState('')

  /**
   * Les libellés annoncent le prix de la famille quand il est unique —
   * « Exclusifs · 4 € ». Calculé, jamais écrit en dur : le jour où un kit
   * exclusif change de prix, le libellé perd simplement son suffixe au lieu
   * de mentir.
   */
  const filtres = useMemo(() => {
    function suffixePrix(famille: KitBoutique[]) {
      if (famille.length === 0) return ''
      const prix = new Set(famille.map((kit) => kit.prixEurosCentimes))
      return prix.size === 1 ? ` · ${formaterEuros([...prix][0])}` : ''
    }

    const classiques = kits.filter((kit) => kit.type === 'GRATUIT')
    const exclusifs = kits.filter((kit) => kit.type === 'EXCLUSIF')

    return [
      { cle: 'tous' as const, label: 'Tous', garde: () => true },
      {
        cle: 'classique' as const,
        label: `Classiques${suffixePrix(classiques)}`,
        garde: (kit: KitBoutique) => kit.type === 'GRATUIT',
      },
      {
        cle: 'exclusif' as const,
        label: `Exclusifs${suffixePrix(exclusifs)}`,
        garde: (kit: KitBoutique) => kit.type === 'EXCLUSIF',
      },
    ]
  }, [kits])

  const kitsAffiches = useMemo(() => {
    const garde = filtres.find((option) => option.cle === filtre)!.garde
    const terme = recherche.trim().toLocaleLowerCase('fr')

    return kits.filter((kit) => {
      if (!garde(kit)) return false
      if (terme === '') return true

      return [kit.nom, kit.role, kit.descriptionCourte].some((champ) =>
        champ.toLocaleLowerCase('fr').includes(terme),
      )
    })
  }, [kits, filtres, filtre, recherche])

  return (
    <>
      <div className="mt-6.5 flex flex-wrap items-center gap-2.25">
        <div className="flex flex-wrap gap-1.5 max-[560px]:w-full" role="group" aria-label="Filtrer les kits">
          {filtres.map((option) => (
            <Filtre
              key={option.cle}
              actif={filtre === option.cle}
              onClick={() => setFiltre(option.cle)}
              className="max-[560px]:flex-1"
            >
              {option.label}
            </Filtre>
          ))}
        </div>

        <Recherche
          valeur={recherche}
          onChange={setRecherche}
          etiquette="Chercher un kit"
          placeholder="Chercher un kit"
        />
      </div>

      {kitsAffiches.length === 0 ? (
        <EtatVide
          className="mt-4"
          message="Aucun kit ne correspond à cette recherche."
          action={{
            libelle: 'Tout réafficher',
            onClick: () => {
              setFiltre('tous')
              setRecherche('')
            },
          }}
        />
      ) : (
        <div className="mt-4 grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(232px,1fr))] max-[560px]:grid-cols-2">
          {kitsAffiches.map((kit) => (
            <CarteKitBoutique
              key={kit.slug}
              kit={kit}
              dansLePanier={contient(panier, { type: 'KIT', slug: kit.slug })}
              onBasculer={() => onBasculer({ type: 'KIT', slug: kit.slug })}
            />
          ))}
        </div>
      )}
    </>
  )
}
