import type { StatutCommande } from '@prisma/client'

/** Libellé et couleur de chaque statut, au même endroit pour tout le site. */
export const STATUTS: Record<StatutCommande, { label: string; classes: string }> = {
  EN_ATTENTE: { label: 'En attente', classes: 'border-soupe/50 bg-soupe/12 text-soupe' },
  PAYEE: { label: 'Payée', classes: 'border-or/50 bg-or/12 text-or' },
  LIVREE: { label: 'Livrée', classes: 'border-vert/50 bg-vert/12 text-vert' },
  ECHOUEE: { label: 'Échouée', classes: 'border-rouge/50 bg-rouge/12 text-rouge' },
  REMBOURSEE: { label: 'Remboursée', classes: 'border-bord bg-braise text-gris' },
  LITIGE: { label: 'Litige', classes: 'border-oni bg-oni/15 text-oni' },
}

export function EtiquetteStatut({ statut }: { statut: StatutCommande }) {
  const { label, classes } = STATUTS[statut]

  return (
    <span
      className={`rounded border px-2.5 py-1 font-mono text-[10.5px] font-bold tracking-[1.2px] uppercase ${classes}`}
    >
      {label}
    </span>
  )
}
