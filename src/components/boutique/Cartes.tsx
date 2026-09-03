'use client'

import Link from 'next/link'

import { BoutonAjout } from '@/components/boutique/BoutonAjout'
import type { GradeBoutique, KitBoutique, PackBoutique } from '@/components/boutique/types'
import { Badge, Ruban } from '@/components/ui/Badge'
import { KanjiFiligrane } from '@/components/ui/Carte'
import { formaterCoins, formaterEuros } from '@/lib/format'

/**
 * Pourquoi un article peut ne pas être ajoutable, et ce qu'on écrit dessus.
 *
 * Trois cas bien distincts, et le joueur a droit à la vraie raison :
 *   - le kit est annoncé mais pas jouable        → « Bientôt disponible »
 *   - l'article a été retiré de la vente         → « Indisponible »
 *   - aucun package Tebex n'est encore relié     → « Bientôt en boutique »
 *
 * Le dernier cas est le plus important : sans lui, le joueur remplirait son
 * panier pour se faire refuser à la validation par creerCommande, qui exige un
 * tebexPackageId (cf. src/actions/commandes.ts).
 */
function etatDeVente({
  achetable,
  paiementPret,
  bientot = false,
}: {
  achetable: boolean
  paiementPret: boolean
  bientot?: boolean
}) {
  if (bientot) return { indisponible: true, libelle: 'Bientôt disponible' }
  if (!achetable) return { indisponible: true, libelle: 'Indisponible' }
  if (!paiementPret) return { indisponible: true, libelle: 'Bientôt en boutique' }
  return { indisponible: false, libelle: 'Ajouter au panier' }
}

/* -------------------------------------------------------------------------- */
/* Grade                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Une carte de grade : tête cloisonnée (symbole, nom, argument, prix), corps
 * (héritage + avantages), pied (bouton).
 *
 * Le grade porteur d'une étiquette en base est mis en avant : bordure or,
 * ombre portée, dégradé dans la tête, et son bouton passe en or. C'est le
 * seul écart de traitement entre les trois cartes.
 */
