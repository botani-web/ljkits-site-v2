/**
 * Le bandeau de positionnement, en tête de la boutique.
 *
 * C'est l'argument central du serveur, pas une mention légale : il est donc
 * placé AVANT le titre de la page, et pas relégué au pied de page.
 *
 * « Visible mais pas criard » : le vert de la palette et une bordure suffisent
 * à le détacher du fond nuit. Pas de fond plein, pas de majuscules, pas
 * d'animation — un bandeau qui crie se lit comme une publicité, donc ne se lit
 * pas. Il n'est pas non plus refermable : rien à masquer.
 */
export function BandeauPositionnement() {
  return (
    <aside
      aria-label="Engagement zéro pay-to-win"
      className="mx-auto flex max-w-contenu items-start gap-3.5 rounded-xl border border-vert/30 border-l-[3px] border-l-vert bg-linear-[100deg] from-vert/8 to-transparent px-4 py-3.5 sm:gap-4 sm:px-6 sm:py-4"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 shrink-0 font-titre text-[15px] leading-none text-vert sm:text-[17px]"
      >
        ✓
      </span>
      <p className="text-[14px] leading-[1.5] text-creme sm:text-[15px]">
        <strong className="font-semibold">
          Tout ce qui est vendu ici s’obtient aussi en jouant.
        </strong>{' '}
        Aucun avantage en combat, aucun bonus de dégâts.{' '}
        <span className="text-gris">
          Le prix en coins est affiché sur chaque carte : c’est vérifiable.
        </span>
      </p>
    </aside>
  )
}
