'use client'

import { useMemo, useState } from 'react'

import { CompteARebours } from '@/components/classement/CompteARebours'
import { Podium } from '@/components/classement/Podium'
import { BarreOutils, Recherche } from '@/components/ui/BarreOutils'
import { CadreTable, EnteteTable, JaugeDeFond } from '@/components/ui/CadreTable'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { EtatVide } from '@/components/ui/EtatVide'
import { ListeOnglets, Onglet } from '@/components/ui/Pilule'
import { Etiquette } from '@/components/ui/TeteSection'
import { TAILLE_CLASSEMENT, type LigneClassement, type Periode } from '@/lib/classement'
import { formaterCoins, formaterRatio } from '@/lib/format'

/**
 * Le classement : en-tête, compte à rebours, onglets, podium et tableau.
 *
 * Tout est dans un seul composant client parce que ces quatre blocs partagent
 * un même état — la période choisie. Le compte à rebours vit dans l'en-tête et
 * change de titre avec l'onglet ; le séparer aurait demandé de remonter l'état
 * encore plus haut, donc de rendre l'en-tête client de toute façon.
 *
 * Les trois listes sont envoyées ensemble par le serveur : changer d'onglet
 * n'entraîne aucun aller-retour.
 */

/** Lignes affichées avant de cliquer sur « afficher la suite ». */
const LIMITE_INITIALE = 25

type Configuration = {
  cle: Periode
  label: string
  /** Unité affichée à côté des valeurs du podium. */
  unite: string
  /** Titre de la colonne qui porte `valeur`. */
  colonneValeur: string
  /** Timestamp de la prochaine remise à zéro, ou null pour « à vie ». */
  finUnix: number | null
  titreRebours: string
  piedRebours: string
  /** Les lots des trois premières places. Vide à vie : elle ne rapporte rien. */
  lots: string[]
}

