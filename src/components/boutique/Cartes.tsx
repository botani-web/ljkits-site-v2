'use client'

import Link from 'next/link'

import { BoutonAjout } from '@/components/boutique/BoutonAjout'
import type { GradeBoutique, KitBoutique, PackBoutique } from '@/components/boutique/types'
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

export function CarteGrade({
  grade,
  dansLePanier,
  onBasculer,
}: {
  grade: GradeBoutique
  dansLePanier: boolean
  onBasculer: () => void
}) {
  // L'étiquette (« Le plus pris ») met aussi la carte en avant : bordure
  // orange et fond dégradé, comme .grade--phare dans la maquette.
  const misEnAvant = grade.etiquette !== null
  const vente = etatDeVente(grade)

  return (
    <article
      className={`relative flex flex-col rounded-xl border px-5.5 pt-6 pb-5.5 transition-all hover:-translate-y-[3px] hover:border-[#3d2f5c] ${
        misEnAvant
          ? 'border-soupe bg-linear-[165deg] from-[#2a1330] to-charbon'
          : 'border-bord bg-charbon'
      }`}
    >
      {grade.etiquette && (
        <span className="absolute -top-2.5 left-5.5 rounded bg-soupe px-2.5 py-1 font-mono text-[10.5px] font-bold tracking-[1.5px] text-[#1a0f00] uppercase">
          {grade.etiquette}
        </span>
      )}

      <h3 className="font-titre text-[21px] text-or uppercase">{grade.nom}</h3>

      {(grade.kanji || grade.sousTitre) && (
        <div className="mt-0.5 font-mono text-[11.5px] tracking-[2px] text-gris">
          {[grade.kanji, grade.sousTitre].filter(Boolean).join(' · ')}
        </div>
      )}

      <div className="mt-4 font-titre text-[32px]">
        {formaterEuros(grade.prixEurosCentimes)}
        <span className="ml-1 font-corps text-[13.5px] font-normal text-gris"> / à vie</span>
      </div>

      <ul className="my-4 mb-5 flex flex-col gap-2">
        {grade.heriteDe && <AvantageHerite nom={grade.heriteDe} />}
        {grade.avantages.map((avantage) => (
          <Avantage key={avantage}>{avantage}</Avantage>
        ))}
      </ul>

      <BoutonAjout
        dansLePanier={dansLePanier}
        indisponible={vente.indisponible}
        libelleIndisponible={vente.libelle}
        onClick={onBasculer}
      />
    </article>
  )
}

