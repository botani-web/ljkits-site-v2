import Image from 'next/image'

import type { LigneClassement } from '@/lib/classement'
import { urlAvatar } from '@/lib/avatar'
import { formaterCoins, formaterRatio } from '@/lib/format'

/**
 * Le podium : les trois premiers, mis en avant au-dessus de la liste.
 *
 * Affiché dans l'ordre 2 — 1 — 3, comme sur l'accueil : la première marche est
 * au centre et plus haute. Seuls la bordure, la pastille de rang et le cadre de
 * la tête prennent l'accent or / argent / bronze ; le reste de la carte suit la
 * palette habituelle (charbon sur bordure `bord`).
 */
const MARCHES = [
  {
    rang: 2,
    bordure: 'border-argent/45',
    pastille: 'bg-argent text-nuit',
    cadre: 'border-argent/60',
    valeur: 'text-argent',
  },
  {
    rang: 1,
    bordure: 'border-or/60',
    pastille: 'bg-linear-[135deg] from-soupe to-or text-nuit',
    cadre: 'border-or',
    valeur: 'text-or',
  },
  {
    rang: 3,
    bordure: 'border-bronze/50',
    pastille: 'bg-bronze text-nuit',
    cadre: 'border-bronze/60',
    valeur: 'text-bronze',
  },
] as const

export function Podium({
  lignes,
  unite,
  avecDetails,
}: {
  lignes: LigneClassement[]
  /** « points » ou « kills », affiché sous la valeur. */
  unite: string
  /** Sur le classement à vie : ratio K/D et record de série. */
  avecDetails: boolean
}) {
  return (
    <div className="mb-6 grid items-end gap-4 sm:grid-cols-3">
      {MARCHES.map((marche) => {
        const joueur = lignes.find((ligne) => ligne.rang === marche.rang)
        if (!joueur) return <span key={marche.rang} className="hidden sm:block" />

        const premier = marche.rang === 1

        return (
          <article
            key={marche.rang}
            className={`relative rounded-xl border bg-charbon px-5 text-center ${marche.bordure} ${
              premier ? 'pt-9 pb-7' : 'pt-7 pb-5'
            }`}
          >
            <div
              className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 font-titre text-[13px] ${marche.pastille}`}
            >
              {marche.rang}
            </div>

            <Image
              src={urlAvatar(joueur.pseudo, premier ? 160 : 128)}
              alt=""
              width={premier ? 80 : 64}
              height={premier ? 80 : 64}
              unoptimized
              className={`mx-auto mb-3 rounded-xl border-2 [image-rendering:pixelated] ${marche.cadre} ${
                premier ? 'size-20' : 'size-16'
              }`}
            />

            <div className={`truncate font-bold ${premier ? 'text-[18px]' : 'text-[16px]'}`}>
              {joueur.pseudo}
            </div>

            <div className={`mt-1.5 font-titre ${premier ? 'text-2xl' : 'text-xl'} ${marche.valeur}`}>
              {formaterCoins(joueur.valeur)}
            </div>
            <div className="font-mono text-[10.5px] tracking-[1.2px] text-gris uppercase">
              {unite}
            </div>

            {avecDetails && joueur.morts !== null && (
              <div className="mt-3 flex justify-center gap-4 border-t border-bord pt-3 font-mono text-[11px] text-gris">
                <span>
                  K/D <b className="font-bold text-creme">{formaterRatio(joueur.valeur, joueur.morts)}</b>
                </span>
                {joueur.recordSerie !== null && (
                  <span>
                    Série <b className="font-bold text-creme">{joueur.recordSerie}</b>
                  </span>
                )}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
