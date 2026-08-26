'use client'

import { useState } from 'react'

import { classesBouton } from '@/components/ui/Bouton'
import { pseudoValide } from '@/lib/panier'

/**
 * Saisie du pseudo Minecraft qui recevra la livraison.
 *
 * ⚠ VOCABULAIRE. Aucun mot de « compte », « connexion » ou « déconnexion »,
 * aucun avatar, aucune pastille d'état. Il n'y a pas de comptes sur ce site :
 * un joueur qui croit s'être inscrit réclamera un mot de passe qui n'existe
 * pas. Tout ce qui est écrit ici doit dire une seule chose — c'est le pseudo
 * qui reçoit la livraison.
 *
 * Le pseudo n'est vérifié que sur sa FORME (3 à 16 caractères, lettres,
 * chiffres, tiret bas). Savoir si le pseudo existe vraiment demanderait un
 * appel à l'API Mojang, et on peut très bien offrir un kit à quelqu'un qui n'a
 * jamais rejoint le serveur.
 *
 * ⚠ Ce qui est saisi ici n'est qu'une COMMODITÉ D'AFFICHAGE, mémorisée dans le
 * navigateur. La commande est revalidée côté serveur par creerCommande : rien
 * de ce qui vient d'ici n'est une source de vérité.
 */
export function ChampPseudo({
  pseudo,
  onValider,
  onChanger,
  /** Prend le focus à l'ouverture du tiroir quand aucun pseudo n'est défini. */
  autoFocus = false,
}: {
  pseudo: string | null
  onValider: (pseudo: string) => void
  onChanger: () => void
  autoFocus?: boolean
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
    <div className="rounded-carte border border-bord bg-braise p-4">
      <p className="font-mono text-[10.5px] font-bold tracking-[.18em] text-gris uppercase">
        Pseudo de livraison
      </p>

      {pseudo === null ? (
        <>
          <div className="mt-2.5 flex gap-2">
            <label htmlFor="pseudo-minecraft" className="sr-only">
              Ton pseudo Minecraft, celui qui recevra la livraison
            </label>
            <input
              id="pseudo-minecraft"
              type="text"
              value={saisie}
              autoFocus={autoFocus}
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
              aria-describedby={erreur ? 'erreur-pseudo' : 'aide-pseudo'}
              className="min-h-11 min-w-0 flex-1 rounded-controle border border-bord bg-nuit px-3 font-mono text-sm text-creme placeholder:text-gris focus:border-soupe focus:outline-none"
            />
            <button
              type="button"
              onClick={valider}
              className={classesBouton({ variante: 'plein', className: 'shrink-0' })}
            >
              OK
            </button>
          </div>

          {erreur ? (
            <p id="erreur-pseudo" role="alert" className="mt-2.5 text-[12.5px] text-oni">
              Pseudo invalide : 3 à 16 caractères, lettres, chiffres et _ uniquement.
            </p>
          ) : (
            <p id="aide-pseudo" className="mt-2.5 text-[12.5px] text-gris">
              C’est ce pseudo qui recevra la livraison en jeu. Vérifie la casse.
            </p>
          )}
        </>
      ) : (
        <div className="mt-2.5 flex items-center gap-3">
          <p className="min-w-0 flex-1">
            <span className="block truncate font-mono text-[15px] font-bold text-creme">
              {pseudo}
            </span>
            <span className="mt-0.5 block text-[12.5px] text-gris">
              recevra la livraison en jeu
            </span>
          </p>

          <button
            type="button"
            onClick={() => {
              setSaisie(pseudo)
              onChanger()
            }}
            className="-my-2 flex min-h-11 shrink-0 items-center font-mono text-[11.5px] tracking-[.08em] text-gris underline underline-offset-2 transition-colors hover:text-creme"
          >
            Changer
          </button>
        </div>
      )}
    </div>
  )
}
