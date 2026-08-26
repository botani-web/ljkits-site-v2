import { Badge } from '@/components/ui/Badge'
import { CarteLien, KanjiFiligrane } from '@/components/ui/Carte'
import { LignesLore } from '@/components/ui/LignesLore'
import { formaterCoins, formaterEuros } from '@/lib/format'

/**
 * Les champs d'un kit nécessaires à l'affichage d'une carte.
 * Type explicite plutôt que dérivé de Prisma : ces données transitent vers un
 * composant client, autant que la frontière soit lisible.
 */
export type KitEnCarte = {
  slug: string
  nom: string
  kanji: string | null
  role: string
  descriptionCourte: string
  prixCoins: number
  prixEurosCentimes: number | null
  type: 'GRATUIT' | 'EXCLUSIF'
  bientot: boolean
  kitDeDepart: boolean
  caracteristiques: { libelle: string; valeur: string }[]
}

/**
 * La carte d'un kit dans la grille de /kits.
 *
 * Elle est bâtie comme un tooltip d'item : un nom, un rôle encadré, une
 * phrase, puis les caractéristiques en lignes clé/valeur monospace, et le prix
 * en pied. Les kits exclusifs portent leur kanji en filigrane dans l'angle bas
 * droit et passent en rouge oni.
 */
export function CarteKit({ kit }: { kit: KitEnCarte }) {
  const exclusif = kit.type === 'EXCLUSIF'

  return (
    <CarteLien
      href={`/kits/${kit.slug}`}
      ton={exclusif ? 'oni' : 'defaut'}
      className="group p-5.5 pb-4.5"
    >
      {/* Le filigrane n'existe que sur les exclusifs : c'est ce qui les
          distingue au premier coup d'œil dans une grille de vingt-neuf. */}
      {exclusif && kit.kanji && <KanjiFiligrane>{kit.kanji}</KanjiFiligrane>}

      <div className="relative flex flex-wrap items-baseline gap-2.5">
        <h2
          className={`font-titre text-[19px] tracking-[-.01em] ${
            exclusif ? 'text-oni' : ''
          }`}
        >
          {kit.nom}
        </h2>

        <Badge className="transition-colors group-hover:border-soupe group-hover:text-soupe">
          {kit.role}
        </Badge>

        {kit.bientot && <Badge ton="soupe">Bientôt</Badge>}
      </div>

      {/*
        `min-h` sur la description : sans elle, une phrase courte remonte le
        bloc de caractéristiques et les lignes clé/valeur ne s'alignent plus
        d'une carte à l'autre sur la même rangée.
      */}
      <p className="relative mt-3 min-h-11 text-[14.5px] text-gris">
        {kit.descriptionCourte}
      </p>

      <LignesLore lignes={kit.caracteristiques} taille="compacte" className="relative" />

      <div className="relative mt-4.5 flex items-end gap-3 border-t border-bord pt-3.5">
        <PrixKit
          prixCoins={kit.prixCoins}
          mention={kit.prixCoins === 0 && kit.kitDeDepart ? 'Kit de départ' : undefined}
        />

        {/*
          Pas un <Badge> : celui-ci force les majuscules et un interlettrage
          large, illisibles sur « ou 4,50 € ». Le prix en euros garde sa casse
          et son symbole.
        */}
        {kit.prixEurosCentimes !== null && (
          <span
            className={`ml-auto shrink-0 rounded-micro border px-2.25 py-1.25 font-mono text-[11px] ${
              exclusif ? 'border-soupe/40 text-soupe' : 'border-bord text-gris'
            }`}
          >
            ou {formaterEuros(kit.prixEurosCentimes)}
          </span>
        )}
      </div>
    </CarteLien>
  )
}

/**
 * Le prix en coins, ou « Gratuit » en vert quand il vaut zéro.
 *
 * `mention` remplace le mot « coins » sous le chiffre — sur un kit offert, il
 * n'y a pas de coins à annoncer, mais il y a une raison à donner.
 */
export function PrixKit({
  prixCoins,
  mention,
  taille = 'carte',
}: {
  prixCoins: number
  mention?: string
  taille?: 'carte' | 'detail'
}) {
  const gratuit = prixCoins === 0
  const classeTaille = taille === 'detail' ? 'text-[30px]' : 'text-[17px]'

  return (
    <p className="leading-tight">
      <span
        className={`font-mono font-bold ${classeTaille} ${gratuit ? 'text-vert' : 'text-or'}`}
      >
        {gratuit ? 'Gratuit' : formaterCoins(prixCoins)}
      </span>
      <span className="mt-1 block font-mono text-[10.5px] font-medium tracking-[.1em] text-gris uppercase">
        {mention ?? (gratuit ? 'Offert' : 'coins')}
      </span>
    </p>
  )
}