export function TableauClassement({
  classements,
  finSemaine,
  finMois,
}: {
  classements: Record<Periode, LigneClassement[]>
  finSemaine: number
  finMois: number
}) {
  const [actif, setActif] = useState<Periode>('semaine')
  const [recherche, setRecherche] = useState('')
  const [limite, setLimite] = useState(LIMITE_INITIALE)

  const configurations: Configuration[] = [
    {
      cle: 'semaine',
      label: 'Semaine',
      unite: 'points',
      colonneValeur: 'Points',
      finUnix: finSemaine,
      titreRebours: 'Reset hebdomadaire dans',
      piedRebours: 'Lundi 00h00 · les coins et les kits restent acquis',
      lots: ['5 000 coins · Titre Champion, 7 jours', '3 000 coins', '2 000 coins'],
    },
    {
      cle: 'mois',
      label: 'Mois',
      unite: 'points',
      colonneValeur: 'Points',
      finUnix: finMois,
      titreRebours: 'Reset mensuel dans',
      piedRebours: 'Cycle glissant de 30 jours · les coins et les kits restent acquis',
      lots: [
        '15 000 coins · Shogun, 30 jours',
        '10 000 coins · Samouraï, 30 jours',
        '7 000 coins · Ronin, 30 jours',
      ],
    },
    {
      cle: 'vie',
      label: 'À vie',
      unite: 'kills',
      colonneValeur: 'Kills',
      finUnix: null,
      titreRebours: 'Classement à vie',
      piedRebours: 'Jamais réinitialisé, depuis l’ouverture du serveur',
      lots: [],
    },
  ]

  const configuration = configurations.find((une) => une.cle === actif)!
  const lignes = classements[actif]

  /*
    Le classement à vie est le seul à porter des colonnes de détail : la base
    ne stocke qu'un total de points pour la semaine et pour le mois, sans
    décomposition. Afficher des colonnes vides serait pire que ne pas les
    afficher.
  */
  const avecDetails = actif === 'vie'

  const resultats = useMemo(() => {
    const terme = recherche.trim().toLocaleLowerCase('fr')
    if (terme === '') return lignes
    return lignes.filter((ligne) => ligne.pseudo.toLocaleLowerCase('fr').includes(terme))
  }, [lignes, recherche])

  const visibles = resultats.slice(0, limite)
  const restantes = resultats.length - visibles.length

  /** Le podium n'a de sens que sur le classement complet, non filtré. */
  const surLePodium = recherche.trim() === '' ? resultats.slice(0, 3) : []
  const dansLeTableau = resultats.slice(surLePodium.length, limite)

  // La jauge de fond se mesure sur le meilleur score de la période, podium
  // compris — sinon la première ligne du tableau apparaîtrait toujours pleine.
  const meilleurScore = lignes[0]?.valeur ?? 1

  function changerDePeriode(cle: string) {
    setActif(cle as Periode)
    // La limite se remet à zéro : une recherche « affichée jusqu'au 50e » sur
    // la semaine n'a pas de raison de s'appliquer au mois.
    setLimite(LIMITE_INITIALE)
  }

  /*
    Deux gabarits de colonnes, l'un pour l'en-tête (qui n'existe qu'à partir de
    lg, d'où le style en ligne), l'autre pour les lignes, en classes Tailwind.

    Les lignes ne passent PAS par un style en ligne : il l'emporterait sur
    toute règle de media query, et le repli à trois colonnes sous 1024px ne
    s'appliquerait jamais.
  */
  const colonnesEntete = avecDetails
    ? '56px minmax(0,1fr) repeat(3,64px) 92px'
    : '56px minmax(0,1fr) 92px'

  const colonnesLigne = avecDetails
    ? 'grid-cols-[48px_minmax(0,1fr)_76px] lg:grid-cols-[56px_minmax(0,1fr)_repeat(3,64px)_92px]'
    : 'grid-cols-[48px_minmax(0,1fr)_76px] lg:grid-cols-[56px_minmax(0,1fr)_92px]'

  return (
    <>
      {/* ═══════════════════════════ EN-TÊTE ═══════════════════════════ */}
      <header className="halo-hero-gauche pt-[clamp(48px,6vw,80px)] pb-[clamp(30px,4vw,42px)]">
        <Enveloppe>
          <div className="grid items-end gap-[clamp(28px,4vw,56px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)]">
            <div>
              <Etiquette>
                Top {TAILLE_CLASSEMENT} · mis à jour en direct
              </Etiquette>
              <h1 className="text-h1 mt-4 font-titre">
                Le <span className="text-or">tableau</span>
              </h1>
              <p className="mt-4.5 max-w-[54ch] text-[clamp(16px,1.8vw,18px)] text-gris">
                Tout ce que tu fais en jeu se transforme en points. Le tableau se vide chaque
                lundi et les dix premiers repartent avec des coins.{' '}
                <b className="font-semibold text-creme">Cherche ton pseudo</b> pour voir ta
                place exacte, même au fond du classement.
              </p>
            </div>

            <div className="max-lg:max-w-[420px]">
              <CompteARebours
                finUnix={configuration.finUnix}
                titre={configuration.titreRebours}
                pied={configuration.piedRebours}
              />
            </div>
          </div>
        </Enveloppe>
      </header>

      {/* ══════════════════════ ONGLETS ET RECHERCHE ══════════════════════ */}
      <div>
        <BarreOutils>
          <ListeOnglets
            etiquette="Période du classement"
            cles={configurations.map((une) => une.cle)}
            actif={actif}
            onChange={changerDePeriode}
            className="max-[560px]:w-full"
          >
            {configurations.map((une) => (
              <Onglet
                key={une.cle}
                actif={une.cle === actif}
                onClick={() => changerDePeriode(une.cle)}
                controle="panneau-classement"
                className="max-[560px]:flex-1"
              >
                {une.label}
              </Onglet>
            ))}
          </ListeOnglets>

          <Recherche
            valeur={recherche}
            onChange={(valeur) => {
              setRecherche(valeur)
              setLimite(LIMITE_INITIALE)
            }}
            etiquette="Chercher un joueur"
            placeholder="Cherche ton pseudo"
          />
        </BarreOutils>

        <section
          id="panneau-classement"
          role="tabpanel"
          aria-label={`Classement — ${configuration.label}`}
          className="pt-[clamp(30px,4vw,44px)] pb-section"
        >
          <Enveloppe>
            {resultats.length === 0 ? (
              <EtatVide
                message={
                  recherche.trim() !== ''
                    ? 'Aucun joueur ne correspond à cette recherche sur cette période.'
                    : actif === 'vie'
                      ? 'Aucun joueur classé pour le moment.'
                      : 'Les compteurs viennent d’être remis à zéro — connecte-toi pour ouvrir le bal.'
                }
                action={
                  recherche.trim() !== ''
                    ? { libelle: 'Réafficher le classement', onClick: () => setRecherche('') }
                    : undefined
                }
              />
            ) : (
              <>
                {surLePodium.length > 0 && (
                  <Podium
                    lignes={surLePodium}
                    unite={configuration.unite}
                    avecDetails={avecDetails}
                    lots={configuration.lots}
                  />
                )}

                {dansLeTableau.length > 0 && (
                  <CadreTable className="mt-3.5">
                    <div className="max-lg:hidden">
                      <EnteteTable
                        colonnes={colonnesEntete}
                        libelles={
                          avecDetails
                            ? ['Rang', 'Joueur', 'Kills', 'Morts', 'K/D', 'Record de série']
                            : ['Rang', 'Joueur', configuration.colonneValeur]
                        }
                        alignerADroite={avecDetails ? [2, 3, 4, 5] : [2]}
                      />
                    </div>

                    <ol>
                      {dansLeTableau.map((ligne) => (
                        <li
                          key={`${actif}-${ligne.pseudo}`}
                          className={`relative grid items-center gap-3 border-b border-bord px-4.5 py-[13px] transition-colors last:border-b-0 hover:bg-braise ${colonnesLigne}`}
                        >
                          <JaugeDeFond pourcentage={(ligne.valeur / meilleurScore) * 100} />

                          <span
                            className={`relative font-mono text-[13px] ${
                              ligne.rang <= 3 ? 'font-bold text-or' : 'text-gris'
                            }`}
                          >
                            {ligne.rang}
                          </span>

                          <span className="relative truncate text-[15.5px] font-semibold">
                            {ligne.pseudo}
                          </span>

                          {/*
                            Les colonnes de détail disparaissent sous 1024px :
                            six colonnes chiffrées ne tiennent pas sur un
                            téléphone sans réduire le pseudo à trois lettres.
                          */}
                          {avecDetails && (
                            <>
                              <Chiffre>{formaterCoins(ligne.valeur)}</Chiffre>
                              <Chiffre>{formaterCoins(ligne.morts ?? 0)}</Chiffre>
                              <Chiffre>{formaterRatio(ligne.valeur, ligne.morts ?? 0)}</Chiffre>
                            </>
                          )}

                          <span className="relative text-right font-mono text-[15px] font-bold text-soupe">
                            {avecDetails
                              ? (ligne.recordSerie ?? 0)
                              : formaterCoins(ligne.valeur)}
                          </span>
                        </li>
                      ))}
                    </ol>

                    {restantes > 0 && (
                      <button
                        type="button"
                        onClick={() => setLimite(TAILLE_CLASSEMENT)}
                        className="w-full border-t border-bord bg-braise py-4 font-mono text-xs font-bold tracking-[.12em] text-soupe uppercase transition-colors hover:bg-bord"
                      >
                        Afficher les {restantes} suivants
                      </button>
                    )}
                  </CadreTable>
                )}

                <p className="mt-3.5 font-mono text-[11px] text-gris" aria-live="polite">
                  {resultats.length}{' '}
                  {resultats.length > 1 ? 'joueurs classés' : 'joueur classé'}
                  {recherche.trim() !== '' && ` sur ${lignes.length}`}
                  {resultats.length >= TAILLE_CLASSEMENT &&
                    ` · le classement s’arrête au ${TAILLE_CLASSEMENT}e`}
                </p>
              </>
            )}
          </Enveloppe>
        </section>
      </div>
    </>
  )
}

/** Une colonne chiffrée du tableau, masquée sous 1024px. */
function Chiffre({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative text-right font-mono text-[13px] text-gris max-lg:hidden">
      {children}
    </span>
  )
}
