/**
 * La FAQ de la boutique : une liste de questions dépliables.
 *
 * Bâtie sur `<details>` natif, comme le bloc d'audience de l'admin. Pas de
 * JavaScript, pas d'état React, et le contenu replié reste dans le DOM — donc
 * trouvable par la recherche du navigateur (Ctrl+F) et indexable.
 *
 * Le marqueur natif est masqué et remplacé par un + / – en pseudo-élément,
 * comme dans la maquette. `list-none` couvre Firefox, la règle
 * `::-webkit-details-marker` couvre Safari.
 */
export function Accordeon({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={`mx-auto max-w-lecture ${className}`}>{children}</div>
}

export function Question({
  question,
  children,
}: {
  question: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <details className="group border-b border-bord">
      <summary className="relative flex min-h-11 cursor-pointer list-none items-center py-4 pr-10 text-[16.5px] font-semibold transition-colors hover:text-or [&::-webkit-details-marker]:hidden">
        {question}

        {/*
          Le +/– est un vrai élément et non un ::after : un pseudo-élément
          n'aurait pas pu être masqué aux lecteurs d'écran, qui annoncent déjà
          l'état déplié du <details>. Ils entendraient « plus » à chaque
          question.
        */}
        <span
          aria-hidden="true"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 font-mono text-xl leading-none text-soupe"
        >
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">–</span>
        </span>
      </summary>

      <div className="pr-10 pb-5 text-[15px] text-gris [&>*+*]:mt-2.5">{children}</div>
    </details>
  )
}
