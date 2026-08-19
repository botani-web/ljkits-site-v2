'use client'

import { BoutonAjout } from '@/components/boutique/BoutonAjout'
import type { GradeBoutique, KitBoutique, PackBoutique } from '@/components/boutique/types'
import { formaterCoins, formaterEuros } from '@/lib/format'

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
        indisponible={!grade.achetable}
        libelleIndisponible="Indisponible"
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
/* Kit exclusif                                                               */
/* -------------------------------------------------------------------------- */

export function CarteKitBoutique({
  kit,
  dansLePanier,
  onBasculer,
}: {
  kit: KitBoutique
  dansLePanier: boolean
  onBasculer: () => void
}) {
  return (
    <article className="flex flex-col rounded-xl border border-bord bg-charbon p-5 transition-all hover:-translate-y-[3px] hover:border-[#3d2f5c]">
      <div className="flex items-baseline justify-between gap-2.5">
        <h3 className="font-titre text-[18px] uppercase">{kit.nom}</h3>
        {kit.kanji && (
          <span aria-hidden="true" className="font-mono text-sm text-bord">
            {kit.kanji}
          </span>
        )}
      </div>

      <div className="mt-1.5 font-mono text-[10.5px] tracking-[1.4px] text-oni uppercase">
        {kit.role}
      </div>

      <p className="mt-2.5 mb-4 grow text-sm text-gris">{kit.descriptionCourte}</p>

      {/* Le prix en coins à côté du prix en euros : c'est la preuve visible
          de la promesse « tout s'obtient aussi en jouant ». */}
      <div className="mb-3.5 flex items-center gap-2.5 border-t border-bord pt-3">
        <span className="font-titre text-[19px] text-soupe">
          {formaterEuros(kit.prixEurosCentimes)}
        </span>
        <span className="text-[12.5px] text-bord">ou</span>
        <span className="font-mono text-xs text-gris">
          <b className="font-bold text-or">{formaterCoins(kit.prixCoins)}</b> coins
        </span>
      </div>

      <BoutonAjout
        dansLePanier={dansLePanier}
        indisponible={kit.bientot || !kit.achetable}
        libelleIndisponible={kit.bientot ? 'Bientôt disponible' : 'Indisponible'}
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
  return (
    <article className="mt-4.5 flex flex-wrap items-center justify-between gap-5 rounded-xl border border-dashed border-soupe bg-linear-[100deg] from-soupe/7 to-transparent px-6 py-5.5">
      <div>
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
        indisponible={!pack.achetable}
        libelleIndisponible="Indisponible"
        libelle="Ajouter le pack"
        pleineLargeur={false}
        onClick={onBasculer}
      />
    </article>
  )
}
