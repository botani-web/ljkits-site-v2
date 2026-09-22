import type { Metadata } from 'next'
import Link from 'next/link'

import { CompteRebours } from '@/components/accueil/CompteRebours'
import { NombreEnLigne } from '@/components/accueil/EnLigne'
import { DerniersMatchs } from '@/components/practice/DerniersMatchs'
import { Podium } from '@/components/practice/Podium'
import { BoutonIpGeant } from '@/components/public/CopieIp'
import { IconeDiscord } from '@/components/public/IconeDiscord'
import { PagePublique } from '@/components/public/PagePublique'
import { LienFleche } from '@/components/ui/Badge'
import { classesBouton, LienBouton } from '@/components/ui/Bouton'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { EtatVide } from '@/components/ui/EtatVide'
import { CaseCloisonnee, GrilleCloisonnee } from '@/components/ui/GrilleCloisonnee'
import { BlocFinal, Section } from '@/components/ui/Section'
import { Etiquette } from '@/components/ui/TeteSection'
import { lireSaisonCourante } from '@/lib/elo'
import { formaterOuverture, formaterOuvertureEnPhrase } from '@/lib/format'
import { estLocale, LANGUE_DEFAUT, lien, t, type CleTexte, type Locale } from '@/lib/i18n'
import { nomPalier, palierDe, PALIERS } from '@/lib/paliers'
import {
  lireChiffres,
  lireClassement,
  lireDerniersMatchs,
  lireLeadersParMode,
  type ChiffresSaison,
  type LeaderMode,
  type LigneClassement,
  type MatchRecent,
} from '@/lib/practice'
import { cheminProfil, MODES, urlTete } from '@/lib/practice-commun'
import { prisma } from '@/lib/prisma'
import { lireReglages } from '@/lib/reglages'
import { CASHPRIZE, euros, saisonDu } from '@/lib/saison'
import { CLASSEMENT_OUVERT, IMAGE_OG } from '@/lib/site'

/**
 * L'ACCUEIL, TOURNÉ COMPÉTITION (22/09/2026).
 *
 * Ce qui fait venir les joueurs, c'est le cashprize : il est donc partout.
 * La cagnotte et le compte à rebours de la clôture dans le hero, le podium
 * EN DIRECT (qui toucherait l'argent si la saison finissait maintenant), les
 * quatre étapes pour y prétendre, les modes, l'échelle des paliers, ce qui
 * rend la compétition honnête — et le FFA relégué à ce qu'il est devenu :
 * la salle d'attente.
 *
 * Les chiffres bougent à chaque match : la page est régénérée au plus toutes
 * les minutes (quelques SELECT légers, ceux du classement). Le compte à
 * rebours et les joueurs en ligne, eux, vivent dans le navigateur.
 */
export const revalidate = 60

/** Le podium + les poursuivants affichés sous lui. */
const TAILLE_TOP = 8

const MEDAILLES = ['var(--color-or)', 'var(--color-argent)', 'var(--color-bronze)'] as const
const PLACES: CleTexte[] = ['ac.place-1', 'ac.place-2', 'ac.place-3']

type Props = { params: Promise<{ locale: string }> }

async function lireLocale(params: Props['params']): Promise<Locale> {
  const { locale } = await params
  return estLocale(locale) ? locale : LANGUE_DEFAUT
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await lireLocale(params)
  const cagnotte = euros(CASHPRIZE.total, locale)
  const titre = t(locale, 'ac.meta-titre').replace('{c}', cagnotte)
  const description = t(locale, 'ac.meta-desc').replace('{c}', cagnotte)
  return {
    title: { absolute: titre },
    description,
    alternates: { languages: { en: '/en', fr: '/fr' } },
    openGraph: { title: titre, description, images: IMAGE_OG },
  }
}

