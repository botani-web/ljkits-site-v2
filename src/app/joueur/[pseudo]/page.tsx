import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CourbeElo } from '@/components/classement/CourbeElo'
import { PagePublique } from '@/components/public/PagePublique'
import { CadreTable, EnteteTable } from '@/components/ui/CadreTable'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { EtatVide } from '@/components/ui/EtatVide'
import { Section } from '@/components/ui/Section'
import {
  COMBATS_MINIMUM,
  formaterKit,
  lireAdversaires,
  lireCombatsJoueur,
  lireCourbeElo,
  lireFicheJoueur,
  lireSaisonCourante,
  lireStatsParKit,
  palierDe,
  resteAvantSuivant,
} from '@/lib/elo'
import { formaterDateHeure, formaterRatio } from '@/lib/format'
import { IMAGE_OG } from '@/lib/site'

/**
 * La fiche d'un joueur.
 *
 * Rendue à la demande puis revalidée : générer une page par joueur au build
 * serait absurde — la liste change à chaque saison, et la plupart ne seront
 * jamais consultées.
 */
export const revalidate = 60

type Params = { params: Promise<{ pseudo: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { pseudo } = await params
  const propre = decodeURIComponent(pseudo)

  return {
    title: `${propre} — Classement Elo`,
    description: `La fiche Elo de ${propre} sur LJKITS : rang, palier, combats, kits joués et derniers duels.`,
    alternates: { canonical: `/joueur/${propre}` },
    openGraph: {
      type: 'profile',
      title: `${propre} — LJKITS`,
      description: `Rang, palier et derniers combats de ${propre}.`,
      images: IMAGE_OG,
    },
  }
}

export default async function PageJoueur({ params }: Params) {
  const { pseudo } = await params
  const recherche = decodeURIComponent(pseudo)

  const saison = await lireSaisonCourante()
  if (!saison) notFound()

  const fiche = await lireFicheJoueur(recherche, saison.id)
  if (!fiche) notFound()

  const [combats, kits, adversaires, courbe] = await Promise.all([
    lireCombatsJoueur(fiche.uuid, saison.id, 20),
    lireStatsParKit(fiche.uuid, saison.id),
    lireAdversaires(fiche.uuid, saison.id),
    lireCourbeElo(fiche.uuid, saison.id, 40),
  ])

  const palier = palierDe(fiche.elo)
  const suivant = resteAvantSuivant(fiche.elo)

  return (
    <PagePublique>
      {/* ═══════════════════════════ EN-TÊTE ═══════════════════════════ */}
      <header className="halo-hero-gauche pt-[clamp(40px,5vw,64px)] pb-[clamp(24px,3vw,36px)]">
        <Enveloppe>
          <Link
            href="/classement"
            className="font-mono text-[11px] tracking-[.12em] text-gris uppercase transition-colors hover:text-or"
          >
            ← Retour au classement
          </Link>

          <div className="mt-5 grid items-center gap-[clamp(24px,4vw,48px)] lg:grid-cols-[168px_minmax(0,1fr)]">
            {/*
              Le corps entier plutôt que la tête : sur une fiche de joueur,
              c'est lui qu'on vient voir. `unoptimized` parce que mc-heads
              rend déjà une image petite et déjà mise en cache chez eux —
              la repasser par l'optimiseur de Next coûterait une invocation
              de fonction par joueur pour aucun gain.
            */}
            <div className="flex justify-center rounded-carte border border-bord bg-braise p-5 lg:justify-start">
              <Image
                src={`https://mc-heads.net/body/${fiche.uuid}/128`}
                alt={`Skin de ${fiche.pseudo}`}
                width={128}
                height={256}
                unoptimized
                className="h-auto w-[110px] lg:w-[128px]"
              />
            </div>

            <div>
              <p
                className="font-mono text-[12px] tracking-[.14em] uppercase"
                style={{ color: palier.couleur }}
              >
                {palier.nom}
                {fiche.rang > 0 && <span className="text-gris"> · #{fiche.rang}</span>}
              </p>

              <h1 className="text-h1 mt-2 font-titre break-words">{fiche.pseudo}</h1>

              <p className="mt-3 font-titre text-[clamp(38px,6vw,58px)] leading-none text-creme">
                {fiche.elo}
                <span className="ml-2 font-mono text-[13px] font-normal text-gris">Elo</span>
              </p>

              {suivant ? (
                <p className="mt-2.5 text-sm text-gris">
                  Plus que <b className="font-semibold text-creme">{suivant.reste} Elo</b> avant{' '}
                  <span style={{ color: suivant.palier.couleur }}>{suivant.palier.nom}</span>
                </p>
              ) : (
                <p className="mt-2.5 text-sm text-or">Palier maximum atteint.</p>
              )}

              {/* Les deux conditions d'éligibilité, dites explicitement. */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Pilule
                  vrai={fiche.lie}
                  vraiTexte="Compte Discord lié"
                  fauxTexte="Compte Discord non lié · hors classement"
                />
                <Pilule
                  vrai={fiche.eligible}
                  vraiTexte={`${fiche.combats} combats · éligible au cashprize`}
                  fauxTexte={`${fiche.combats}/${COMBATS_MINIMUM} combats · pas encore éligible`}
                />
              </div>
            </div>
          </div>
        </Enveloppe>
      </header>

      {/* ═══════════════════════════ LES CHIFFRES ═══════════════════════════ */}
      <Enveloppe className="pb-[clamp(30px,4vw,44px)]">
        <div className="grid gap-3 min-[520px]:grid-cols-3 lg:grid-cols-6">
          <Chiffre valeur={fiche.kills} libelle="Kills" />
          <Chiffre valeur={fiche.morts} libelle="Morts" />
          <Chiffre valeur={formaterRatio(fiche.kills, fiche.morts)} libelle="Ratio K/D" />
          <Chiffre valeur={fiche.serie} libelle="Série en cours" />
          <Chiffre valeur={fiche.recordSerie} libelle="Record de série" />
          <Chiffre valeur={fiche.eloMax} libelle="Meilleur Elo" accent />
        </div>

        {courbe.length >= 3 && (
          <div className="mt-3.5 rounded-carte border border-bord bg-braise p-6">
            <p className="font-mono text-[11px] tracking-[.12em] text-gris uppercase">
              Progression sur les {courbe.length} derniers combats
            </p>
            <CourbeElo points={courbe} className="mt-4" />
          </div>
        )}
      </Enveloppe>

      {/* ═══════════════════════════ LES KITS ═══════════════════════════ */}
      {kits.length > 0 && (
        <Section
          fond="charbon"
          etiquette="Ses kits"
          titre={
            <>
              Avec quoi il <span className="text-or">gagne</span>
            </>
          }
          chapeau="Les kits les plus joués cette saison, et ce qu’ils rapportent vraiment."
        >
          <div className="grid gap-3 min-[560px]:grid-cols-2 lg:grid-cols-4">
            {kits.map((kit) => (
              <div key={kit.kit} className="rounded-carte border border-bord bg-braise p-5">
                <h3 className="font-titre text-[16px]">{formaterKit(kit.kit)}</h3>
                <p className="mt-2.5 font-titre text-[26px] leading-none text-or">{kit.taux}%</p>
                <p className="mt-1 font-mono text-[11px] text-gris">de victoires</p>

                {/* La barre dit la même chose que le pourcentage, en un coup d'œil. */}
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bord">
                  <div className="h-full bg-vert" style={{ width: `${kit.taux}%` }} />
                </div>

                <p className="mt-2.5 font-mono text-[11px] text-gris">
                  <span className="text-vert">{kit.victoires}V</span>
                  {' · '}
                  <span className="text-oni">{kit.defaites}D</span>
                  {' · '}
                  {kit.total} combats
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══════════════════════ LES ADVERSAIRES ═══════════════════════ */}
      {adversaires.length > 0 && (
        <Section
          etiquette="Face-à-face"
          titre={
            <>
              Ses <span className="text-or">adversaires</span>
            </>
          }
          chapeau="Les joueurs qu’il croise le plus souvent, et qui mène."
        >
          <div className="grid gap-3 min-[560px]:grid-cols-2 lg:grid-cols-5">
            {adversaires.map((adversaire) => {
              const mene = adversaire.victoires > adversaire.defaites
              const egalite = adversaire.victoires === adversaire.defaites

              return (
                <Link
                  key={adversaire.pseudo}
                  href={`/joueur/${encodeURIComponent(adversaire.pseudo)}`}
                  className="group rounded-carte border border-bord bg-braise p-5 transition-colors hover:border-soupe"
                >
                  <div className="flex items-center gap-2.5">
                    <Image
                      src={`https://mc-heads.net/avatar/${encodeURIComponent(adversaire.pseudo)}/32`}
                      alt=""
                      width={32}
                      height={32}
                      unoptimized
                      className="rounded-[3px]"
                    />
                    <span className="truncate text-[14px] font-semibold transition-colors group-hover:text-or">
                      {adversaire.pseudo}
                    </span>
                  </div>

                  <p className="mt-3 font-mono text-[15px]">
                    <span className="font-bold text-vert">{adversaire.victoires}</span>
                    <span className="text-gris"> — </span>
                    <span className="font-bold text-oni">{adversaire.defaites}</span>
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-gris">
                    {egalite ? 'à égalité' : mene ? 'il mène' : 'il est mené'}
                  </p>
                </Link>
              )
            })}
          </div>
        </Section>
      )}

      {/* ═══════════════════════ LES DERNIERS COMBATS ═══════════════════════ */}
      <Section
        fond={adversaires.length > 0 ? 'charbon' : 'nuit'}
        etiquette="Historique"
        titre={
          <>
            Ses derniers <span className="text-or">combats</span>
          </>
        }
      >
        {combats.length === 0 ? (
          <EtatVide message="Aucun combat classé cette saison." />
        ) : (
          <CadreTable fond="braise">
            <div className="max-lg:hidden">
              <EnteteTable
                colonnes="90px minmax(0,1fr) 140px 140px 80px 92px"
                libelles={['Issue', 'Adversaire', 'Son kit', 'Ton kit', 'Elo', 'Après']}
                alignerADroite={[4, 5]}
              />
            </div>

            <ol>
              {combats.map((combat) => (
                <li
                  key={combat.id}
                  className="grid items-center gap-3 border-b border-bord px-4.5 py-[13px] last:border-b-0 max-lg:grid-cols-[minmax(0,1fr)_80px] lg:grid-cols-[90px_minmax(0,1fr)_140px_140px_80px_92px]"
                >
                  <span className="max-lg:hidden font-mono text-[11px] font-bold tracking-[.1em] uppercase">
                    <span className={combat.victoire ? 'text-vert' : 'text-oni'}>
                      {combat.victoire ? 'Victoire' : 'Défaite'}
                    </span>
                  </span>

                  <span className="min-w-0">
                    <Link
                      href={`/joueur/${encodeURIComponent(combat.adversaire)}`}
                      className="block truncate text-[15px] font-semibold transition-colors hover:text-or"
                    >
                      <span className={`lg:hidden ${combat.victoire ? 'text-vert' : 'text-oni'}`}>
                        {combat.victoire ? '▲ ' : '▼ '}
                      </span>
                      {combat.adversaire}
                    </Link>
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-gris lg:hidden">
                      {formaterKit(combat.monKit)} contre {formaterKit(combat.sonKit)}
                    </span>
                  </span>

                  <span className="max-lg:hidden font-mono text-[12px] text-gris">
                    {formaterKit(combat.sonKit)}
                  </span>
                  <span className="max-lg:hidden font-mono text-[12px] text-gris">
                    {formaterKit(combat.monKit)}
                  </span>

                  <span
                    className={`text-right font-mono text-[14px] font-bold ${
                      combat.delta >= 0 ? 'text-vert' : 'text-oni'
                    }`}
                  >
                    {combat.delta >= 0 ? `+${combat.delta}` : combat.delta}
                  </span>

                  <span className="max-lg:hidden text-right font-mono text-[12px] text-gris">
                    {combat.eloApres}
                    <span className="block text-[10px] text-gris/70">
                      {formaterDateHeure(combat.instant)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </CadreTable>
        )}

        <p className="mt-3.5 font-mono text-[11px] text-gris">
          Fiche à jour au {formaterDateHeure(fiche.derniereMaj)} · saison {saison.nom}
        </p>
      </Section>
    </PagePublique>
  )
}

/* ────────────────────────────── morceaux ────────────────────────────── */

function Chiffre({
  valeur,
  libelle,
  accent = false,
}: {
  valeur: number | string
  libelle: string
  accent?: boolean
}) {
  return (
    <div className="rounded-carte border border-bord bg-braise p-4.5">
      <p
        className={`font-titre text-[clamp(22px,3vw,28px)] leading-none ${
          accent ? 'text-or' : 'text-creme'
        }`}
      >
        {valeur}
      </p>
      <p className="mt-2 font-mono text-[11px] tracking-[.1em] text-gris uppercase">{libelle}</p>
    </div>
  )
}

function Pilule({
  vrai,
  vraiTexte,
  fauxTexte,
}: {
  vrai: boolean
  vraiTexte: string
  fauxTexte: string
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1.5 font-mono text-[11px] ${
        vrai ? 'border-vert/40 bg-vert/10 text-vert' : 'border-oni/40 bg-oni/10 text-oni'
      }`}
    >
      {vrai ? '✔ ' : '✖ '}
      {vrai ? vraiTexte : fauxTexte}
    </span>
  )
}
