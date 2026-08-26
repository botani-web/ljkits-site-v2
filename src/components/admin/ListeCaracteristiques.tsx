'use client'

import { useState } from 'react'

/**
 * Les lignes de la fiche technique d'un kit (libellé / valeur).
 *
 * Chaque ligne produit deux champs de même nom — caracLibelle et caracValeur.
 * Côté serveur, formData.getAll() renvoie donc deux tableaux parallèles qu'on
 * réapparie par index (cf. lireFormulaireKit dans src/actions/kits.ts).
 */
type Ligne = { cle: number; libelle: string; valeur: string }

const MAXIMUM = 8

export function ListeCaracteristiques({
  valeurInitiale = [],
  erreurs,
}: {
  valeurInitiale?: { libelle: string; valeur: string }[]
  erreurs?: string[]
}) {
  // `cle` est un compteur interne, uniquement pour la prop key de React.
  const [lignes, setLignes] = useState<Ligne[]>(() =>
    valeurInitiale.length > 0
      ? valeurInitiale.map((ligne, index) => ({ cle: index, ...ligne }))
      : [{ cle: 0, libelle: '', valeur: '' }],
  )
  const [prochaineCle, setProchaineCle] = useState(valeurInitiale.length || 1)

  function ajouter() {
    if (lignes.length >= MAXIMUM) return
    setLignes([...lignes, { cle: prochaineCle, libelle: '', valeur: '' }])
    setProchaineCle(prochaineCle + 1)
  }

  function retirer(cle: number) {
    setLignes(lignes.filter((ligne) => ligne.cle !== cle))
  }

  function modifier(cle: number, champ: 'libelle' | 'valeur', valeur: string) {
    setLignes(lignes.map((l) => (l.cle === cle ? { ...l, [champ]: valeur } : l)))
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-creme">Fiche technique</span>
        <span className="font-mono text-xs text-gris">
          {lignes.length} / {MAXIMUM}
        </span>
      </div>
      <p className="mb-3 text-[13px] text-gris">
        Les lignes affichées sur la carte du kit, dans l’ordre. Exemple :
        « Cooldown » / « 3 s ».
      </p>

      <div className="flex flex-col gap-2">
        {lignes.map((ligne) => (
          <div key={ligne.cle} className="flex gap-2">
            <input
              name="caracLibelle"
              value={ligne.libelle}
              onChange={(e) => modifier(ligne.cle, 'libelle', e.target.value)}
              placeholder="Libellé"
              aria-label="Libellé de la caractéristique"
              className="w-2/5 min-w-0 rounded-controle border border-bord bg-nuit px-3 py-2 text-sm text-creme placeholder:text-gris/60 focus:border-soupe focus:outline-none"
            />
            <input
              name="caracValeur"
              value={ligne.valeur}
              onChange={(e) => modifier(ligne.cle, 'valeur', e.target.value)}
              placeholder="Valeur"
              aria-label="Valeur de la caractéristique"
              className="min-w-0 flex-1 rounded-controle border border-bord bg-nuit px-3 py-2 text-sm text-creme placeholder:text-gris/60 focus:border-soupe focus:outline-none"
            />
            <button
              type="button"
              onClick={() => retirer(ligne.cle)}
              aria-label="Retirer cette ligne"
              className="shrink-0 rounded-controle border border-bord px-3 text-gris transition-colors hover:border-rouge hover:text-rouge"
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
          className="mt-2.5 rounded-controle border border-bord px-3.5 py-2 text-[13px] font-semibold text-gris transition-colors hover:border-soupe hover:text-soupe"
        >
          + Ajouter une ligne
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
