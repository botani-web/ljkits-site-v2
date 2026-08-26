/**
 * Les lignes clé/valeur en monospace — le motif le plus réutilisé du système.
 *
 * On les retrouve sur les cartes de kit, dans le panneau latéral de la fiche
 * kit, sur les marches du podium, dans les mini-fiches de la boutique. Toutes
 * suivent la même règle : libellé gris à gauche, valeur crème en gras poussée
 * à droite, séparées par un filet en haut du bloc.
 *
 * C'est une reprise directe des tooltips d'item de Minecraft. D'où le nom.
 */
export type LigneLore = { libelle: string; valeur: string }

export function LignesLore({
  lignes,
  /** Filet et marge au-dessus du bloc. À couper dans un panneau déjà cloisonné. */
  separateur = true,
  /** Aligne la valeur à droite. Faux pour les listes très courtes. */
  taille = 'normale',
  className = '',
}: {
  lignes: LigneLore[]
  separateur?: boolean
  taille?: 'normale' | 'compacte'
  className?: string
}) {
  if (lignes.length === 0) return null

  return (
    <dl
      className={`${separateur ? 'mt-4 border-t border-bord pt-3' : ''} ${className}`}
    >
      {lignes.map((ligne) => (
        <div
          key={ligne.libelle}
          className={`flex gap-3.5 font-mono ${
            taille === 'compacte' ? 'py-0.5 text-[11.5px]' : 'py-1 text-xs'
          }`}
        >
          <dt className="text-gris">{ligne.libelle}</dt>
          <dd className="ml-auto text-right font-bold text-creme">{ligne.valeur}</dd>
        </div>
      ))}
    </dl>
  )
}
