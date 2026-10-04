import type { Metadata } from 'next'
import Link from 'next/link'

import { CompteRebours } from '@/components/accueil/CompteRebours'
import { NombreEnLigne } from '@/components/accueil/EnLigne'
import { BoutonIpGeant } from '@/components/public/CopieIp'
import { IconeDiscord } from '@/components/public/IconeDiscord'
import { PagePublique } from '@/components/public/PagePublique'
import { LienFleche } from '@/components/ui/Badge'
import { classesBouton } from '@/components/ui/Bouton'
import { CadreTable } from '@/components/ui/CadreTable'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { EtatVide } from '@/components/ui/EtatVide'
import { CaseCloisonnee, GrilleCloisonnee } from '@/components/ui/GrilleCloisonnee'
import { BlocFinal, Section } from '@/components/ui/Section'
import { lireSaisonCourante } from '@/lib/elo'
import { formaterOuverture, formaterOuvertureEnPhrase } from '@/lib/format'
import { estLocale, LANGUE_DEFAUT, lien, t, type CleTexte, type Locale } from '@/lib/i18n'
import { nomPalier, palierDe } from '@/lib/paliers'
import {
  lireChiffres,
  lireClassement,
  lireLeadersParMode,
  type ChiffresSaison,
  type LeaderMode,
  type LigneClassement,
} from '@/lib/practice'
import { cheminProfil, MODES, urlTete } from '@/lib/practice-commun'
import { lireReglages } from '@/lib/reglages'
import { CASHPRIZE, euros, saisonDu } from '@/lib/saison'
import { CLASSEMENT_OUVERT, IMAGE_OG } from '@/lib/site'

/**
 * L'ACCUEIL — VERSION COURTE (04/10/2026).
 *
 * Cinq blocs, et rien d'autre : la cagnotte et le compte à rebours dans le
 * hero, les chiffres du serveur, le classement en direct, les modes, l'appel
 * final. La page faisait dix sections et répétait trois fois le cashprize ;
 * un joueur qui arrive doit comprendre en un écran et pouvoir se connecter.
 *
 * Ce qui en est sorti vit déjà ailleurs : les étapes et les garanties dans le
 * règlement, les paliers et les derniers matchs sur /classement, les kits en
 * jeu. Rien n'est perdu, tout est à un clic.
 *
 * Les chiffres bougent à chaque match : la page est régénérée au plus toutes
 * les minutes (quelques SELECT légers, ceux du classement). Le compte à
 * rebours et les joueurs en ligne, eux, vivent dans le navigateur.
 */
export const revalidate = 60

/** Combien de joueurs l'aperçu du classement montre. */
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

  const [saisonBase, reglages] = await Promise.all([lireSaisonCourante(), lireReglages()])

  // Hors saison ouverte (ou classement du site fermé), les blocs en direct
  // disparaissent au lieu d'afficher des cadres vides. La cagnotte reste.
  let top: LigneClassement[] = []
  let chiffres: ChiffresSaison | null = null
  let leaders: LeaderMode[] = []
  if (saisonBase && CLASSEMENT_OUVERT) {
    ;[top, chiffres, leaders] = await Promise.all([
      lireClassement(saisonBase.id, 'global', TAILLE_TOP),
      lireChiffres(saisonBase.id),
      lireLeadersParMode(saisonBase.id),
    ])
  }

  const saison = saisonDu()
  const cagnotte = euros(CASHPRIZE.total, locale)
  const prix = CASHPRIZE.podium.map((montant) => euros(montant, locale))
  const clotureCourte = formaterOuverture(saison.fin, locale)
  const clotureEnPhrase = formaterOuvertureEnPhrase(saison.fin, locale)
  const numero = String(saison.numero)

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

      {/* ═══════════════════════ LE CLASSEMENT, EN DIRECT ═══════════════════════ */}
      {chiffres && (
        <Section
          id="classement"
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
            <>
              <CadreTable>
                <ol>
                  {top.map((ligne, index) => (
                    <li key={ligne.uuid}>
                      <Link
                        href={lien(locale, cheminProfil(ligne.pseudo))}
                        className="relative grid grid-cols-[34px_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-bord px-4 py-3.25 transition-colors last:border-b-0 hover:bg-braise sm:gap-4 sm:px-5"
                      >
                        <span
                          className={`relative font-mono text-[12.5px] ${
                            index < 3 ? 'font-bold text-or' : 'text-gris'
                          }`}
                        >
                          {String(ligne.rang).padStart(2, '0')}
                        </span>

                        <span className="relative flex min-w-0 items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={urlTete(ligne.pseudo, 32)}
                            alt=""
                            width={26}
                            height={26}
                            loading="lazy"
                            className="shrink-0 rounded-micro [image-rendering:pixelated]"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] leading-tight font-semibold">{ligne.pseudo}</span>
                            <span
                              className="block font-mono text-[10.5px] max-[460px]:hidden"
                              style={{ color: palierDe(ligne.elo).couleur }}
                            >
                              {nomPalier(palierDe(ligne.elo), locale)}
                            </span>
                          </span>
                        </span>

                        <span
                          className="relative font-mono text-[14px] font-bold tabular-nums"
                          style={{ color: palierDe(ligne.elo).couleur }}
                        >
                          {ligne.elo}
                        </span>

                        {/* Les trois premiers affichent ce qu'ils touchent, les suivants
                            ce qui leur manque pour y entrer. */}
                        <span className="relative min-w-[70px] text-right font-mono text-[11.5px] sm:min-w-[86px]">
                          {index < 3 ? (
                            <span className="font-bold text-or">{prix[index]}</span>
                          ) : (
                            <EcartAuPodium ecart={eloTroisieme - ligne.elo} locale={locale} />
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </CadreTable>

              <LienFleche href={lien(locale, '/classement')} className="mt-4.5">
                {t(locale, 'classement.complet')}
              </LienFleche>
            </>
          )}
        </Section>
      )}

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
        <div className="flex flex-wrap items-stretch justify-center gap-2.75">
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

const DESCRIPTIONS_MODES: Record<(typeof MODES)[number]['id'], CleTexte> = {
  hg: 'ac.mode-hg',
  digger: 'ac.mode-digger',
  boxing: 'ac.mode-boxing',
  ironsoup: 'ac.mode-ironsoup',
}

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

/** Ce qui sépare un joueur de la 3e place — ou l'égalité, quand il n'y a rien. */
function EcartAuPodium({ ecart, locale }: { ecart: number; locale: Locale }) {
  if (ecart <= 0) {
    return <span className="text-gris">{t(locale, 'ac.egalite')}</span>
  }
  return (
    <>
      <span className="text-oni">−{ecart}</span>{' '}
      <span className="text-gris max-[460px]:hidden">{t(locale, 'ac.du-podium')}</span>
    </>
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
