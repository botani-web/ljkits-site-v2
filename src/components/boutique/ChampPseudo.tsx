'use client'

import Image from 'next/image'
import { useState } from 'react'

import { pseudoValide, urlAvatar } from '@/lib/panier'

/**
 * Saisie du pseudo Minecraft de livraison.
 *
 * Une fois validé, le skin s'affiche : c'est la confirmation visuelle que le
 * compte est le bon, comme dans la maquette. Le pseudo n'est vérifié que sur
 * sa FORME (3-16 caractères, lettres, chiffres, _) — savoir si le compte
 * existe vraiment demanderait un appel à l'API Mojang, et un joueur peut très
 * bien acheter pour un compte qui n'a jamais rejoint le serveur.
 */
export function ChampPseudo({
  pseudo,
  onValider,
  onChanger,
}: {
  pseudo: string | null
  onValider: (pseudo: string) => void
  onChanger: () => void
}) {
  const [saisie, setSaisie] = useState('')
  const [erreur, setErreur] = useState(false)

  function valider() {
    const propre = saisie.trim()
    if (!pseudoValide(propre)) {
      setErreur(true)
      return
    }
    setErreur(false)
    onValider(propre)
  }

  return (
    <div className="mb-4 rounded-[9px] border border-bord bg-braise p-3.5">
      <div className="mb-2.5 font-mono text-[10.5px] tracking-[1.4px] text-gris uppercase">
        Compte de livraison
      </div>

      {pseudo === null ? (
        <>
          <div className="flex gap-2">
            <label htmlFor="pseudo-minecraft" className="sr-only">
              Pseudo Minecraft
            </label>
            <input
              id="pseudo-minecraft"
              type="text"
              value={saisie}
              onChange={(evenement) => {
                setSaisie(evenement.target.value)
                setErreur(false)
              }}
              onKeyDown={(evenement) => {
                if (evenement.key === 'Enter') {
                  evenement.preventDefault()
                  valider()
                }
              }}
              placeholder="Ton pseudo Minecraft"
              maxLength={16}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={erreur}
              aria-describedby={erreur ? 'erreur-pseudo' : undefined}
              className="min-w-0 flex-1 rounded-[7px] border border-bord bg-nuit px-3 py-2.5 font-mono text-sm text-white placeholder:text-[#5e5473] focus:border-soupe focus:outline-none"
            />
            <button
              type="button"
              onClick={valider}
              className="shrink-0 rounded-[7px] bg-soupe px-4 font-mono text-[12.5px] font-bold text-[#1a0f00] transition-colors hover:bg-or"
            >
              OK
            </button>
          </div>

          {erreur && (
            <p id="erreur-pseudo" role="alert" className="mt-2 text-[12.5px] text-oni">
              Pseudo invalide : 3 à 16 caractères, lettres, chiffres et _ uniquement.
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center gap-3">
          <Image
            src={urlAvatar(pseudo, 104)}
            alt={`Skin de ${pseudo}`}
            width={52}
            height={52}
            unoptimized
            className="size-13 rounded-md border border-bord [image-rendering:pixelated]"
          />
          <div className="min-w-0">
            <div className="truncate font-mono text-[15px] font-bold">{pseudo}</div>
            <div className="text-[12.5px] text-vert">Compte sélectionné</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSaisie(pseudo)
              onChanger()
            }}
            className="ml-auto shrink-0 text-xs text-gris underline underline-offset-2 transition-colors hover:text-white"
          >
            Changer
          </button>
        </div>
      )}
    </div>
  )
}
