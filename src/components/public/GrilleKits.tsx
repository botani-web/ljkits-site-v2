'use client'

import { useState } from 'react'

import { CarteKit, type KitEnCarte } from '@/components/public/CarteKit'

/**
 * La grille des kits et ses trois filtres.
 *
 * Composant client : le filtrage se fait dans le navigateur, sans aller-retour
 * serveur. Les 21 kits sont déjà tous dans la page, on ne fait que masquer.
 */
type Filtre = 'tous' | 'GRATUIT' | 'EXCLUSIF'

const FILTRES: { cle: Filtre; label: string }[] = [
  { cle: 'tous', label: 'Tous' },
  { cle: 'GRATUIT', label: 'En coins' },
  { cle: 'EXCLUSIF', label: 'Exclusifs' },
]

export function GrilleKits({ kits }: { kits: KitEnCarte[] }) {
  const [filtre, setFiltre] = useState<Filtre>('tous')

  const kitsAffiches = filtre === 'tous' ? kits : kits.filter((kit) => kit.type === filtre)

  return (
    <>
      <div className="mt-11 mb-6.5 flex flex-wrap items-center gap-2 border-b border-bord pb-4">
        {FILTRES.map((option) => {
          const actif = filtre === option.cle

          return (
            <button
              key={option.cle}
              type="button"
              onClick={() => setFiltre(option.cle)}
              aria-pressed={actif}
              className={`rounded-lg border px-3.5 py-2 font-mono text-[12.5px] font-bold tracking-wide uppercase transition-colors ${
                actif
                  ? 'border-soupe bg-soupe text-[#1a0f00]'
                  : 'border-bord text-gris hover:border-[#3d2f5c] hover:text-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}

        <span className="ml-auto font-mono text-[12.5px] text-gris" aria-live="polite">
          {kitsAffiches.length} {kitsAffiches.length > 1 ? 'kits' : 'kit'}
        </span>
      </div>

      {kitsAffiches.length === 0 ? (
        <p className="rounded-xl border border-bord bg-charbon px-6 py-10 text-center text-gris">
          Aucun kit dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="grid gap-4 pb-5 sm:grid-cols-2 lg:grid-cols-3">
          {kitsAffiches.map((kit) => (
            <CarteKit key={kit.slug} kit={kit} />
          ))}
        </div>
      )}
    </>
  )
}
