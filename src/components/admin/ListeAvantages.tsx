'use client'

import { useState } from 'react'

/**
 * La liste d'avantages d'un grade — une ligne de texte par avantage.
 *
 * Chaque ligne produit un champ nommé `avantage` ; côté serveur,
 * formData.getAll('avantage') les récupère dans l'ordre d'affichage.
 * Même principe que ListeCaracteristiques, en plus simple : un seul champ
 * par ligne au lieu de deux.
 */
type Ligne = { cle: number; texte: string }

const MAXIMUM = 12

export function ListeAvantages({
  valeurInitiale = [],
  erreurs,
}: {
  valeurInitiale?: string[]
  erreurs?: string[]
}) {
  const [lignes, setLignes] = useState<Ligne[]>(() =>
    valeurInitiale.length > 0
      ? valeurInitiale.map((texte, index) => ({ cle: index, texte }))
      : [{ cle: 0, texte: '' }],
  )
  const [prochaineCle, setProchaineCle] = useState(valeurInitiale.length || 1)

  function ajouter() {
    if (lignes.length >= MAXIMUM) return
    setLignes([...lignes, { cle: prochaineCle, texte: '' }])
    setProchaineCle(prochaineCle + 1)
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-creme">Avantages</span>
        <span className="font-mono text-xs text-gris">
          {lignes.length} / {MAXIMUM}
        </span>
      </div>
      <p className="mb-3 text-[13px] text-gris">
        Une ligne par avantage, dans l’ordre d’affichage. La mention « Tout le grade
        précédent » s’ajoute toute seule si la case correspondante est cochée.
      </p>

      <div className="flex flex-col gap-2">
        {lignes.map((ligne) => (
          <div key={ligne.cle} className="flex gap-2">
            <input
              name="avantage"
              value={ligne.texte}
              onChange={(evenement) =>
                setLignes(
                  lignes.map((l) =>
                    l.cle === ligne.cle ? { ...l, texte: evenement.target.value } : l,
                  ),
                )
              }
              placeholder="Préfixe dans le chat et le TAB"
              aria-label="Avantage"
              className="flex-1 rounded-lg border border-bord bg-nuit px-3 py-2 text-sm text-creme placeholder:text-gris/60 focus:border-soupe focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setLignes(lignes.filter((l) => l.cle !== ligne.cle))}
              aria-label="Retirer cet avantage"
              className="shrink-0 rounded-lg border border-bord px-3 text-gris transition-colors hover:border-rouge hover:text-rouge"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {lignes.length < MAXIMUM && (
        <button
          type="button"
          onClick={ajouter}
          className="mt-2.5 rounded-lg border border-bord px-3.5 py-2 text-[13px] font-semibold text-gris transition-colors hover:border-soupe hover:text-soupe"
        >
          + Ajouter un avantage
        </button>
      )}

      {erreurs?.length ? (
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {erreurs.map((message) => (
            <li key={message} className="text-[13px] text-rouge">
              {message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
