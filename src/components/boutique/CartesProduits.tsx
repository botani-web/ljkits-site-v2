'use client'

import Image from 'next/image'

import { BoutonAjout } from '@/components/boutique/BoutonAjout'
import type { GradeBoutique, PackBoutique } from '@/components/boutique/types'
import { Ruban } from '@/components/ui/Badge'
import { formaterCoins, formaterEuros } from '@/lib/format'

/**
 * Les cartes PRODUIT de la boutique — refonte du 03/09/2026.
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
  if (!achetable) return { indisponible: true, libelle: 'Indisponible' }
  if (!paiementPret) return { indisponible: true, libelle: 'Bientôt en boutique' }
  return { indisponible: false, libelle: 'Ajouter au panier' }
}

/* -------------------------------------------------------------------------- */
/* Grade                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Une carte de grade. Le kanji n'est plus un filigrane discret mais l'image du
 * produit : un grade n'a pas d'objet à montrer, c'est son idéogramme qui le
 * représente, comme sur les affiches Discord.
 */
export function CarteGradeProduit({
  grade,
  recommande,
  dansLePanier,
  onBasculer,
}: {
  grade: GradeBoutique
  recommande: boolean
  dansLePanier: boolean
  onBasculer: () => void
}) {
  const vente = etatDeVente(grade)
  // L'argument fort : « +30 % de coins » vient de l'étiquette en base.
  const argument = grade.etiquette
  // Les avantages, sans la ligne d'argument qu'on affiche déjà en gros.
  const avantages = grade.avantages.filter(
    (a) => !(argument && a.toLowerCase().startsWith(argument.toLowerCase().slice(0, 5))),
  )

  return (
    <article
      className={[
        'relative flex flex-col overflow-hidden rounded-bloc border bg-charbon transition-[transform,box-shadow] duration-200',
        recommande
          ? 'border-or shadow-[0_24px_60px_-30px_rgba(253,192,3,.55)] lg:-translate-y-2'
          : 'border-bord hover:border-soupe/60',
      ].join(' ')}
    >
      {recommande && <Ruban>Le plus choisi</Ruban>}

      {/* ------------------------------ tête ------------------------------ */}
      <div
        className={[
          'flex items-center gap-4 border-b border-bord p-5.5',
          recommande ? 'bg-[linear-gradient(135deg,rgba(253,192,3,.12),transparent_60%)]' : '',
        ].join(' ')}
      >
        <div
          aria-hidden="true"
          className={[
            'flex size-16 shrink-0 items-center justify-center rounded-carte border font-bold leading-none',
            recommande ? 'border-or/60 bg-nuit text-or' : 'border-bord bg-nuit text-creme',
          ].join(' ')}
          style={{ fontSize: grade.kanji && grade.kanji.length > 1 ? 24 : 34 }}
        >
          {grade.kanji ?? '❀'}
        </div>
        <div className="min-w-0">
          <h3 className="font-titre text-[21px] leading-none tracking-[-.01em]">{grade.nom}</h3>
          {grade.sousTitre && (
            <p className="mt-1.5 font-mono text-[10.5px] tracking-[.16em] text-gris uppercase">
              {grade.sousTitre}
            </p>
          )}
        </div>
      </div>

      {/* ------------------------------ prix ------------------------------ */}
      <div className="flex items-end justify-between gap-3 px-5.5 pt-5">
        <p className="font-titre text-[clamp(34px,4vw,42px)] leading-none text-creme">
          {formaterEuros(grade.prixEurosCentimes)}
        </p>
        <p className="pb-1 text-right font-mono text-[10.5px] leading-tight tracking-[.12em] text-gris uppercase">
          Un achat
          <br />
          <span className="text-vert">à vie</span>
        </p>
      </div>

      {/* --------------------------- l'argument --------------------------- */}
      {argument && (
        <p className="mx-5.5 mt-4 rounded-controle border border-or/30 bg-nuit px-4 py-3 text-center font-mono text-[13px] font-bold tracking-[.04em] text-or">
          {argument} <span className="font-normal text-gris">sur chaque kill</span>
        </p>
      )}

      {/* --------------------------- avantages --------------------------- */}
      <ul className="flex-1 space-y-2.5 px-5.5 pt-4.5 pb-5 text-[14px]">
        {grade.heriteDe && (
          <li className="flex gap-2.5 text-creme">
            <span aria-hidden="true" className="shrink-0 font-mono font-bold text-or">
              ↳
            </span>
            <span>
              Tout ce que donne le <b className="font-semibold">{grade.heriteDe}</b>
            </span>
          </li>
        )}
        {avantages.map((avantage) => (
          <li key={avantage} className="flex gap-2.5 text-gris">
            <span aria-hidden="true" className="shrink-0 font-mono font-bold text-vert">
              ✓
            </span>
            <span>{avantage}</span>
          </li>
        ))}
      </ul>

      {/* ------------------------------ pied ------------------------------ */}
      <div className="border-t border-bord p-4.5">
        <BoutonAjout
          dansLePanier={dansLePanier}
          indisponible={vente.indisponible}
          libelleIndisponible={vente.libelle}
          libelle={`Prendre le ${grade.nom}`}
          variante={recommande ? 'or' : 'plein'}
          onClick={onBasculer}
        />
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/* Tableau comparatif des grades                                              */
/* -------------------------------------------------------------------------- */

/**
 * Le tableau qui répond à « lequel je prends ? » sans relire trois cartes.
 *
 * Les lignes reprennent les avantages tels qu'ils sont en base ; le prix et
 * le bonus sont lus dans les données. Les trois autres lignes sont des faits
 * du serveur (couleur du pseudo, Discord, hologramme) qu'on écrit ici parce
 * qu'un tableau se lit en cases et non en phrases. Si les avantages changent
 * en base, cette grille est à relire.
 *
 * Masqué sous 1024px : les cartes portent déjà tout.
 */
export function TableauComparatif({ grades }: { grades: GradeBoutique[] }) {
  if (grades.length !== 3) return null
  const [ronin, samourai, shogun] = grades
  const oui = (
    <span aria-label="oui" className="font-mono font-bold text-vert">
      ✓
    </span>
  )
  const non = (
    <span aria-label="non" className="font-mono text-gris/60">
      —
    </span>
  )
  const lignes: { libelle: string; valeurs: React.ReactNode[] }[] = [
    {
      libelle: 'Prix, une fois',
      valeurs: [ronin, samourai, shogun].map((g) => (
        <b key={g.slug} className="font-mono text-creme">
          {formaterEuros(g.prixEurosCentimes)}
        </b>
      )),
    },
    {
      libelle: 'Bonus de coins sur chaque kill',
      valeurs: [ronin, samourai, shogun].map((g) => (
        <b key={g.slug} className="font-mono text-or">
          {g.etiquette ?? '—'}
        </b>
      )),
    },
    {
      libelle: 'Couleur du pseudo',
      valeurs: [
        <span key="r" className="text-creme">Blanc</span>,
        <span key="s" className="text-or">Or</span>,
        <span key="sh" className="text-violet">Violet</span>,
      ],
    },
    { libelle: 'Symbole ❀ dans le chat et le tab', valeurs: [oui, oui, oui] },
    { libelle: 'Rôle et salon réservés sur le Discord', valeurs: [oui, oui, oui] },
    { libelle: 'Nom sur l’hologramme des soutiens', valeurs: [oui, oui, oui] },
    { libelle: 'Le multiplicateur le plus élevé du serveur', valeurs: [non, non, oui] },
  ]

  return (
    <div className="mt-7 hidden overflow-hidden rounded-bloc border border-bord bg-nuit lg:block">
      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-bord bg-charbon">
            <th className="px-5 py-3.5 text-left font-mono text-[10.5px] font-bold tracking-[.18em] text-gris uppercase">
              Ce que tu obtiens
            </th>
            {[ronin, samourai, shogun].map((g, i) => (
              <th
                key={g.slug}
                className={`px-5 py-3.5 text-center font-titre text-[15px] ${i === 1 ? 'text-or' : 'text-creme'}`}
              >
                {g.kanji && <span className="mr-2 text-gris/70">{g.kanji}</span>}
                {g.nom}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => (
            <tr key={ligne.libelle} className="border-b border-bord last:border-b-0">
              <td className="px-5 py-3 text-gris">{ligne.libelle}</td>
              {ligne.valeurs.map((v, i) => (
                <td key={i} className={`px-5 py-3 text-center ${i === 1 ? 'bg-or/[.04]' : ''}`}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Pack de coins                                                              */
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
      {meilleureValeur && <Ruban>Meilleure valeur</Ruban>}

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
