import { LignesLore } from '@/components/ui/LignesLore'
import type { LigneClassement } from '@/lib/classement'
import { formaterCoins, formaterRatio } from '@/lib/format'

/**
 * Le podium : les trois premiers, au-dessus de la liste.
 *
 * Chaque marche porte son chiffre en très grand filigrane dans l'angle haut
 * droit, et le lot que la place rapporte en pied. Or, argent, bronze — la
 * première marche reçoit en plus un léger dégradé, c'est la seule différence
 * de traitement entre les trois.
 *
 * Composant serveur : il n'a aucun état.
 */
const MARCHES = [
  {
    bordure: 'border-or/50',
    fond: 'bg-linear-160 from-or/10 to-braise',
    chiffre: 'text-or/30',
    nom: 'text-or',
  },
  { bordure: 'border-argent/30', fond: 'bg-braise', chiffre: 'text-argent/20', nom: 'text-argent' },
  { bordure: 'border-bronze/30', fond: 'bg-braise', chiffre: 'text-bronze/20', nom: 'text-bronze' },
] as const

export function Podium({
  lignes,
  /** « points » ou « kills », affiché à côté de la valeur. */
  unite,
  /** Sur le classement à vie : morts, ratio K/D et record de série. */
  avecDetails,
  /** Le lot de chaque place, dans l'ordre. Vide sur le classement à vie. */
  lots,
}: {
  lignes: LigneClassement[]
  unite: string
  avecDetails: boolean
  lots: string[]
}) {
  return (
    <div className="grid gap-3.5 lg:grid-cols-3">
      {lignes.slice(0, 3).map((ligne, index) => {
        const marche = MARCHES[index]

        return (
          <article
            key={ligne.pseudo}
            className={`relative overflow-hidden rounded-carte border p-6.5 ${marche.bordure} ${marche.fond}`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-4 right-5 font-titre text-[44px] leading-none max-[860px]:text-[34px] ${marche.chiffre}`}
            >
              {index + 1}
            </span>

            <h3
              className={`truncate pr-14 font-titre text-[clamp(17px,2.2vw,23px)] tracking-[-.01em] ${marche.nom}`}
            >
              {ligne.pseudo}
            </h3>

            <p className="mt-2.5 font-mono text-base font-bold text-soupe">
              {formaterCoins(ligne.valeur)} {unite}
            </p>

            {/*
              Sur la semaine et le mois, la base ne donne que le total de
              points : pas de lignes de détail à afficher. LignesLore ne rend
              rien sur un tableau vide, la marche reste simplement plus courte.
            */}
            {avecDetails && (
              <LignesLore
                lignes={[
                  { libelle: 'Kills', valeur: formaterCoins(ligne.valeur) },
                  { libelle: 'Morts', valeur: formaterCoins(ligne.morts ?? 0) },
                  { libelle: 'K/D', valeur: formaterRatio(ligne.valeur, ligne.morts ?? 0) },
                  { libelle: 'Record de série', valeur: String(ligne.recordSerie ?? 0) },
                ]}
                taille="compacte"
              />
            )}

            {lots[index] && (
              <p className="mt-3.5 border-t border-bord pt-3 font-mono text-[11.5px] leading-relaxed text-vert">
                {lots[index]}
              </p>
            )}
          </article>
        )
      })}
    </div>
  )
}