export function CarteGrade({
  grade,
  dansLePanier,
  onBasculer,
}: {
  grade: GradeBoutique
  dansLePanier: boolean
  onBasculer: () => void
}) {
  const misEnAvant = grade.etiquette !== null
  const vente = etatDeVente(grade)

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-bloc border bg-braise transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[3px] ${
        misEnAvant
          ? 'border-or/50 shadow-[0_26px_60px_-34px_rgba(253,192,3,.5)] hover:border-or'
          : 'border-bord hover:border-creme'
      }`}
    >
      {grade.etiquette && <Ruban>{grade.etiquette}</Ruban>}

      <div
        className={`border-b border-bord px-6.5 pt-7 pb-6 ${
          misEnAvant ? 'bg-linear-165 from-or/11 to-transparent' : ''
        }`}
      >
        {grade.kanji && (
          <p
            className={`font-mono text-[19px] tracking-[.12em] ${
              misEnAvant ? 'text-or' : 'text-creme'
            }`}
          >
            {grade.kanji}
          </p>
        )}

        <h3
          className={`mt-3 font-titre text-[23px] tracking-[-.01em] ${
            misEnAvant ? 'text-or' : ''
          }`}
        >
          {grade.nom}
        </h3>

        {grade.sousTitre && (
          <p className="mt-2 min-h-[42px] text-sm text-gris">{grade.sousTitre}</p>
        )}

        <p
          className={`mt-4 font-mono text-4xl leading-none font-bold ${
            misEnAvant ? 'text-or' : 'text-creme'
          }`}
        >
          {formaterEuros(grade.prixEurosCentimes)}
        </p>

        <p className="mt-2.5 font-mono text-[10.5px] tracking-[.06em] text-vert">
          Permanent · livré en 90 s
        </p>
      </div>

      <div className="flex-1 px-6.5 py-5.5">
        {grade.heriteDe && (
          <p className="mb-4 rounded-controle border border-bord bg-nuit px-3.5 py-2.5 font-mono text-[10.5px] tracking-[.06em] text-gris">
            <b className="font-bold text-soupe">Tout le {grade.heriteDe}</b>, plus :
          </p>
        )}

        <ul>
          {grade.avantages.map((avantage) => (
            <li
              key={avantage}
              className="flex gap-2.75 border-t border-bord py-2.25 text-[14.5px] text-gris first:border-t-0 first:pt-0"
            >
              <span aria-hidden="true" className="shrink-0 font-mono font-bold text-vert">
                +
              </span>
              {avantage}
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6.5 pb-6.5">
        <BoutonAjout
          dansLePanier={dansLePanier}
          indisponible={vente.indisponible}
          libelleIndisponible={vente.libelle}
          libelle={`Prendre le ${grade.nom} — ${formaterEuros(grade.prixEurosCentimes)}`}
          variante={misEnAvant ? 'or' : 'plein'}
          onClick={onBasculer}
        />
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/* Kit                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Une carte de kit de la boutique.
 *
 * Compacte : elle doit tenir vingt-neuf fois dans une grille sans que la page
 * devienne un rouleau. D'où la description sur deux lignes maximum et la fiche
 * technique renvoyée à /kits/[slug].
 *
 * ⚠ La carte n'est PAS un <Link> englobant, contrairement à celle de /kits :
 * elle contient un bouton, et un <button> dans un <a> est du HTML invalide
 * (et injouable au clavier). Le lien porte donc sur le seul nom.
 */
export function CarteKitBoutique({
  kit,
  dansLePanier,
  onBasculer,
}: {
  kit: KitBoutique
  dansLePanier: boolean
  onBasculer: () => void
}) {
  const exclusif = kit.type === 'EXCLUSIF'
  const vente = etatDeVente(kit)

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-carte border bg-charbon p-4.5 transition-[border-color,transform,background] duration-[.18s] hover:-translate-y-0.5 hover:bg-braise ${
        exclusif ? 'border-oni/35 hover:border-oni' : 'border-bord hover:border-soupe'
      }`}
    >
      {exclusif && kit.kanji && <KanjiFiligrane taille={70}>{kit.kanji}</KanjiFiligrane>}

      <div className="relative flex flex-wrap items-baseline gap-2.25">
        <h3 className={`font-titre text-[16.5px] tracking-[-.01em] ${exclusif ? 'text-oni' : ''}`}>
          <Link
            href={`/kits/${kit.slug}`}
            className="transition-colors hover:text-or"
            aria-label={`Voir la fiche du kit ${kit.nom}`}
          >
            {kit.nom}
          </Link>
        </h3>
        <Badge className="text-[9px] tracking-[.16em]">{kit.role}</Badge>
      </div>

      {/* Deux lignes maximum : au-delà, les cartes de la grille se
          désalignent. La suite est sur la fiche. Masquée sous 560px, où la
          grille passe à deux colonnes très étroites. */}
      <p className="relative mt-2.5 line-clamp-2 flex-1 text-[13.5px] leading-[1.45] text-gris max-[560px]:hidden">
        {kit.descriptionCourte}
      </p>

      {/*
        Le prix en coins sous le prix en euros : c'est la preuve visible de la
        promesse « tout s'obtient aussi en jouant ». Il n'est donc ni plus
        petit ni plus pâle au point de disparaître.
      */}
      <div className="relative mt-3.5 border-t border-bord pt-3">
        <p className="font-mono text-xl leading-none font-bold text-or">
          {formaterEuros(kit.prixEurosCentimes)}
        </p>
        <p className="mt-1.5 font-mono text-[9.5px] tracking-[.06em] text-gris">
          {kit.prixCoins === 0 ? (
            <span className="text-vert">Gratuit en jeu</span>
          ) : (
            `ou ${formaterCoins(kit.prixCoins)} coins en jouant`
          )}
        </p>
      </div>

      <div className="relative mt-3.5">
        <BoutonAjout
          dansLePanier={dansLePanier}
          indisponible={vente.indisponible}
          libelleIndisponible={vente.libelle}
          onClick={onBasculer}
        />
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/* Pack                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Le pack, en bloc large hachuré de rouge : c'est l'offre groupée, elle ne
 * ressemble à aucune carte de la grille exprès.
 */
/**
 * Une carte de pack de coins.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  LE PRIX AUX 1 000 COINS EST AFFICHÉ, PAS SUGGÉRÉ
 * ═══════════════════════════════════════════════════════════════════════
 * « Plus tu en prends, moins c'est cher » ne veut rien dire tant que
 * l'acheteur doit sortir sa calculatrice. Chaque carte porte donc son
 * prix unitaire, et celles qui font mieux que le plus petit palier
 * affichent de combien.
 */
