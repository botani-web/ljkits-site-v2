'use client'

import Image from 'next/image'

import { BoutonAjout } from '@/components/boutique/BoutonAjout'
import type { PackBoutique } from '@/components/boutique/types'
import { Ruban } from '@/components/ui/Badge'
import { formaterCoins, formaterEuros } from '@/lib/format'
import { useLocale } from '@/hooks/useLocale'
import { t } from '@/lib/i18n'

/**
 * Les cartes PRODUIT de la boutique — refonte du 03/09/2026.
 *
 * Depuis le 26/09/2026 il n'en reste qu'une : le pack de coins. Les cartes
 * de grade et leur tableau comparatif sont partis avec la mise en vente des
 * grades EN JEU — elles sont dans l'historique git si le sujet revient.
 *
 * La page d'avant expliquait beaucoup et montrait peu : le prix arrivait au
 * quatrième écran, derrière un onglet. Une boutique se lit en une seconde :
 * l'article, son prix, ce qu'il donne, un bouton. Tout le reste est du texte
 * qu'on lit après avoir décidé.
 *
 * Trois règles tiennent ces cartes :
 *   - le PRIX est le plus gros texte de la carte, toujours au même endroit ;
 *   - un seul argument fort par carte, en chiffre (le bonus, les coins) ;
 *   - le bouton dit la vérité : « Bientôt en boutique » tant qu'aucun package
 *     Tebex n'est relié (creerCommande refuserait de toute façon).
 */

/** Pourquoi un article peut ne pas être ajoutable, et ce qu'on écrit dessus. */
function etatDeVente({ achetable, paiementPret }: { achetable: boolean; paiementPret: boolean }) {
  const locale = useLocale()
  if (!achetable) return { indisponible: true, libelle: 'Indisponible' }
  if (!paiementPret) return { indisponible: true, libelle: t(locale, 'boutique.bientot-en-boutique') }
  return { indisponible: false, libelle: 'Ajouter au panier' }
}

/* -------------------------------------------------------------------------- */
/* Grade                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Une carte de pack de coins : l'image du palier, la quantité en gros, le
 * prix, et le prix aux 1 000 coins qui rend le dégressif lisible.
 *
 * `parMilleReference` est le prix aux 1 000 coins du plus petit pack : chaque
 * carte affiche l'économie par rapport à lui. Le plus gros porte le ruban
 * « Meilleure valeur » — c'est mathématiquement vrai, pas un argument.
 */
export function CartePackCoinsProduit({
  pack,
  parMilleReference,
  meilleureValeur,
  dansLePanier,
  onBasculer,
}: {
  pack: PackBoutique
  parMilleReference: number
  meilleureValeur: boolean
  dansLePanier: boolean
  onBasculer: () => void
}) {
  const locale = useLocale()
  const vente = etatDeVente(pack)
  const coins = pack.coins ?? 0
  const image = pack.slug.startsWith('coins-') ? `/coins/${pack.slug.slice(6)}.webp` : null
  const parMille = coins > 0 ? pack.prixEurosCentimes / (coins / 1000) : 0
  const economie =
    parMilleReference > 0 && parMille > 0 ? Math.round((1 - parMille / parMilleReference) * 100) : 0

  return (
    <article
      className={[
        'relative flex flex-col overflow-hidden rounded-bloc border bg-charbon transition-colors',
        meilleureValeur ? 'border-or' : 'border-bord hover:border-soupe/60',
      ].join(' ')}
    >
      {meilleureValeur && <Ruban>{t(locale, 'boutique.meilleure-valeur')}</Ruban>}

      {/* ---------------------------- image ---------------------------- */}
      <div className="flex items-center justify-center border-b border-bord bg-[radial-gradient(ellipse_at_center,rgba(253,192,3,.10),transparent_70%)] px-4 pt-6 pb-4">
        {image ? (
          <Image
            src={image}
            alt=""
            width={112}
            height={112}
            className="h-[96px] w-[96px] object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,.5)]"
          />
        ) : (
          <span aria-hidden="true" className="font-titre text-4xl text-or">
            ¤
          </span>
        )}
      </div>

      {/* --------------------------- quantité --------------------------- */}
      <div className="px-4.5 pt-4.5">
        <p className="font-mono text-[10.5px] tracking-[.16em] text-gris uppercase">{pack.nom}</p>
        <p className="mt-1.5 font-titre text-[clamp(24px,2.4vw,28px)] leading-none text-or">
          {formaterCoins(coins)}
          <span className="ml-1.5 font-mono text-[11px] tracking-[.1em] text-gris uppercase">
            coins
          </span>
        </p>
        <p className="mt-2.5 min-h-[40px] text-[13px] leading-snug text-gris">{pack.description}</p>
      </div>

      {/* ----------------------------- prix ----------------------------- */}
      <div className="mt-auto px-4.5 pt-4">
        <div className="flex items-end gap-2">
          <p className="font-titre text-[30px] leading-none text-creme">
            {formaterEuros(pack.prixEurosCentimes)}
          </p>
          {pack.prixBarreCentimes !== null && pack.prixBarreCentimes > pack.prixEurosCentimes && (
            <p className="pb-0.5 font-mono text-[12px] text-gris line-through">
              {formaterEuros(pack.prixBarreCentimes)}
            </p>
          )}
        </div>
        <p className="mt-1.5 flex items-center gap-2 font-mono text-[10.5px] tracking-[.06em] text-gris">
          {(parMille / 100).toFixed(2).replace('.', ',')} € / 1 000
          {economie > 0 && (
            <span className="rounded-micro border border-vert/40 px-1.5 py-[2px] text-[9.5px] font-bold text-vert">
              −{economie} %
            </span>
          )}
        </p>
      </div>

      <div className="p-4.5">
        <BoutonAjout
          dansLePanier={dansLePanier}
          indisponible={vente.indisponible}
          libelleIndisponible={vente.libelle}
          variante={meilleureValeur ? 'or' : 'plein'}
          onClick={onBasculer}
        />
      </div>
    </article>
  )
}
