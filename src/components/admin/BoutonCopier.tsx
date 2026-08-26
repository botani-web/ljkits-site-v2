'use client'

import { useState } from 'react'

/** Copie un texte dans le presse-papier et le confirme deux secondes. */
export function BoutonCopier({ texte, libelle }: { texte: string; libelle: string }) {
  const [copie, setCopie] = useState(false)

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      // Presse-papier refusé : le texte reste sélectionnable à la main.
    }
  }

  return (
    <button
      type="button"
      onClick={copier}
      className="inline-flex min-h-11 items-center rounded-controle border border-bord px-3 text-[13px] font-semibold text-gris transition-colors hover:border-soupe hover:text-soupe sm:min-h-0 sm:py-1.5"
    >
      {copie ? '✓ Copié' : libelle}
    </button>
  )
}
