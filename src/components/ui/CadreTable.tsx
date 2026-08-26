/**
 * Le cadre des tables du site : le top 5 de l'accueil, le classement, le
 * palmarès des lots de la boutique.
 *
 * Volontairement réduit au cadre et à l'en-tête. Les lignes restent écrites
 * par chaque page : leurs colonnes n'ont rien en commun (5 colonnes au
 * classement, 3 à l'accueil, et elles se replient différemment). Une table
 * générique aurait exigé une configuration plus longue que le balisage
 * qu'elle remplace.
 *
 * Ce que le cadre garantit, lui, est commun : rayon, bordure, `overflow-hidden`
 * pour que la première et la dernière ligne épousent les angles, et un fond
 * qui ne dépend pas de la section qui l'accueille.
 */
export function CadreTable({
  /** `braise` quand la table est posée sur une section charbon. */
  fond = 'charbon',
  className = '',
  children,
}: {
  fond?: 'charbon' | 'braise'
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`overflow-hidden rounded-carte border border-bord ${
        fond === 'braise' ? 'bg-braise' : 'bg-charbon'
      } ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * La ligne d'en-tête : micro-libellés monospace sur fond braise.
 *
 * `colonnes` reçoit le `grid-template-columns` en dur (chaîne de style, pas
 * classe Tailwind) parce que les gabarits des maquettes sont trop
 * irréguliers pour l'échelle de Tailwind — `56px minmax(0,1fr) repeat(4,64px)
 * 92px 28px` n'a pas d'équivalent en classes.
 *
 * Les colonnes numériques s'alignent à droite ; `alignerADroite` reçoit les
 * index (base 0) concernés.
 */
export function EnteteTable({
  colonnes,
  libelles,
  alignerADroite = [],
  className = '',
}: {
  colonnes: string
  libelles: React.ReactNode[]
  alignerADroite?: number[]
  className?: string
}) {
  return (
    <div
      role="row"
      style={{ gridTemplateColumns: colonnes }}
      className={`grid gap-3 border-b border-bord bg-braise px-4.5 py-3 font-mono text-[9.5px] tracking-[.16em] text-gris uppercase ${className}`}
    >
      {libelles.map((libelle, index) => (
        <span
          key={index}
          role="columnheader"
          className={alignerADroite.includes(index) ? 'text-right' : ''}
        >
          {libelle}
        </span>
      ))}
    </div>
  )
}

/**
 * La jauge de proportion peinte en fond de ligne : un aplat orange très pâle
 * dont la largeur dit la valeur relative de la ligne.
 *
 * Décorative, donc `aria-hidden` : la valeur chiffrée est déjà dans la ligne.
 * `pointer-events-none` pour ne pas voler le clic à la ligne qu'elle habille.
 */
export function JaugeDeFond({ pourcentage }: { pourcentage: number }) {
  return (
    <span
      aria-hidden="true"
      // Bornée : une valeur hors bornes déborderait de la ligne côté droit.
      style={{ width: `${Math.max(0, Math.min(100, pourcentage))}%` }}
      className="pointer-events-none absolute inset-y-0 left-0 bg-soupe/6"
    />
  )
}