function Avantage({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pl-[21px] text-sm text-[#d8d2e2]">
      <span aria-hidden="true" className="absolute top-0 left-0 text-[11px] text-soupe">
        ✦
      </span>
      {children}
    </li>
  )
}

/** La ligne « Tout le grade X », déduite du grade précédent dans l'ordre. */
function AvantageHerite({ nom }: { nom: string }) {
  return (
    <li className="relative pl-[21px] text-sm text-gris">
      <span aria-hidden="true" className="absolute top-0 left-0 text-[11px] text-bord">
        ↳
      </span>
      Tout le grade {nom}
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/* Kit                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Le monogramme affiché à défaut de kanji.
 *
 * Seuls les kits exclusifs ont un idéogramme ; les 21 classiques n'ont aucun
 * visuel en base. Plutôt que d'attendre 21 illustrations, on dérive une
 * pastille des initiales du nom : « Anti-Stomper » → « AS », « Archer » → « AR ».
 * C'est stable, ça ne demande aucun asset, et ça suffit à donner un point
 * d'accroche à l'œil dans une grille de vingt-sept cartes.
 *
 * Deux lettres et non une : « Archer » et « Anchor » donneraient tous les deux
 * « A ». L'unicité n'est pas garantie pour autant (« Fireman » et
 * « Fisherman » donnent « FI ») et ce n'est pas grave — la pastille est
 * décorative, le nom est juste à côté, elle ne sert qu'à accrocher l'œil.
 */
function monogramme(nom: string): string {
  const mots = nom.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  if (mots.length === 0) return '?'
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase()
  return (mots[0][0] + mots[1][0]).toUpperCase()
}

/**
 * Une carte de kit de la boutique.
 *
 * Compacte : elle doit tenir vingt-neuf fois dans une grille sans que la page
 * devienne un rouleau. D'où la description sur deux lignes maximum et la
 * fiche technique renvoyée à la page /kits/[slug].
 *
 * ⚠ La carte n'est PAS un <Link> englobant, contrairement à celle de /kits :
 * elle contient un bouton, et un <button> dans un <a> est du HTML invalide
 * (et injouable au clavier). Le lien porte donc sur le seul en-tête.
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
      className={`flex flex-col rounded-xl border p-4 transition-colors hover:border-[#3d2f5c] ${
        exclusif
          ? 'border-[#3a2a55] bg-linear-[168deg] from-[#1d1233] to-charbon'
          : 'border-bord bg-charbon'
      }`}
    >
      {/* --- en-tête cliquable : pastille + nom + rôle --- */}
      <Link
        href={`/kits/${kit.slug}`}
        className="group flex items-center gap-3"
        aria-label={`Voir la fiche du kit ${kit.nom}`}
      >
        <span
          aria-hidden="true"
          className={`flex size-11 shrink-0 items-center justify-center rounded-[10px] border font-mono text-[15px] font-bold ${
            exclusif
              ? 'border-violet/35 bg-violet/12 text-violet'
              : 'border-bord bg-braise text-soupe'
          }`}
        >
          {kit.kanji ?? monogramme(kit.nom)}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block truncate font-titre text-[16px] uppercase transition-colors ${
              exclusif ? 'text-violet' : 'text-creme'
            } group-hover:text-or`}
          >
            {kit.nom}
          </span>
          <span
            className={`block truncate font-mono text-[10px] tracking-[1.3px] uppercase ${
              exclusif ? 'text-violet/75' : 'text-oni'
            }`}
          >
            {kit.role}
          </span>
        </span>
      </Link>

      {/* Deux lignes maximum : au-delà, les cartes de la grille se
          désalignent et la page double de hauteur. La suite est sur la fiche. */}
      <p className="mt-3 mb-3.5 line-clamp-2 grow text-[13.5px] leading-[1.45] text-gris">
        {kit.descriptionCourte}
      </p>

      {/*
        Le prix en coins à côté du prix en euros : c'est la preuve visible de
        la promesse « tout s'obtient aussi en jouant ». Il n'est donc pas plus
        petit ni plus pâle que le prix en euros — les deux se lisent d'un coup.
      */}
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-bord pt-3">
        <span className="font-titre text-[17px] text-soupe">
          {formaterEuros(kit.prixEurosCentimes)}
        </span>
        {/* text-gris et non text-bord : #2E2245 est la couleur des bordures,
            elle passe à peine 1,5:1 sur le charbon. Le « ou » articule les deux
            prix, il doit se lire. */}
        <span className="text-[12px] text-gris">ou</span>
        {kit.prixCoins === 0 ? (
          <span className="font-titre text-[15px] text-vert">Gratuit en jeu</span>
        ) : (
          <span className="font-mono text-[13px] font-bold text-or">
            {formaterCoins(kit.prixCoins)}
            <span className="ml-1 font-corps text-[11.5px] font-normal text-gris">coins</span>
          </span>
        )}
      </div>

      <BoutonAjout
        dansLePanier={dansLePanier}
        indisponible={vente.indisponible}
        libelleIndisponible={vente.libelle}
        onClick={onBasculer}
      />
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/* Pack                                                                       */
/* -------------------------------------------------------------------------- */

export function CartePack({
  pack,
  dansLePanier,
  onBasculer,
}: {
  pack: PackBoutique
  dansLePanier: boolean
  onBasculer: () => void
}) {
  const vente = etatDeVente(pack)

  return (
    <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-soupe bg-linear-[100deg] from-soupe/7 to-transparent px-5 py-5 sm:px-6">
      <div className="min-w-[200px] flex-1">
        <h3 className="font-titre text-[19px] uppercase">{pack.nom}</h3>
        <p className="mt-1 text-sm text-gris">{pack.description}</p>
      </div>

      <div className="flex items-baseline gap-3">
        {pack.prixBarreCentimes !== null && (
          <span className="text-[15px] text-gris line-through">
            {formaterEuros(pack.prixBarreCentimes)}
          </span>
        )}
        <span className="font-titre text-[30px] text-or">
          {formaterEuros(pack.prixEurosCentimes)}
        </span>
      </div>

      <BoutonAjout
        dansLePanier={dansLePanier}
        indisponible={vente.indisponible}
        libelleIndisponible={vente.libelle}
        libelle="Ajouter le pack"
        pleineLargeur={false}
        onClick={onBasculer}
      />
    </article>
  )
}
