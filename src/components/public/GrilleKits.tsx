'use client'

import { useMemo, useState } from 'react'

import { CarteKit, estKitDeGrade, type KitEnCarte } from '@/components/public/CarteKit'
import { type CleTexte, t, type Locale } from '@/lib/i18n'
import { BarreOutils, Recherche } from '@/components/ui/BarreOutils'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { EtatVide } from '@/components/ui/EtatVide'
import { Filtre } from '@/components/ui/Pilule'

/**
 * La grille des kits, ses filtres, son tri et sa recherche.
 *
 * Composant client : tout se fait dans le navigateur, sans aller-retour
 * serveur. Les vingt-neuf kits sont déjà dans la page — on ne fait que
 * masquer, trier et réordonner.
 */

/**
 * Les quatre familles de la maquette.
 *
 * « Gratuits » et « À débloquer » se déduisent du prix, pas d'une colonne :
 * un kit gratuit est un kit à zéro coin, quel que soit son type. Rien à
 * ajouter en base.
 */
type CleFiltre = 'tous' | 'gratuit' | 'coins' | 'exclusif'

const FILTRES: { cle: CleFiltre; cleTexte: CleTexte; garde: (kit: KitEnCarte) => boolean }[] = [
  { cle: 'tous', cleTexte: 'kits.filtre.tous', garde: () => true },
  // Un kit de grade coûte zéro coin sans être gratuit : il n'a rien à faire
  // dans cet onglet, il est dans « Exclusifs ».
  {
    cle: 'gratuit',
    cleTexte: 'kits.filtre.gratuits',
    garde: (kit) => kit.prixCoins === 0 && !estKitDeGrade(kit),
  },
  {
    cle: 'coins',
    cleTexte: 'kits.filtre.debloquer',
    garde: (kit) => kit.prixCoins > 0 && kit.type === 'GRATUIT',
  },
  { cle: 'exclusif', cleTexte: 'kits.filtre.exclusifs', garde: (kit) => kit.type === 'EXCLUSIF' },
]

/**
 * Le bouton de tri fait défiler trois états en boucle. Chaque entrée dit vers
 * quel tri on bascule au prochain clic, et le libellé à afficher une fois
 * basculé — c'est ce qui permet au bouton d'annoncer son état courant plutôt
 * que l'action à venir.
 */
type CleTri = 'prix' | 'prixDesc' | 'nom'

const TRIS: Record<CleTri, { cleTexte: CleTexte; suivant: CleTri; comparer: (a: KitEnCarte, b: KitEnCarte) => number }> = {
  prix: {
    cleTexte: 'kits.tri.prix',
    suivant: 'prixDesc',
    comparer: (a, b) => a.prixCoins - b.prixCoins,
  },
  prixDesc: {
    cleTexte: 'kits.tri.prix-desc',
    suivant: 'nom',
    comparer: (a, b) => b.prixCoins - a.prixCoins,
  },
  nom: {
    cleTexte: 'kits.tri.nom',
    suivant: 'prix',
    // localeCompare avec 'fr' : sans lui, « Épée » se classerait après « Zéro ».
    comparer: (a, b) => a.nom.localeCompare(b.nom, 'fr'),
  },
}

export function GrilleKits({ kits, locale }: { kits: KitEnCarte[]; locale: Locale }) {
  const [filtre, setFiltre] = useState<CleFiltre>('tous')
  const [tri, setTri] = useState<CleTri>('prix')
  const [recherche, setRecherche] = useState('')

  const kitsAffiches = useMemo(() => {
    const garde = FILTRES.find((option) => option.cle === filtre)!.garde
    const terme = recherche.trim().toLocaleLowerCase('fr')

    const liste = kits.filter((kit) => {
      if (!garde(kit)) return false
      if (terme === '') return true

      // La recherche couvre aussi le rôle et les caractéristiques : on cherche
      // « poison » ou « mobilité » plus souvent qu'un nom de kit précis.
      const champs = [
        kit.nom,
        kit.role,
        kit.descriptionCourte,
        ...kit.caracteristiques.flatMap((carac) => [carac.libelle, carac.valeur]),
      ]

      return champs.some((champ) => champ.toLocaleLowerCase('fr').includes(terme))
    })

    // Copie avant tri : `filter` en renvoie déjà une, mais l'intention est
    // qu'on ne réordonne jamais le tableau reçu en propriété.
    return [...liste].sort(TRIS[tri].comparer)
  }, [kits, filtre, tri, recherche])

  const filtree = filtre !== 'tous' || recherche.trim() !== ''

  function reinitialiser() {
    setFiltre('tous')
    setRecherche('')
  }

  return (
    /*
      Le conteneur borne la barre collante : elle se décolle une fois la grille
      passée, au lieu de suivre le lecteur jusque dans les sections « exclusifs »
      et « coins », où filtrer des kits n'a plus de sens.
    */
    <div>
      <BarreOutils>
        <div className="flex flex-wrap gap-1.5 max-[560px]:w-full" role="group" aria-label={t(locale, 'kits.filtrer')}>
          {FILTRES.map((option) => (
            <Filtre
              key={option.cle}
              actif={filtre === option.cle}
              onClick={() => setFiltre(option.cle)}
              className="max-[560px]:flex-1"
            >
              {t(locale, option.cleTexte)}
            </Filtre>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setTri(TRIS[tri].suivant)}
          className="inline-flex min-h-11 items-center rounded-controle border border-bord bg-charbon px-3 font-mono text-[11.5px] tracking-[.08em] text-gris uppercase transition-colors hover:text-creme max-[560px]:w-full"
        >
          {t(locale, TRIS[tri].cleTexte)}
        </button>

        <Recherche
          valeur={recherche}
          onChange={setRecherche}
          etiquette={t(locale, 'kits.chercher')}
          placeholder={t(locale, 'kits.chercher-placeholder')}
        />
      </BarreOutils>

      <Enveloppe>
        <p className="pt-4.5 font-mono text-[11.5px] tracking-[.06em] text-gris" aria-live="polite">
          <b className="text-soupe">{kitsAffiches.length}</b>{' '}
          {t(locale, kitsAffiches.length > 1 ? 'kits.plusieurs' : 'kits.un')}
          {filtree && ` ${t(locale, 'kits.sur')} ${kits.length}`}
        </p>

        {kitsAffiches.length === 0 ? (
          <EtatVide
            className="mt-5.5"
            message={t(locale, 'kits.aucun-resultat')}
            action={{ libelle: t(locale, 'kits.tout-reafficher'), onClick: reinitialiser }}
          />
        ) : (
          <div className="mt-5.5 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(292px,1fr))] max-[560px]:grid-cols-1">
            {kitsAffiches.map((kit) => (
              <CarteKit key={kit.slug} kit={kit} locale={locale} />
            ))}
          </div>
        )}
      </Enveloppe>
    </div>
  )
}