export default async function Accueil({ params }: Props) {
  const locale = await lireLocale(params)

  const [nombreKits, saisonBase, reglages] = await Promise.all([
    prisma.kit.count({ where: { visible: true } }),
    lireSaisonCourante(),
    lireReglages(),
  ])

  // Hors saison ouverte (ou classement du site fermé), les blocs en direct
  // disparaissent au lieu d'afficher des cadres vides. La cagnotte reste.
  let top: LigneClassement[] = []
  let chiffres: ChiffresSaison | null = null
  let derniers: MatchRecent[] = []
  let leaders: LeaderMode[] = []
  if (saisonBase && CLASSEMENT_OUVERT) {
    ;[top, chiffres, derniers, leaders] = await Promise.all([
      lireClassement(saisonBase.id, 'global', TAILLE_TOP),
      lireChiffres(saisonBase.id),
      lireDerniersMatchs(saisonBase.id, 6),
      lireLeadersParMode(saisonBase.id),
    ])
  }

  const saison = saisonDu()
  const cagnotte = euros(CASHPRIZE.total, locale)
  const prix = CASHPRIZE.podium.map((montant) => euros(montant, locale))
  const clotureCourte = formaterOuverture(saison.fin, locale)
  const clotureEnPhrase = formaterOuvertureEnPhrase(saison.fin, locale)
  const numero = String(saison.numero)

  const poursuivants = top.slice(3)
  const eloTroisieme = top[2]?.elo ?? 0

  return (
    <PagePublique locale={locale}>
      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <header className="halo-hero pt-[clamp(40px,6vw,88px)] pb-[clamp(44px,6vw,84px)]">
        <Enveloppe>
          <div className="grid items-center gap-[clamp(36px,5vw,72px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,450px)]">
            <div>
              <p className="inline-flex items-center gap-2.5 rounded-micro border border-bord bg-charbon/70 px-3 py-1.5 font-mono text-[10.5px] font-bold tracking-[.18em] text-soupe uppercase">
                <span aria-hidden className="pastille-statut" />
                {t(locale, 'ac.etiquette').replace('{n}', numero)}
              </p>

              <h1 className="mt-5.5 font-titre text-[clamp(38px,6.2vw,74px)] leading-[.94] tracking-[-.02em] text-balance">
                {t(locale, 'ac.h1-1')}
                <br />
                {t(locale, 'ac.h1-2')}{' '}
                <span className="text-or [text-shadow:0_0_42px_rgb(253_192_3/.35)]">{cagnotte}</span>.
              </h1>

              <p className="mt-5.5 max-w-[54ch] text-[clamp(16px,1.9vw,19px)] text-gris">
                {avecGras(t(locale, 'ac.chapo'), cagnotte)}
              </p>

              <div className="mt-8 flex flex-wrap items-stretch gap-2.75">
                <BoutonIpGeant className="max-[560px]:w-full max-[560px]:justify-center" />
                <a
                  href={reglages.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classesBouton({ variante: 'plein', taille: 'grande', className: 'max-[560px]:w-full' })}
                >
                  <IconeDiscord className="size-4 shrink-0 fill-current" />
                  {t(locale, 'commande.rejoindre-discord')}
                </a>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                <LienFleche href={lien(locale, '/classement')}>{t(locale, 'ac.voir-classement')}</LienFleche>
                <span className="font-mono text-[11px] tracking-[.06em] text-gris">{t(locale, 'ac.garanties')}</span>
              </div>
            </div>

            {/* La cagnotte : le montant, qui le toucherait aujourd'hui, et quand. */}
            <aside
              aria-labelledby="cagnotte-titre"
              className="relative overflow-hidden rounded-bloc border border-or/35 bg-charbon/90 shadow-[0_34px_90px_-34px_rgb(253_192_3/.4)] backdrop-blur"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--color-or),transparent)]" />
              <span
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-[radial-gradient(circle,rgb(253_192_3/.16),transparent_68%)]"
              />

              <div className="relative px-5.5 pt-5.5 pb-5 sm:px-7">
                <div className="flex items-center justify-between gap-3">
                  <p id="cagnotte-titre" className="font-mono text-[11px] font-bold tracking-[.22em] text-or uppercase">
                    {t(locale, 'ac.cagnotte-etiquette').replace('{n}', numero)}
                  </p>
                  <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[.16em] text-vert uppercase">
                    <span aria-hidden className="pastille-statut" />
                    {t(locale, 'ac.live')}
                  </span>
                </div>
                <p className="mt-3.5 font-titre text-[clamp(64px,10vw,108px)] leading-[.86] text-or [text-shadow:0_0_48px_rgb(253_192_3/.35)]">
                  {cagnotte}
                </p>
                <p className="mt-3 text-[14px] text-gris">{t(locale, 'ac.cagnotte-sous')}</p>
              </div>

              <ol className="relative border-y border-bord bg-nuit/40">
                {prix.map((montant, index) => (
                  <LigneCagnotte
                    key={index}
                    place={t(locale, PLACES[index])}
                    couleur={MEDAILLES[index]}
                    ligne={top[index]}
                    montant={montant}
                    locale={locale}
                  />
                ))}
              </ol>

              <div className="relative px-5.5 pt-4.5 pb-5.5 sm:px-7">
                <p className="mb-2.5 font-mono text-[10.5px] font-bold tracking-[.18em] text-gris uppercase">
                  {t(locale, 'ac.cloture-dans')}
                </p>
                <CompteRebours fin={saison.fin.toISOString()} dateLisible={clotureEnPhrase} />
                <p className="mt-3 font-mono text-[11px] text-gris">
                  {t(locale, 'ac.cloture-le').replace('{d}', clotureCourte)}
                </p>
              </div>
            </aside>
          </div>
        </Enveloppe>
      </header>

      {/* ═════════════════════════ LES CHIFFRES ═════════════════════════ */}
      {chiffres && (
        <GrilleCloisonnee pleineLargeur colonnes="grid-cols-2 lg:grid-cols-4">
          <Chiffre libelle={t(locale, 'ac.chiffre-en-ligne')} vivant>
            <NombreEnLigne />
          </Chiffre>
          <Chiffre libelle={t(locale, 'ac.chiffre-classes')}>{chiffres.joueurs}</Chiffre>
          <Chiffre libelle={t(locale, 'ac.chiffre-matchs')}>{chiffres.matchs}</Chiffre>
          <Chiffre libelle={t(locale, 'ac.chiffre-24h')}>{chiffres.matchs24h}</Chiffre>
        </GrilleCloisonnee>
      )}

      {/* ═════════════════════════ LE PODIUM EN DIRECT ═════════════════════════ */}
      {chiffres && (
        <Section
          id="podium"
          etiquette={
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="pastille-statut" />
              {t(locale, 'ac.podium-etiquette')}
            </span>
          }
          titre={
            <>
              {t(locale, 'ac.podium-titre-1')} <span className="text-or">{t(locale, 'ac.podium-titre-2')}</span>
            </>
          }
          chapeau={t(locale, 'ac.podium-chapeau').replace('{c}', cagnotte)}
        >
          {top.length === 0 ? (
            <EtatVide message={t(locale, 'ac.podium-vide')} />
          ) : (
            <Podium lignes={top} locale={locale} cashprize={prix} />
          )}

          {poursuivants.length > 0 && (
            <div className="mt-6 grid gap-5 rounded-carte border border-bord bg-charbon p-5 sm:p-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-center lg:gap-8">
              <div>
                <h3 className="font-titre text-[19px]">{t(locale, 'ac.poursuivants')}</h3>
                <p className="mt-2 text-[14.5px] text-gris">
                  {t(locale, 'ac.poursuivants-texte').replace('{p}', prix[2])}
                </p>
                <LienFleche href={lien(locale, '/classement')} className="mt-3.5">
                  {t(locale, 'classement.complet')}
                </LienFleche>
              </div>
              <ol className="divide-y divide-bord overflow-hidden rounded-carte border border-bord bg-braise">
                {poursuivants.map((ligne) => (
                  <li key={ligne.uuid}>
                    <Link
                      href={lien(locale, cheminProfil(ligne.pseudo))}
                      className="grid grid-cols-[34px_minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-2.75 transition-colors hover:bg-bord/40"
                    >
                      <span className="font-mono text-[12.5px] text-gris">#{ligne.rang}</span>
                      <span className="flex min-w-0 items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={urlTete(ligne.pseudo, 32)}
                          alt=""
                          width={24}
                          height={24}
                          loading="lazy"
                          className="shrink-0 rounded-micro [image-rendering:pixelated]"
                        />
                        <span className="truncate text-[14.5px] font-semibold">{ligne.pseudo}</span>
                      </span>
                      <span className="font-mono text-[13px] font-bold tabular-nums" style={{ color: palierDe(ligne.elo).couleur }}>
                        {ligne.elo}
                      </span>
                      <span className="min-w-[88px] text-right font-mono text-[11px] text-gris max-[420px]:min-w-0">
                        <span className="text-oni">−{Math.max(0, eloTroisieme - ligne.elo)}</span>{' '}
                        <span className="max-[420px]:hidden">{t(locale, 'ac.du-podium')}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Section>
      )}

      {/* ═════════════════════════ COMMENT GAGNER ═════════════════════════ */}
      <Section
        fond="charbon"
        id="gagner"
        etiquette={t(locale, 'ac.etapes-etiquette')}
        titre={
          <>
            {t(locale, 'ac.etapes-titre-1')} <span className="text-or">{t(locale, 'ac.etapes-titre-2')}</span>
          </>
        }
      >
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPES.map((etape, index) => (
            <li key={etape.titre} className="relative overflow-hidden rounded-carte border border-bord bg-braise p-6">
              <span
                aria-hidden
                className={`absolute inset-x-0 top-0 h-[3px] ${index === ETAPES.length - 1 ? 'bg-or' : 'bg-soupe/70'}`}
              />
              <span aria-hidden className="font-titre text-[40px] leading-none text-soupe/85">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className={`mt-4 font-titre text-[18px] ${index === ETAPES.length - 1 ? 'text-or' : ''}`}>
                {t(locale, etape.titre)}
              </h3>
              <p className="mt-2.5 text-[14.5px] text-gris">
                {index === 0
                  ? avecGras(t(locale, etape.texte), reglages.ip, '{ip}', 'font-mono text-or')
                  : t(locale, etape.texte)}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-carte border border-or/30 bg-or/6 px-5 py-3.5">
          <p className="font-mono text-[11.5px] tracking-[.04em] text-creme">{t(locale, 'ac.versement')}</p>
          <LienFleche href={`${lien(locale, '/reglement')}#cashprize`}>{t(locale, 'ac.regles-cashprize')}</LienFleche>
        </div>
      </Section>

      {/* ═════════════════════════ LES MODES ═════════════════════════ */}
      <Section
        id="modes"
        etiquette={t(locale, 'ac.modes-etiquette')}
        titre={
          <>
            {t(locale, 'ac.modes-titre-1')} <span className="text-or">{t(locale, 'ac.modes-titre-2')}</span>
          </>
        }
        chapeau={t(locale, 'ac.modes-chapeau')}
      >
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((mode) => {
            const leader = leaders.find((l) => l.mode === mode.id)
            const classes = chiffres?.classesParMode[mode.id] ?? 0
            return (
              <li key={mode.id}>
                <Link
                  href={lien(locale, `/classement?mode=${mode.id}`)}
                  className="group relative flex h-full flex-col overflow-hidden rounded-carte border border-bord bg-charbon p-6 transition-[border-color,transform,background] duration-[.18s] hover:-translate-y-0.5 hover:border-(--teinte) hover:bg-braise"
                  style={{ ['--teinte' as string]: mode.couleur }}
                >
                  <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: mode.couleur }} />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-20 -right-20 size-48 rounded-full opacity-60 transition-opacity group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle, ${mode.couleur}26, transparent 70%)` }}
                  />
                  <div className="relative flex items-baseline justify-between gap-3">
                    <h3 className="font-titre text-[23px] leading-none" style={{ color: mode.couleur }}>
                      {mode.nom}
                    </h3>
                    {classes > 0 && (
                      <span className="font-mono text-[10.5px] tracking-[.1em] text-gris uppercase">
                        {t(locale, 'ac.mode-classes').replace('{n}', String(classes))}
                      </span>
                    )}
                  </div>
                  <p className="relative mt-3.5 flex-1 text-[14.5px] text-gris">{t(locale, DESCRIPTIONS_MODES[mode.id])}</p>
                  <div className="relative mt-5 flex items-center gap-2.5 border-t border-bord pt-4">
                    {leader ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={urlTete(leader.pseudo, 32)}
                          alt=""
                          width={26}
                          height={26}
                          loading="lazy"
                          className="shrink-0 rounded-micro [image-rendering:pixelated]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-[9.5px] tracking-[.16em] text-or uppercase">
                            {t(locale, 'ac.numero-1')}
                          </span>
                          <span className="block truncate text-[14px] font-semibold">{leader.pseudo}</span>
                        </span>
                        <span className="font-mono text-[13px] font-bold tabular-nums" style={{ color: palierDe(leader.elo).couleur }}>
                          {leader.elo}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono text-[11px] text-gris">{t(locale, 'ac.mode-personne')}</span>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* ═════════════════════════ L'ÉCHELLE DES PALIERS ═════════════════════════ */}
      <Section
        fond="charbon"
        id="paliers"
        etiquette={t(locale, 'ac.paliers-etiquette')}
        titre={
          <>
            {t(locale, 'ac.paliers-titre')}{' '}
            <span className="text-oni">{nomPalier(PALIERS[PALIERS.length - 1], locale)}</span>
          </>
        }
        chapeau={
          <>
            {t(locale, 'ac.paliers-chapeau')}
            {top[0] && (
              <>
                {' '}
                {t(locale, 'ac.paliers-leader')
                  .replace('{p}', `${top[0].pseudo} (${nomPalier(palierDe(top[0].elo), locale)}, ${top[0].elo})`)
                  .replace('{m}', String(PALIERS[PALIERS.length - 1].minimum))}
              </>
            )}
          </>
        }
      >
        <Echelle leader={top[0]} locale={locale} />
      </Section>

      {/* ═════════════════════════ UNE COMPÉTITION PROPRE ═════════════════════════ */}
      <Section
        id="merite"
        etiquette={t(locale, 'ac.merite-etiquette')}
        titre={
          <>
            {t(locale, 'ac.merite-titre-1')} <span className="text-or">{t(locale, 'ac.merite-titre-2')}</span>
          </>
        }
      >
        <GrilleCloisonnee colonnes="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {GARANTIES.map((garantie) => (
            <CaseCloisonnee key={garantie.valeur} className="px-6 py-6.5">
              <p className={`font-titre text-[clamp(20px,2.4vw,25px)] leading-tight ${garantie.oni ? 'text-oni' : 'text-or'}`}>
                {t(locale, garantie.valeur)}
              </p>
              <p className="mt-2.75 text-[14.5px] text-gris">{t(locale, garantie.texte)}</p>
            </CaseCloisonnee>
          ))}
        </GrilleCloisonnee>
      </Section>

      {/* ═════════════════════════ EN DIRECT ═════════════════════════ */}
      <DerniersMatchs matchs={derniers} locale={locale} />

      {/* ═════════════════════════ LE FFA, SALLE D'ATTENTE ═════════════════════════ */}
      <section className="pt-section">
        <Enveloppe>
          <div className="grid items-center gap-6 rounded-bloc border border-bord bg-charbon p-6 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-10">
            <p className="flex items-baseline gap-2.5 lg:flex-col lg:items-start lg:gap-1">
              <span className="font-titre text-[clamp(48px,6vw,68px)] leading-none text-soupe">{nombreKits}</span>
              <span className="font-mono text-[11px] font-bold tracking-[.22em] text-gris uppercase">{t(locale, 'ac.ffa-kits')}</span>
            </p>
            <div>
              <Etiquette>{t(locale, 'ac.ffa-etiquette')}</Etiquette>
              <h2 className="mt-2.5 font-titre text-[clamp(21px,2.8vw,30px)] leading-[1.08]">
                {t(locale, 'ac.ffa-titre-1')} <span className="text-or">{t(locale, 'ac.ffa-titre-2')}</span>
              </h2>
              <p className="mt-3 max-w-[64ch] text-[15px] text-gris">
                {t(locale, 'ac.ffa-texte').replace('{n}', String(nombreKits))}
              </p>
            </div>
            <LienBouton href={lien(locale, '/kits')} variante="vide" className="max-lg:justify-self-start">
              {t(locale, 'ac.ffa-lien')} <span aria-hidden="true">→</span>
            </LienBouton>
          </div>
        </Enveloppe>
      </section>

      {/* ═════════════════════════════ APPEL ═════════════════════════════ */}
      <BlocFinal
        etiquette={t(locale, 'ac.final-etiquette').replace('{n}', numero).replace('{d}', clotureEnPhrase)}
        titre={
          <>
            {t(locale, 'ac.final-1')} <span className="text-or">{t(locale, 'ac.final-2')}</span>.
          </>
        }
        chapeau={t(locale, 'ac.final-chapeau')}
      >
        <div className="mx-auto max-w-[380px]">
          <CompteRebours fin={saison.fin.toISOString()} dateLisible={clotureEnPhrase} compact />
        </div>
        <div className="mt-7 flex flex-wrap items-stretch justify-center gap-2.75">
          <BoutonIpGeant className="max-[560px]:w-full max-[560px]:justify-center" />
          <a
            href={reglages.discord}
            target="_blank"
            rel="noopener noreferrer"
            className={classesBouton({ variante: 'vide', taille: 'grande', className: 'max-[560px]:w-full' })}
          >
            <IconeDiscord className="size-4 shrink-0 fill-current" />
            {t(locale, 'commande.rejoindre-discord')}
          </a>
        </div>
        <p className="mt-4 font-mono text-[11.5px] text-gris">{t(locale, 'ac.final-ip')}</p>
      </BlocFinal>
    </PagePublique>
  )
}

/* -------------------------------------------------------------------------- */
/* Contenu et composants locaux : ils ne servent qu'à cette page.              */
/* -------------------------------------------------------------------------- */

/**
 * Met en gras la valeur qui remplace `jeton` dans une phrase traduite.
 * Le dictionnaire garde la phrase entière — l'ordre des mots change d'une
 * langue à l'autre — et c'est ici qu'on la coupe autour du jeton.
 */
function avecGras(phrase: string, valeur: string, jeton = '{c}', classes = 'font-semibold text-creme') {
  const [avant, ...apres] = phrase.split(jeton)
  if (apres.length === 0) return phrase
  return (
    <>
      {avant}
      <b className={classes}>{valeur}</b>
      {apres.join(valeur)}
    </>
  )
}

const ETAPES: { titre: CleTexte; texte: CleTexte }[] = [
  { titre: 'ac.etape1-titre', texte: 'ac.etape1' },
  { titre: 'ac.etape2-titre', texte: 'ac.etape2' },
  { titre: 'ac.etape3-titre', texte: 'ac.etape3' },
  { titre: 'ac.etape4-titre', texte: 'ac.etape4' },
]

const DESCRIPTIONS_MODES: Record<(typeof MODES)[number]['id'], CleTexte> = {
  hg: 'ac.mode-hg',
  digger: 'ac.mode-digger',
  boxing: 'ac.mode-boxing',
  ironsoup: 'ac.mode-ironsoup',
}

const GARANTIES: { valeur: CleTexte; texte: CleTexte; oni?: boolean }[] = [
  { valeur: 'ac.merite-kit-v', texte: 'ac.merite-kit' },
  { valeur: 'ac.merite-mm-v', texte: 'ac.merite-mm' },
  { valeur: 'ac.merite-farm-v', texte: 'ac.merite-farm', oni: true },
  { valeur: 'ac.merite-ac-v', texte: 'ac.merite-ac', oni: true },
]

/** Une ligne de la cagnotte du hero : la place, qui l'occupe, ce qu'elle rapporte. */
function LigneCagnotte({
  place,
  couleur,
  ligne,
  montant,
  locale,
}: {
  place: string
  couleur: string
  ligne: LigneClassement | undefined
  montant: string
  locale: Locale
}) {
  return (
    <li className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b border-bord px-5.5 py-3 last:border-b-0 sm:px-7">
      <span className="font-titre text-[17px] leading-none" style={{ color: couleur }}>
        {place}
      </span>
      {ligne ? (
        <Link href={lien(locale, cheminProfil(ligne.pseudo))} className="flex min-w-0 items-center gap-2.5 transition-colors hover:text-or">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urlTete(ligne.pseudo, 32)}
            alt=""
            width={28}
            height={28}
            className="shrink-0 rounded-micro [image-rendering:pixelated]"
          />
          <span className="min-w-0">
            <span className="block truncate text-[15px] leading-tight font-semibold">{ligne.pseudo}</span>
            <span className="block font-mono text-[11px] tabular-nums" style={{ color: palierDe(ligne.elo).couleur }}>
              {ligne.elo} Elo
            </span>
          </span>
        </Link>
      ) : (
        <span className="font-mono text-[12px] text-gris italic">{t(locale, 'ac.place-libre')}</span>
      )}
      <span className="rounded-micro border border-or/45 bg-or/10 px-2.5 py-1 font-mono text-[14px] font-bold text-or tabular-nums">
        {montant}
      </span>
    </li>
  )
}

/** Une case du bandeau de chiffres. `vivant` = la pastille verte des données en direct. */
function Chiffre({ libelle, vivant = false, children }: { libelle: string; vivant?: boolean; children: React.ReactNode }) {
  return (
    <CaseCloisonnee className="px-gouttiere py-6">
      <p className="flex items-center gap-2.5 font-titre text-[clamp(26px,3.6vw,40px)] leading-none tabular-nums">
        {vivant && <span aria-hidden className="pastille-statut" />}
        {children}
      </p>
      <p className="mt-2.5 font-mono text-[11px] tracking-[.08em] text-gris">{libelle}</p>
    </CaseCloisonnee>
  )
}

/**
 * L'échelle des dix paliers, à largeur égale, avec deux repères : le départ
 * (1000) sous la barre et le n°1 de la saison au-dessus. Les paliers que
 * personne n'a encore atteints sont éteints.
 *
 * Fer va de 0 à 1099, mais personne ne descend sous le plancher de 800 : sa
 * case est mesurée de 800 à 1100, sinon le départ serait collé à son bord droit.
 */
function Echelle({ leader, locale }: { leader: LigneClassement | undefined; locale: Locale }) {
  const indexLeader = leader ? PALIERS.indexOf(palierDe(leader.elo)) : -1

  return (
    <div>
      <div className="relative pt-14 pb-12">
        {leader && (
          <Repere position={positionSurEchelle(leader.elo)} cote="haut">
            <span className="text-or">{t(locale, 'ac.numero-1')}</span> · {leader.pseudo} ·{' '}
            <span style={{ color: palierDe(leader.elo).couleur }}>{leader.elo}</span>
          </Repere>
        )}
        <div className="flex h-3.5 gap-[3px]" aria-hidden>
          {PALIERS.map((palier, index) => (
            <span
              key={palier.nom}
              className="flex-1 first:rounded-l-full last:rounded-r-full"
              style={{ background: palier.couleur, opacity: indexLeader >= 0 && index > indexLeader ? 0.22 : 1 }}
            />
          ))}
        </div>
        <Repere position={positionSurEchelle(1000)} cote="bas">
          {t(locale, 'ac.depart')} · 1000
        </Repere>
      </div>

      <ol className="grid grid-cols-2 gap-x-4 gap-y-4 min-[480px]:grid-cols-5 lg:grid-cols-10">
        {PALIERS.map((palier, index) => (
          <li key={palier.nom} className={indexLeader >= 0 && index > indexLeader ? 'opacity-55' : ''}>
            <p className="font-titre text-[14px] leading-tight" style={{ color: palier.couleur }}>
              {nomPalier(palier, locale)}
            </p>
            <p className="mt-1 font-mono text-[11px] text-gris tabular-nums">
              {palier.minimum === 0 ? '< 1100' : `${palier.minimum}+`}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function positionSurEchelle(elo: number): number {
  const index = PALIERS.indexOf(palierDe(elo))
  const bas = index === 0 ? 800 : PALIERS[index].minimum
  const haut = index + 1 < PALIERS.length ? PALIERS[index + 1].minimum : bas + 100
  const fraction = Math.min(1, Math.max(0, (elo - bas) / (haut - bas)))
  return ((index + fraction) / PALIERS.length) * 100
}

/** Un repère posé sur l'échelle. L'étiquette se cale sur le bord quand le repère en est proche. */
function Repere({ position, cote, children }: { position: number; cote: 'haut' | 'bas'; children: React.ReactNode }) {
  // Sur téléphone la barre est étroite : l'étiquette part du repère vers le
  // centre ; sur grand écran elle est centrée, sauf près des bords.
  const calage =
    position < 18
      ? 'left-0'
      : position < 50
        ? 'left-0 lg:left-1/2 lg:-translate-x-1/2'
        : position <= 82
          ? 'right-0 lg:right-auto lg:left-1/2 lg:-translate-x-1/2'
          : 'right-0'
  return (
    <div
      className={`absolute ${cote === 'haut' ? 'top-0 h-[calc(100%-48px)]' : 'bottom-0 h-[calc(100%-56px)]'}`}
      style={{ left: `${position}%` }}
    >
      <span
        aria-hidden
        className={`absolute left-0 w-px -translate-x-1/2 ${cote === 'haut' ? 'top-7 bottom-0 bg-or' : 'top-0 bottom-7 bg-gris/70'}`}
      />
      <span
        className={`absolute whitespace-nowrap rounded-micro border px-2 py-1 font-mono text-[11px] ${calage} ${
          cote === 'haut' ? 'top-0 border-or/50 bg-nuit text-creme' : 'bottom-0 border-bord bg-nuit text-gris'
        }`}
      >
        {children}
      </span>
    </div>
  )
}
