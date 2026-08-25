import type { EtatBudget } from '@/lib/discord'

/**
 * Les deux repères du budget de l'embed Discord.
 *
 * LA DISTINCTION EST LE CŒUR DE CE COMPOSANT.
 *
 * Le PLANCHER (somme des minimums configurés) est le plus petit envoi qu'un
 * candidat puisse matériellement produire. S'il déborde, la faute est dans la
 * configuration : rouge, et il faut agir.
 *
 * Le PLAFOND (somme des maximums) déborde dès qu'on a quelques textes longs —
 * c'est arithmétique, pas une erreur. Il s'affiche donc en gris, comme un
 * CONSTAT : les réponses les plus longues seront tronquées dans Discord, la
 * fiche admin reste complète. Une alerte qui serait rouge en permanence ne
 * voudrait plus rien dire.
 */
export function AlerteBudget({ budget }: { budget: EtatBudget }) {
  const { plancher, plafond } = budget
  const troppeu = budget.questions > budget.emplacements

  return (
    <section className="rounded-xl border border-bord bg-charbon p-5">
      <h2 className="font-mono text-[10.5px] tracking-[1.4px] text-gris uppercase">
        Message Discord
      </h2>

      {/* --- le repère qui compte : le plancher --------------------------- */}
      {plancher.deborde || troppeu ? (
        <div className="mt-3 rounded-lg border border-rouge/50 bg-rouge/10 p-4">
          <p className="text-[14px] font-bold text-rouge">
            Ta configuration dépasse ce que Discord accepte.
          </p>
          <p className="mt-2 text-[13px] text-creme">
            Même une candidature remplie au strict minimum ne tiendrait pas dans le
            message : {plancher.caracteres} caractères pour un budget de {budget.budget},
            et {budget.questions} questions pour {budget.emplacements} emplacements.
          </p>
          {plancher.omises.length > 0 && (
            <p className="mt-2 text-[13px] text-gris">
              Ne partiraient pas du tout : {plancher.omises.join(', ')}.
            </p>
          )}
          <p className="mt-2 text-[13px] text-gris">
            Baisse les minimums, raccourcis les libellés, ou désactive des questions.
            Rien n’est perdu pour autant — la fiche admin reste toujours complète.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[14px] text-vert">
          ✔ Une candidature au minimum tient dans le message :{' '}
          <span className="font-mono">
            {plancher.caracteres} / {budget.budget}
          </span>{' '}
          caractères, {budget.questions} question{budget.questions > 1 ? 's' : ''} sur{' '}
          {budget.emplacements} emplacements.
        </p>
      )}

      {/* --- le constat, jamais rouge ------------------------------------- */}
      {plafond.deborde && (
        <p className="mt-3 border-t border-bord pt-3 text-[13px] text-gris">
          Les réponses les plus longues seront tronquées dans Discord, la fiche admin
          reste complète.
          {plafond.omises.length > 0 && (
            <>
              {' '}
              Au maximum de ce que tes questions autorisent, {plafond.omises.length}{' '}
              réponse{plafond.omises.length > 1 ? 's' : ''} ne tiendrai
              {plafond.omises.length > 1 ? 'ent' : 't'} pas dans le message et
              renverrai
              {plafond.omises.length > 1 ? 'ent' : 't'} vers la fiche.
            </>
          )}
        </p>
      )}
    </section>
  )
}
