'use client'

import { useId, useMemo, useState } from 'react'

import { CarteKitBoutique, CartePack } from '@/components/boutique/Cartes'
import type { KitBoutique, PackBoutique } from '@/components/boutique/types'
import type { ArticlePanier } from '@/lib/panier'
import { contient } from '@/lib/panier'

/**
 * Le rayon « kits » de la boutique : recherche, filtres rapides, et la grille.
 *
 * Une seule grille pour les deux familles, plutôt qu'un onglet par famille.
 * Avec vingt-sept kits en vente, la question du joueur n'est plus « quel
 * rayon ? » mais « où est le kit que je cherche ? » — d'où la recherche en
 * tête, et des cartes assez compactes pour qu'une famille entière tienne à
 * l'écran.
 *
 * Tout est déjà dans la page : filtrer ne fait que masquer, sans aucun
 * aller-retour serveur.
 */
type Filtre = 'tous' | 'GRATUIT' | 'EXCLUSIF'

const FILTRES: { cle: Filtre; label: string }[] = [
  { cle: 'tous', label: 'Tous' },
  { cle: 'GRATUIT', label: 'Classiques' },
  { cle: 'EXCLUSIF', label: 'Exclusifs' },
]

/**
 * Comparaison souple : sans accents, sans casse.
 * « Onryō » se trouve donc en tapant « onryo », et « Anti-Stomper » en tapant
 * « stomper » — la recherche est une sous-chaîne, pas un préfixe.
 */
