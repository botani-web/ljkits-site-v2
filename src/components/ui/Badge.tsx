import Link from 'next/link'

/**
 * Le micro-badge encadré : le rôle d'un kit (« Mobilité », « Tromperie »),
 * le mot « Admin » de l'en-tête d'administration, un état de commande.
 *
 * Trois tailles de police tournaient dans les maquettes selon la carte
 * (9px, 9.5px, 10px, 10.5px). Une seule ici : à cette échelle, l'écart n'est
 * pas perceptible, et le badge doit rester lisible partout.
 */
type TonBadge = 'neutre' | 'oni' | 'soupe' | 'or' | 'vert'

const TONS: Record<TonBadge, string> = {
  neutre: 'border-bord text-gris',
  oni: 'border-oni/40 text-oni',
  soupe: 'border-soupe/40 text-soupe',
  or: 'border-or/50 text-or',
  vert: 'border-vert/40 text-vert',
}

export function Badge({
  ton = 'neutre',
  className = '',
  children,
}: {
  ton?: TonBadge
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={`inline-block rounded-micro border px-2 py-[3px] font-mono text-[10px] tracking-[.18em] uppercase ${TONS[ton]} ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * Le ruban d'angle des cartes de grade — « Le plus pris ».
 * Il déborde du bord droit de la carte, d'où le `-mr` et le rayon asymétrique.
 * La carte qui le porte doit être en `relative overflow-hidden`.
 */
export function Ruban({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute top-4 right-0 rounded-l-micro bg-or px-3.5 py-[5px] font-mono text-[9.5px] font-bold tracking-[.16em] text-encre uppercase">
      {children}
    </span>
  )
}

/**
 * Le lien souligné à flèche des maquettes : « Classement complet → ».
 *
 * La flèche est un caractère et non une icône SVG, comme dans les maquettes.
 * Elle est `aria-hidden` : un lecteur d'écran annoncerait « flèche vers la
 * droite » après chaque libellé, ce qui n'apprend rien.
 */
export function LienFleche({
  href,
  className = '',
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center gap-2.5 border-b border-soupe/40 font-mono text-xs font-bold tracking-[.1em] text-soupe uppercase transition-colors hover:border-soupe hover:text-or ${className}`}
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  )
}