export function CartePackCoins({
  pack,
  parMilleReference,
  dansLePanier,
  onBasculer,
}: {
  pack: PackBoutique
  /** Prix aux 1 000 coins du plus petit palier, pour calculer l'écart. */
  parMilleReference: number
  dansLePanier: boolean
  onBasculer: () => void
}) {
  const vente = etatDeVente(pack)
  const coins = pack.coins ?? 0
  const parMille = coins > 0 ? pack.prixEurosCentimes / (coins / 1000) : 0
  const economie =
    parMilleReference > 0 && parMille > 0
      ? Math.round((1 - parMille / parMilleReference) * 100)
      : 0

  return (
    <article className="flex flex-col rounded-carte border border-bord bg-braise p-5.5 transition-colors hover:border-or/50">
      {economie > 0 ? (
        <p className="font-mono text-[10px] font-bold tracking-[.18em] text-vert uppercase">
          −{economie} % aux 1 000 coins
        </p>
      ) : (
        <p className="font-mono text-[10px] tracking-[.18em] text-gris uppercase">
          Le premier palier
        </p>
      )}

      <p className="mt-3 font-mono text-[clamp(26px,3.4vw,34px)] leading-none font-bold text-or">
        {coins.toLocaleString('fr-FR')}
      </p>
      <p className="mt-1 font-mono text-[11px] tracking-[.16em] text-gris uppercase">coins</p>

      <h3 className="mt-4 font-titre text-[15px]">{pack.nom}</h3>
      <p className="mt-2 grow text-sm text-gris">{pack.description}</p>

      <p className="mt-4 font-mono text-[13px] text-creme">
        {(pack.prixEurosCentimes / 100).toFixed(2).replace('.', ',')} €
        <span className="ml-2 text-[11px] text-gris">
          soit {(parMille / 100).toFixed(2).replace('.', ',')} € / 1 000
        </span>
      </p>

      <div className="mt-4">
        <BoutonAjout
          dansLePanier={dansLePanier}
          indisponible={vente.indisponible}
          libelleIndisponible={vente.libelle}
          libelle={`Prendre — ${(pack.prixEurosCentimes / 100).toFixed(2).replace('.', ',')} €`}
          onClick={onBasculer}
        />
      </div>
    </article>
  )
}

export function CartePack({
  pack,
  kitsInclus,
  dansLePanier,
  onBasculer,
}: {
  pack: PackBoutique
  /** Noms des kits du pack, affichés en pied de description. */
  kitsInclus: string[]
  dansLePanier: boolean
  onBasculer: () => void
}) {
  const vente = etatDeVente(pack)

  const economie =
    pack.prixBarreCentimes !== null && pack.prixBarreCentimes > pack.prixEurosCentimes
      ? pack.prixBarreCentimes - pack.prixEurosCentimes
      : null

  return (
    <article
      className="hachures grid items-center gap-7 rounded-bloc border border-oni/45 p-7 shadow-[0_26px_60px_-38px_rgba(233,40,19,.6)] lg:grid-cols-[minmax(0,1fr)_auto]"
      style={{ ['--teinte-hachures' as string]: 'rgb(233 40 19 / .06)' }}
    >
      <div>
        <p className="font-mono text-[10px] tracking-[.18em] text-oni uppercase">
          La meilleure affaire du serveur
        </p>
        <h3 className="mt-2.5 font-titre text-[clamp(19px,2.6vw,25px)] tracking-[-.01em]">
          {pack.nom}
        </h3>
        <p className="mt-2.5 max-w-[56ch] text-[14.5px] text-gris">{pack.description}</p>

        {kitsInclus.length > 0 && (
          <p className="mt-3 font-mono text-[11px] tracking-[.04em] text-gris">
            {kitsInclus.join(' · ')}
          </p>
        )}
      </div>

      <div className="lg:text-right">
        {economie !== null && (
          <span className="inline-block rounded-micro bg-vert px-2.5 py-1 font-mono text-[10px] font-bold tracking-[.12em] text-encre-verte uppercase">
            Économise {formaterEuros(economie)}
          </span>
        )}

        <p className="mt-2.5 font-mono text-[40px] leading-none font-bold text-or">
          {formaterEuros(pack.prixEurosCentimes)}
        </p>

        {pack.prixBarreCentimes !== null && (
          <p className="mt-1.5 font-mono text-[13px] text-gris line-through">
            {formaterEuros(pack.prixBarreCentimes)} à l’unité
          </p>
        )}

        <div className="mt-4">
          <BoutonAjout
            dansLePanier={dansLePanier}
            indisponible={vente.indisponible}
            libelleIndisponible={vente.libelle}
            libelle="Prendre le pack"
            variante="or"
            onClick={onBasculer}
          />
        </div>
      </div>
    </article>
  )
}