function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function GrilleKitsBoutique({
  kits,
  packs,
  panier,
  onBasculer,
}: {
  kits: KitBoutique[]
  packs: PackBoutique[]
  panier: ArticlePanier[]
  onBasculer: (article: ArticlePanier) => void
}) {
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [recherche, setRecherche] = useState('')
  const idRecherche = useId()

  const requete = normaliser(recherche)

  const kitsAffiches = useMemo(
    () =>
      kits.filter((kit) => {
        if (filtre !== 'tous' && kit.type !== filtre) return false
        if (requete === '') return true
        return normaliser(kit.nom).includes(requete)
      }),
    [kits, filtre, requete],
  )

  const classiques = kitsAffiches.filter((kit) => kit.type === 'GRATUIT')
  const exclusifs = kitsAffiches.filter((kit) => kit.type === 'EXCLUSIF')

  // Les packs ne portent pas de nom de kit : ils disparaissent dès qu'une
  // recherche est en cours, et ne s'affichent qu'avec le rayon exclusif.
  const packsAffiches = requete === '' && filtre !== 'GRATUIT' ? packs : []

  const dansLePanier = (type: ArticlePanier['type'], slug: string) =>
    contient(panier, { type, slug })

  return (
    <section aria-labelledby="titre-rayon-kits">
      <div className="mb-5">
        <h2 id="titre-rayon-kits" className="font-titre text-[clamp(20px,2.6vw,27px)] uppercase">
          Les kits
        </h2>
        <p className="mt-1.5 max-w-[620px] text-[15px] text-gris sm:text-[15.5px]">
          Vingt-et-un kits classiques et six kits maison. Aucun ne frappe plus fort qu’un
          autre : ils jouent autrement, et tous s’obtiennent aussi en coins.
        </p>
      </div>

      {/*
        Collée en haut au scroll : avec vingt-sept cartes, une recherche qu'il
        faut remonter chercher ne sert à rien. `top-22` dégage la barre de
        navigation flottante (top-4 + ~64 px de hauteur).
      */}
      <div className="sticky top-22 z-20 -mx-2 mb-6 rounded-xl border border-bord bg-nuit/92 px-2 py-2.5 backdrop-blur-md sm:-mx-3 sm:px-3">
        {/*
          Deux dispositions pour trois éléments, sans les dupliquer dans le DOM.

          Sous md, `flex-wrap` met la recherche et le décompte sur la première
          ligne, et les puces sur la seconde, en pleine largeur — c'est la seule
          façon que les trois puces tiennent à 360 px sans défilement.
          À partir de md, `flex-nowrap` remet tout sur une ligne et `order-4`
          renvoie le décompte à droite.
        */}
        <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap">
          <div className="relative order-1 min-w-0 flex-1 md:max-w-[300px]">
            <label htmlFor={idRecherche} className="sr-only">
              Rechercher un kit par son nom
            </label>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gris"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id={idRecherche}
              type="search"
              value={recherche}
              onChange={(evenement) => setRecherche(evenement.target.value)}
              placeholder="Rechercher un kit…"
              autoComplete="off"
              spellCheck={false}
              className="min-h-11 w-full rounded-[9px] border border-bord bg-charbon pr-9 pl-9 text-[15px] text-creme placeholder:text-[#5e5473] focus:border-soupe focus:outline-none"
            />
            {recherche !== '' && (
              <button
                type="button"
                onClick={() => setRecherche('')}
                aria-label="Effacer la recherche"
                className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-[17px] leading-none text-gris transition-colors hover:text-creme"
              >
                ×
              </button>
            )}
          </div>

          <span
            aria-live="polite"
            className="order-2 shrink-0 font-mono text-[12.5px] whitespace-nowrap text-gris md:order-4 md:ml-auto"
          >
            {kitsAffiches.length} kit{kitsAffiches.length > 1 ? 's' : ''}
          </span>

          {/*
            `min-w-0` est indispensable : sans lui, `min-width: auto` — la
            valeur par défaut d'un enfant flex — empêche la boîte de rétrécir
            sous la largeur de ses puces, et c'est toute la page qui déborde au
            lieu de la boîte qui défile.
            `overflow-x-auto` reste un filet de sécurité (police système plus
            large, zoom texte) : aux largeurs visées les trois puces tiennent,
            et la barre de défilement est masquée pour ne pas balafrer la barre.
          */}
          <div
            role="group"
            aria-label="Filtrer les kits"
            className="sans-barre-de-defilement -mx-1 order-3 flex w-full min-w-0 gap-2 overflow-x-auto px-1 py-0.5 md:w-auto md:flex-none md:overflow-visible"
          >
            {FILTRES.map((option) => {
              const actif = filtre === option.cle

              return (
                <button
                  key={option.cle}
                  type="button"
                  onClick={() => setFiltre(option.cle)}
                  aria-pressed={actif}
                  className={`min-h-11 shrink-0 rounded-lg border px-3 font-mono text-[12.5px] font-bold tracking-wide whitespace-nowrap uppercase transition-colors sm:px-3.5 ${
                    actif
                      ? 'border-soupe bg-soupe text-[#1a0f00]'
                      : 'border-bord text-gris hover:border-[#3d2f5c] hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {kitsAffiches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-bord px-6 py-12 text-center text-gris">
          {requete === ''
            ? 'Aucun kit en vente dans cette catégorie pour le moment.'
            : `Aucun kit ne s’appelle « ${recherche.trim()} ».`}
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {classiques.length > 0 && (
            <Rayon
              titre="Kits classiques"
              nombre={classiques.length}
              legende="Ceux du menu en jeu. De 0 à 3 500 coins, ou 2 € pour sauter le grind."
            >
              {classiques.map((kit) => (
                <CarteKitBoutique
                  key={kit.slug}
                  kit={kit}
                  dansLePanier={dansLePanier('KIT', kit.slug)}
                  onBasculer={() => onBasculer({ type: 'KIT', slug: kit.slug })}
                />
              ))}
            </Rayon>
          )}

          {exclusifs.length > 0 && (
            <Rayon
              titre="Kits exclusifs"
              nombre={exclusifs.length}
              legende="Pensés et codés pour LJKITS. Plus chers en coins, pas plus forts."
            >
              {exclusifs.map((kit) => (
                <CarteKitBoutique
                  key={kit.slug}
                  kit={kit}
                  dansLePanier={dansLePanier('KIT', kit.slug)}
                  onBasculer={() => onBasculer({ type: 'KIT', slug: kit.slug })}
                />
              ))}
            </Rayon>
          )}

          {packsAffiches.map((pack) => (
            <CartePack
              key={pack.slug}
              pack={pack}
              dansLePanier={dansLePanier('PACK', pack.slug)}
              onBasculer={() => onBasculer({ type: 'PACK', slug: pack.slug })}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/**
 * Un rayon de la grille : son titre, son décompte, ses cartes.
 *
 * La grille monte jusqu'à trois colonnes seulement, et pas avant `xl` : c'est
 * à `lg` que la colonne du panier apparaît à droite, et trois colonnes dans
 * l'espace restant donnent des cartes de 178 px — trop étroites pour que le
 * prix en euros ET le prix en coins tiennent sur la même ligne. Or c'est
 * justement la ligne qu'on ne veut pas voir se casser.
 */
function Rayon({
  titre,
  nombre,
  legende,
  children,
}: {
  titre: string
  nombre: number
  legende: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-bord pb-2.5">
        <h3 className="font-titre text-[17px] uppercase">{titre}</h3>
        <span className="font-mono text-[11.5px] tracking-[1.2px] text-gris uppercase">
          {nombre} kit{nombre > 1 ? 's' : ''}
        </span>
        <p className="w-full text-[13.5px] text-gris lg:w-auto lg:flex-1 lg:text-right">
          {legende}
        </p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  )
}
