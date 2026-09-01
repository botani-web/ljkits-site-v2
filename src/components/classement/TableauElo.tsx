'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { BarreOutils, Recherche } from '@/components/ui/BarreOutils'
import { CadreTable, EnteteTable, JaugeDeFond } from '@/components/ui/CadreTable'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { EtatVide } from '@/components/ui/EtatVide'
import { Etiquette } from '@/components/ui/TeteSection'
import { useClassementDirect } from '@/hooks/useClassementDirect'
import { COMBATS_MINIMUM, palierDe, resteAvantSuivant, type CombatRecent, type LigneElo } from '@/lib/elo'
import { formaterRatio } from '@/lib/format'

/**
 * Le classement Elo : en-tête, podium et tableau.
 *
 * Composant client pour une seule raison : la recherche par pseudo. Elle est
 * indispensable sur un ladder — un joueur classé 47e doit pouvoir se trouver
 * sans dérouler cinquante lignes.
 *
 * Il n'y a PLUS D'ONGLETS, contrairement à l'ancien classement. L'Elo est une
 * mesure unique : semaine, mois et « à vie » n'avaient de sens que pour des
 * compteurs de points cumulés. Une saison, un tableau.
 *
 * LE TABLEAU SE MET À JOUR TOUT SEUL. Le serveur rend une première version
 * complète — donc indexable et lisible sans JavaScript — puis le hook prend
 * le relais et rafraîchit les chiffres toutes les quinze secondes, sans
 * rechargement. C'est ce qui permet de laisser la page ouverte sur un
 * second écran pendant qu'on joue.
 */

/** Lignes affichées avant de cliquer sur « afficher la suite ». */
const LIMITE_INITIALE = 25

/** Les trois marches, reprises du podium existant pour rester dans la DA. */
const MARCHES = [
  { bordure: 'border-or/50', fond: 'bg-linear-160 from-or/10 to-braise', chiffre: 'text-or/30', nom: 'text-or' },
  { bordure: 'border-argent/30', fond: 'bg-braise', chiffre: 'text-argent/20', nom: 'text-argent' },
  { bordure: 'border-bronze/30', fond: 'bg-braise', chiffre: 'text-bronze/20', nom: 'text-bronze' },
] as const

