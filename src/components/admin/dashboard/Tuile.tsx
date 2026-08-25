import type { Evolution } from '@/lib/stats'

/**
 * Le badge d'évolution d'une tuile : « ▲ +12 % » en vert, « ▼ −8 % » en rouge.
 *
 * Quand la période précédente était à zéro, l'évolution est INDISPONIBLE et on
 * affiche « — » : une hausse « depuis rien » ne vaut pas +100 %, et surtout ne
 * doit pas se peindre en vert comme une vraie progression.
 */
function BadgeEvolution({ evolution }: { evolution: Evolution }) {
  if (evolution.sens === 'indisponible' || evolution.pourcentage === null) {
    return (
      <span
        className="font-mono text-[12px] text-gris"
        title="Pas de point de comparaison sur la période précédente"
      >
        —
      </span>
    )
  }

  const styles = {
    hausse: { couleur: 'text-vert', fleche: '▲', signe: '+' },
    baisse: { couleur: 'text-rouge', fleche: '▼', signe: '' },
    stable: { couleur: 'text-gris', fleche: '→', signe: '' },
  }[evolution.sens]

  return (
    <span
      className={`font-mono text-[12px] font-bold ${styles.couleur}`}
      title="Comparé aux 30 jours précédents"
    >
      {styles.fleche} {styles.signe}
      {evolution.pourcentage} %
    </span>
  )
}

/**
 * Un chiffre clé, en gros, avec un libellé, une précision et une éventuelle
 * évolution colorée. La brique de base du haut du tableau de bord.
 */
export function Tuile({
  libelle,
  valeur,
  precision,
  precisionAccent = false,
  evolution,
  accent = false,
}: {
  libelle: string
  valeur: string
  precision?: string
  /** Colore la précision en orange — pour « N en attente de livraison ». */
  precisionAccent?: boolean
  evolution?: Evolution
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-bord bg-charbon px-5 py-4">
      <p className="font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
        {libelle}
      </p>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <p className={`font-titre text-2xl ${accent ? 'text-or' : 'text-creme'}`}>{valeur}</p>
        {evolution && <BadgeEvolution evolution={evolution} />}
      </div>
      {precision && (
        <p className={`mt-0.5 text-[13px] ${precisionAccent ? 'text-soupe' : 'text-gris'}`}>
          {precision}
        </p>
      )}
    </div>
  )
}