export function TableauElo({
  lignes: lignesInitiales,
  combats: combatsInitiaux,
  derniereMaj: majInitiale,
  saison,
  cashprize,
}: {
  lignes: LigneElo[]
  combats: CombatRecent[]
  derniereMaj: string | null
  saison: string
  cashprize: string
}) {
  const [recherche, setRecherche] = useState('')
  const [limite, setLimite] = useState(LIMITE_INITIALE)

  const { donnees, enDirect } = useClassementDirect({
    lignes: lignesInitiales,
    combats: combatsInitiaux,
    derniereMaj: majInitiale,
  })
  const lignes = donnees.lignes

  const resultats = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    if (terme === '') return lignes
    return lignes.filter((ligne) => ligne.pseudo.toLowerCase().includes(terme))
  }, [lignes, recherche])

  // Le podium ne s'affiche que sur le classement complet : filtré, la notion
  // de « trois premiers » ne veut plus rien dire.
  const filtre = recherche.trim() !== ''
  const surLePodium = filtre ? [] : resultats.slice(0, 3)
  const dansLeTableau = filtre ? resultats : resultats.slice(3)
  const visibles = dansLeTableau.slice(0, limite)
  const restantes = dansLeTableau.length - visibles.length

  // La jauge se mesure sur l'écart au plancher (800), pas sur l'Elo brut :
  // sinon la barre du dernier serait déjà aux trois quarts pleine et
  // l'échelle ne dirait plus rien.
  const PLANCHER = 800
  const meilleur = Math.max(1, (lignes[0]?.elo ?? PLANCHER) - PLANCHER)

  const colonnesEntete = '56px minmax(0,1fr) 96px 74px 66px 74px'
  const colonnesLigne =
    'grid-cols-[44px_minmax(0,1fr)_84px] lg:grid-cols-[56px_minmax(0,1fr)_96px_74px_66px_74px]'

  return (
    <>
      {/* ═══════════════════════════ EN-TÊTE ═══════════════════════════ */}
      <header className="halo-hero-gauche pt-[clamp(48px,6vw,80px)] pb-[clamp(30px,4vw,42px)]">
        <Enveloppe>
          <div className="grid items-end gap-[clamp(28px,4vw,56px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)]">
            <div>
              <Etiquette>{saison} · mis à jour en direct</Etiquette>
              <h1 className="text-h1 mt-4 font-titre">
                Le classement <span className="text-or">Elo</span>
              </h1>
              <p className="mt-4.5 max-w-[54ch] text-[clamp(16px,1.8vw,18px)] text-gris">
                Tout le monde démarre à <b className="font-semibold text-creme">1000 Elo</b>. Tu
                en gagnes en tuant plus fort que toi, tu en perds en tombant contre plus
                faible. La saison dure un mois, puis tout repart à zéro.{' '}
                <b className="font-semibold text-creme">Cherche ton pseudo</b> pour voir ta place
                exacte.
              </p>
            </div>

            <div className="rounded-carte border border-or/40 bg-linear-160 from-or/10 to-braise p-6">
              <p className="font-mono text-[11px] tracking-[.12em] text-or uppercase">
                Cashprize de la saison
              </p>
              <p className="mt-2 font-titre text-[clamp(34px,5vw,46px)] leading-none text-or">
                {cashprize}
              </p>
              <p className="mt-3 border-t border-bord pt-3 text-sm text-gris">
                Réparti entre les meilleurs du classement. Il faut{' '}
                <b className="font-semibold text-creme">{COMBATS_MINIMUM} combats</b> minimum et
                un compte Discord lié pour être éligible.
              </p>
            </div>
          </div>
        </Enveloppe>
      </header>

      {/* ═════════════════════════ RECHERCHE ═════════════════════════ */}
      <div>
        <BarreOutils>
          <p className="flex items-center gap-2 font-mono text-[11px] tracking-[.12em] text-gris uppercase">
            {/*
              La pastille dit si le direct fonctionne. Verte et pulsante, les
              chiffres se rafraîchissent seuls ; grise, le sondage a échoué et
              ce qui est affiché date de la dernière lecture réussie. Sans
              elle, un visiteur ne pourrait pas distinguer « rien ne bouge
              parce que rien ne se passe » de « rien ne bouge parce que c'est
              cassé ».
            */}
            <span
              aria-hidden
              className={`inline-block size-1.5 rounded-full ${
                enDirect ? 'animate-pulse bg-vert' : 'bg-gris'
              }`}
            />
            {enDirect ? 'En direct' : 'Hors ligne'} · {lignes.length} joueur
            {lignes.length > 1 ? 's' : ''} classé{lignes.length > 1 ? 's' : ''}
          </p>
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

        <section className="pt-[clamp(30px,4vw,44px)] pb-section">
          <Enveloppe>
            {resultats.length === 0 ? (
              <EtatVide
                message={
                  filtre
                    ? 'Aucun joueur ne correspond à cette recherche.'
                    : 'Personne n’est encore classé cette saison. Lie ton compte Discord et lance-toi — les premières places sont à prendre.'
                }
                action={
                  filtre
                    ? { libelle: 'Réafficher le classement', onClick: () => setRecherche('') }
                    : undefined
                }
              />
            ) : (
              <>
                {/* ════════════════════════ PODIUM ════════════════════════ */}
                {surLePodium.length > 0 && (
                  <div className="grid gap-3.5 lg:grid-cols-3">
                    {surLePodium.map((ligne, index) => {
                      const marche = MARCHES[index]
                      const palier = palierDe(ligne.elo)

                      return (
                        <Link
                          key={ligne.uuid}
                          href={`/joueur/${encodeURIComponent(ligne.pseudo)}`}
                          className={`relative block overflow-hidden rounded-carte border p-6 transition-transform hover:-translate-y-0.5 ${marche.bordure} ${marche.fond}`}
                        >
                          <span
                            aria-hidden
                            className={`pointer-events-none absolute top-1 right-3 font-titre text-[92px] leading-none ${marche.chiffre}`}
                          >
                            {ligne.rang}
                          </span>

                          <div className="relative">
                            <p className="font-mono text-[11px] tracking-[.12em] uppercase" style={{ color: palier.couleur }}>
                              {palier.nom}
                            </p>
                            <div className="mt-2 flex items-center gap-2.5">
                              <Image
                                src={`https://mc-heads.net/avatar/${ligne.uuid}/32`}
                                alt=""
                                width={32}
                                height={32}
                                unoptimized
                                className="shrink-0 rounded-[3px]"
                              />
                              <h2 className={`truncate font-titre text-[22px] ${marche.nom}`}>
                                {ligne.pseudo}
                              </h2>
                            </div>
                            <p className="mt-3 font-titre text-[clamp(30px,4vw,40px)] leading-none text-creme">
                              {ligne.elo}
                              <span className="ml-1.5 font-mono text-[12px] font-normal text-gris">
                                Elo
                              </span>
                            </p>

                            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-bord pt-3.5 font-mono text-[11px]">
                              <div>
                                <dt className="text-gris">Combats</dt>
                                <dd className="mt-0.5 text-[13px] text-creme">{ligne.combats}</dd>
                              </div>
                              <div>
                                <dt className="text-gris">K/D</dt>
                                <dd className="mt-0.5 text-[13px] text-creme">
                                  {formaterRatio(ligne.kills, ligne.morts)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-gris">Record</dt>
                                <dd className="mt-0.5 text-[13px] text-creme">{ligne.recordSerie}</dd>
                              </div>
                            </dl>

                            {!ligne.eligible && (
                              <p className="mt-3 font-mono text-[11px] text-oni">
                                Pas encore éligible · {COMBATS_MINIMUM - ligne.combats} combats
                                restants
                              </p>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* ════════════════════════ TABLEAU ═══════════════════════ */}
                {dansLeTableau.length > 0 && (
                  <CadreTable className={surLePodium.length > 0 ? 'mt-3.5' : ''}>
                    <div className="max-lg:hidden">
                      <EnteteTable
                        colonnes={colonnesEntete}
                        libelles={['Rang', 'Joueur', 'Palier', 'Combats', 'K/D', 'Elo']}
                        alignerADroite={[3, 4, 5]}
                      />
                    </div>

                    <ol>
                      {visibles.map((ligne) => {
                        const palier = palierDe(ligne.elo)
                        const suivant = resteAvantSuivant(ligne.elo)

                        return (
                          <li
                            key={ligne.uuid}
                            className={`relative grid items-center gap-3 border-b border-bord px-4.5 py-[13px] transition-colors last:border-b-0 hover:bg-braise ${colonnesLigne}`}
                          >
                            <JaugeDeFond
                              pourcentage={((ligne.elo - PLANCHER) / meilleur) * 100}
                            />

                            <span
                              className={`relative font-mono text-[13px] ${
                                ligne.rang <= 3 ? 'font-bold text-or' : 'text-gris'
                              }`}
                            >
                              {ligne.rang}
                            </span>

                            <Link
                              href={`/joueur/${encodeURIComponent(ligne.pseudo)}`}
                              className="relative flex min-w-0 items-center gap-2.5"
                            >
                              <Image
                                src={`https://mc-heads.net/avatar/${ligne.uuid}/24`}
                                alt=""
                                width={24}
                                height={24}
                                unoptimized
                                className="shrink-0 rounded-[3px] max-lg:hidden"
                              />
                              <span className="min-w-0">
                              <span className="block truncate text-[15.5px] font-semibold transition-colors hover:text-or">
                                {ligne.pseudo}
                              </span>
                              {/*
                                Sous 1024px les trois colonnes de droite
                                disparaissent : le palier et la progression
                                passent alors sous le pseudo, sinon la ligne
                                ne dirait plus que « pseudo + Elo ».
                              */}
                              <span className="mt-0.5 block font-mono text-[11px] text-gris lg:hidden">
                                <span style={{ color: palier.couleur }}>{palier.nom}</span> ·{' '}
                                {ligne.combats} combats
                              </span>
                              </span>
                            </Link>

                            <span
                              className="relative max-lg:hidden font-mono text-[12px]"
                              style={{ color: palier.couleur }}
                            >
                              {palier.nom}
                            </span>

                            <span className="relative max-lg:hidden text-right font-mono text-[13px]">
                              <span className={ligne.eligible ? 'text-creme' : 'text-gris'}>
                                {ligne.combats}
                              </span>
                              {!ligne.eligible && (
                                <span className="block text-[10px] text-gris">
                                  /{COMBATS_MINIMUM}
                                </span>
                              )}
                            </span>

                            <span className="relative max-lg:hidden text-right font-mono text-[13px] text-gris">
                              {formaterRatio(ligne.kills, ligne.morts)}
                            </span>

                            <span className="relative text-right">
                              <span className="block font-mono text-[15px] font-bold text-soupe">
                                {ligne.elo}
                              </span>
                              {suivant && (
                                <span className="block font-mono text-[10px] text-gris max-lg:hidden">
                                  +{suivant.reste} → {suivant.palier.nom}
                                </span>
                              )}
                            </span>
                          </li>
                        )
                      })}
                    </ol>

                    {restantes > 0 && (
                      <button
                        type="button"
                        onClick={() => setLimite(lignes.length)}
                        className="w-full border-t border-bord bg-braise py-4 font-mono text-xs font-bold tracking-[.12em] text-soupe uppercase transition-colors hover:bg-bord"
                      >
                        Afficher les {restantes} suivants
                      </button>
                    )}
                  </CadreTable>
                )}

                <p className="mt-3.5 font-mono text-[11px] text-gris" aria-live="polite">
                  {resultats.length} joueur{resultats.length > 1 ? 's' : ''} affiché
                  {resultats.length > 1 ? 's' : ''}
                  {filtre && ` sur ${lignes.length}`}
                </p>
              </>
            )}
          </Enveloppe>
        </section>
      </div>
    </>
  )
}
