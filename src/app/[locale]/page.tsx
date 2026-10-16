import type { Metadata } from 'next'
import Link from 'next/link'

import { CompteRebours } from '@/components/accueil/CompteRebours'
import { BoutonCopieIp } from '@/components/public/CopieIp'
import { IconeDiscord } from '@/components/public/IconeDiscord'
import { PagePublique } from '@/components/public/PagePublique'
import {
  BadgeGrade,
  Compteur,
  Conteneur,
  Elo,
  IconeMode,
  LienVoirTout,
  NomPalier,
  Panneau,
  Tete,
  TitreSection,
} from '@/components/s2/Briques'
import { LigneMatchNeutre } from '@/components/s2/LignesMatch'
import { NombreEnLigne } from '@/components/accueil/EnLigne'
import { cheminClassement, cheminFlux } from '@/lib/chemins-s2'
import { formaterDateHeure } from '@/lib/format'
import { estLocale, LANGUE_DEFAUT, lien, type Locale } from '@/lib/i18n'
import { type CleS2, ts } from '@/lib/i18n-s2'
import { gradesEnCache } from '@/lib/joueurs'
import {
  lireChiffresCache,
  lireClassementCache,
  lireDerniersMatchsCache,
  lireLeadersParModeCache,
  type LigneClassement,
} from '@/lib/practice'
import { cheminProfil, modesDeSaison, urlCorps } from '@/lib/practice-commun'
import { lireReglages } from '@/lib/reglages'
import { cashprizeDe, euros, OUVERTURES_PUBLIQUES, saisonDu, saisonParDefaut } from '@/lib/saison'
import { lireSaisonsCache } from '@/lib/saisons'
import { IMAGE_OG } from '@/lib/site'

/**
 * L'ACCUEIL (refonte S2, 16/10/2026).
 *
 * Ce qu'un joueur veut savoir en arrivant, dans cet ordre : c'est quoi, comment
 * je rejoins (IP + joueurs en ligne), qu'est-ce qu'on gagne (cashprize et top 3
 * en direct), à quoi on joue (les modes et leur n°1), ce qui se passe (derniers
 * matchs, top global), qui a gagné la saison d'avant.
 *
 * Avant l'ouverture publique d'une saison, l'accueil parle déjà d'elle (compte
 * à rebours, modes, cashprize) mais montre les matchs et le top de la saison
 * précédente plutôt que des tableaux vides. Gardé 30 s par le CDN.
 */
export const revalidate = 30

type Params = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const titre = ts(locale, 'a.meta-titre')
  const description = ts(locale, 'a.meta-desc', { c: euros(cashprizeDe(saisonDu().numero).total, locale) })
  return {
    title: { absolute: titre },
    description,
    alternates: { canonical: lien(locale, '/') },
    openGraph: { title: titre, description, images: IMAGE_OG },
  }
}

export default async function Accueil({ params }: Params) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT

  // La saison mise en vitrine (celle du calendrier) et celle dont on montre les données.
  const vitrine = saisonDu()
  const ouverture = OUVERTURES_PUBLIQUES[vitrine.numero]
  const avantOuverture = ouverture != null && Date.parse(ouverture) > Date.now()
  const saisonDonnees = saisonParDefaut()
  const cashprize = cashprizeDe(vitrine.numero)
  const modes = modesDeSaison(vitrine.numero)

  const [reglages, saisons, chiffres, leaders, derniers, topDonnees] = await Promise.all([
    lireReglages(),
    lireSaisonsCache(),
    avantOuverture ? null : lireChiffresCache(vitrine.numero),
    avantOuverture ? [] : lireLeadersParModeCache(vitrine.numero),
    lireDerniersMatchsCache(saisonDonnees, 8),
    lireClassementCache(saisonDonnees, 'global', 10),
  ])
  // Les champions : la dernière saison terminée.
  const terminee = saisons.find((s) => s.terminee && s.aDesMatchs)
  const champions = terminee ? (terminee.id === saisonDonnees ? topDonnees : await lireClassementCache(terminee.id, 'global', 3)) : []
  const grades = await gradesEnCache([
    ...new Set([
      ...derniers.flatMap((m) => [m.gagnant, m.perdant]),
      ...topDonnees.map((j) => j.uuid),
      ...champions.slice(0, 3).map((j) => j.uuid),
    ]),
  ])
  const podiumVitrine = avantOuverture || saisonDonnees !== vitrine.numero ? [] : topDonnees.slice(0, 3)
  const leaderDe = new Map(leaders.map((l) => [l.mode, l]))
  const echeance = avantOuverture ? new Date(ouverture) : vitrine.fin

  return (
    <PagePublique locale={locale}>
      <main>
        {/* ═══════════════ HERO ═══════════════ */}
        <section className="relative overflow-hidden border-b border-bord">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background:radial-gradient(50%_80%_at_20%_10%,rgba(254,147,1,.13),transparent_70%),radial-gradient(40%_70%_at_90%_80%,rgba(233,40,19,.10),transparent_70%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[.35] [background-image:linear-gradient(rgba(46,34,69,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(46,34,69,.5)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(70%_70%_at_30%_30%,black,transparent)]"
          />
          <Conteneur className="relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-center lg:py-20">
            <div>
              <p className="entree inline-flex items-center gap-2 rounded-full border border-or/30 bg-or/[.07] px-3 py-1 text-[12.5px] font-semibold text-or">
                <span className={`size-1.5 rounded-full ${avantOuverture ? 'bg-or' : 'bg-vert'}`} aria-hidden />
                {avantOuverture
                  ? ts(locale, 'a.kicker-ouverture', { n: vitrine.numero, d: formaterDateHeure(new Date(ouverture), locale) })
                  : ts(locale, 'a.kicker-live', { n: vitrine.numero })}
              </p>
              <h1 style={{ ['--delai' as string]: '.08s' }} className="entree mt-5 text-[46px] leading-[.98] font-extrabold tracking-[-.035em] text-creme sm:text-[64px] lg:text-[72px]">
                {ts(locale, 'a.titre-1')}
                <br />
                <span className="bg-gradient-to-b from-or to-soupe bg-clip-text text-transparent">{ts(locale, 'a.titre-2')}</span>
              </h1>
              <p style={{ ['--delai' as string]: '.16s' }} className="entree mt-5 max-w-[50ch] text-[16.5px] leading-relaxed text-gris sm:text-[17.5px]">
                {ts(locale, 'a.chapeau', { c: euros(cashprize.total, locale) })}
              </p>
              <div style={{ ['--delai' as string]: '.24s' }} className="entree mt-7 flex flex-wrap items-center gap-3">
                <BoutonCopieIp
                  aria-label={`${ts(locale, 'nav.copier')} — ${reglages.ip}`}
                  className="reflet group inline-flex h-13 items-center gap-3 rounded-[8px] bg-gradient-to-b from-or to-soupe px-5 text-encre shadow-[0_10px_30px_-10px_rgba(254,147,1,.8)] transition-[filter] hover:brightness-110"
                >
                  <span className="font-mono text-[17px] font-bold">{reglages.ip}</span>
                  <span className="rounded-[5px] bg-encre/15 px-2 py-1 text-[12px] font-bold">
                    <NombreEnLigne /> {ts(locale, 'a.en-ligne')}
                  </span>
                </BoutonCopieIp>
                <a
                  href={reglages.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-13 items-center gap-2.5 rounded-[8px] border border-bord bg-charbon px-5 text-[15px] font-semibold text-creme hover:border-[#5865f2] hover:bg-[#5865f2]/15"
                >
                  <IconeDiscord className="size-5 fill-[#8b95ff]" />
                  {ts(locale, 'a.rejoindre-discord')}
                </a>
              </div>
              <p style={{ ['--delai' as string]: '.3s' }} className="entree mt-4 text-[13px] text-gris">{ts(locale, 'pied.versions')} · {ts(locale, 'nav.copier')}</p>
            </div>

            {/* La cagnotte de la saison et le top 3 en direct. */}
            <Panneau className="entree relative overflow-hidden p-5 shadow-[0_30px_80px_-30px_rgba(254,147,1,.35)] sm:p-6" style={{ ['--delai' as string]: '.2s' }}>
              <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-or/10 blur-3xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-gris">{ts(locale, 'a.cagnotte', { n: vitrine.numero })}</p>
                  <p className="mt-1 font-titre text-[48px] leading-none text-or">
                    {locale === 'en' && '€'}
                    <Compteur valeur={cashprize.total} />
                    {locale === 'fr' && '€'}
                  </p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/marque/icone-192.png" alt="" width={64} height={64} className="flotte rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,.5)]" />
              </div>
              <ol className="cascade relative mt-5 grid gap-2">
                {[0, 1, 2].map((i) => {
                  const j = podiumVitrine[i]
                  const couleur = ['#fdc003', '#c9c3d4', '#c08a4a'][i]
                  return (
                    <li key={i} className="flex items-center gap-3 rounded-[6px] border border-bord bg-nuit/60 px-3 py-2.5">
                      <span className="w-6 font-titre text-[17px]" style={{ color: couleur }}>
                        {i + 1}
                      </span>
                      {j ? (
                        <Link href={lien(locale, cheminProfil(j.pseudo))} className="flex min-w-0 flex-1 items-center gap-2 hover:text-or">
                          <Tete pseudo={j.pseudo} taille={24} />
                          <span className="truncate font-semibold">{j.pseudo}</span>
                          <Elo valeur={j.elo} className="ml-auto text-[13.5px]" />
                        </Link>
                      ) : (
                        <span className="flex-1 text-[14px] text-gris">{ts(locale, 'c.place-libre')}</span>
                      )}
                      <span className="w-12 text-right font-mono text-[14px] font-bold text-creme">{euros(cashprize.podium[i], locale)}</span>
                    </li>
                  )
                })}
              </ol>
              <div className="relative mt-5">
                <p className="mb-2 text-[12.5px] font-semibold text-gris">
                  {ts(locale, avantOuverture ? 'a.cagnotte-ouvre' : 'a.cagnotte-fin')}
                </p>
                <CompteRebours fin={echeance.toISOString()} dateLisible={formaterDateHeure(echeance, locale)} compact />
              </div>
              <p className="relative mt-4 text-[12px] leading-relaxed text-gris/80">{ts(locale, 'a.cagnotte-note')}</p>
            </Panneau>
          </Conteneur>
        </section>

        {/* ═══════════════ LES MODES ═══════════════ */}
        <Conteneur className="pt-14">
          <TitreSection
            titre={ts(locale, 'a.modes-titre')}
            sous={ts(locale, 'a.modes-sous')}
            droite={<LienVoirTout href={lien(locale, '/classement')}>{ts(locale, 'nav.classements')}</LienVoirTout>}
          />
          <div className="apparition-grille grid grid-cols-2 gap-3 md:grid-cols-4">
            {modes.map((m) => {
              const leader = leaderDe.get(m.id)
              const classes = chiffres?.classesParMode[m.id] ?? 0
              return (
                <Link
                  key={m.id}
                  href={lien(locale, cheminClassement(vitrine.numero, m.id, saisonDonnees))}
                  className="group relative overflow-hidden rounded-[8px] border border-bord bg-charbon p-4 transition-[background-color,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-[color:var(--teinte)] hover:bg-braise"
                  style={{ ['--teinte' as string]: `${m.couleur}88` }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-45"
                    style={{ backgroundColor: m.couleur }}
                  />
                  <span className="relative flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-[8px] border border-bord bg-nuit/70">
                      <IconeMode mode={m.id} taille={28} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[16px] font-bold text-creme">{m.nom}</span>
                      <span className="text-[12.5px] text-gris">
                        <Compteur valeur={classes} defilement /> {ts(locale, 'a.mode-classes-mot')}
                      </span>
                    </span>
                  </span>
                  <span className="relative mt-4 flex items-center gap-2 border-t border-bord/70 pt-3 text-[13px]">
                    <span className="text-[11px] font-bold tracking-[.08em] text-or uppercase">{ts(locale, 'a.mode-leader')}</span>
                    {leader ? (
                      <>
                        <Tete pseudo={leader.pseudo} taille={20} />
                        <span className="min-w-0 flex-1 truncate font-semibold text-creme">{leader.pseudo}</span>
                        <Elo valeur={leader.elo} className="text-[13px]" />
                      </>
                    ) : (
                      <span className="text-gris">{ts(locale, 'a.mode-vide')}</span>
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        </Conteneur>

        {/* ═══════════════ CE QUI SE PASSE ═══════════════ */}
        <Conteneur className="apparition-grille grid gap-6 pt-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <section>
            <TitreSection
              titre={ts(locale, 'a.derniers-matchs')}
              sous={ts(locale, 'c.saison', { n: saisonDonnees })}
              droite={<LienVoirTout href={lien(locale, cheminFlux(null))}>{ts(locale, 'c.voir-tout')}</LienVoirTout>}
            />
            <Panneau className="cascade-defilement overflow-hidden">
              {derniers.length === 0 ? (
                <p className="px-4 py-10 text-center text-[14px] text-gris">{ts(locale, 'f.vide')}</p>
              ) : (
                derniers.map((m) => <LigneMatchNeutre key={m.id} m={m} locale={locale} grades={grades} compacte />)
              )}
            </Panneau>
          </section>
          <section>
            <TitreSection
              titre={ts(locale, 'a.top-global')}
              sous={ts(locale, 'c.saison', { n: saisonDonnees })}
              droite={<LienVoirTout href={lien(locale, cheminClassement(saisonDonnees, 'global', saisonDonnees))}>{ts(locale, 'c.voir-tout')}</LienVoirTout>}
            />
            <Panneau className="cascade-defilement overflow-hidden">
              {topDonnees.map((j) => (
                <Link
                  key={j.uuid}
                  href={lien(locale, cheminProfil(j.pseudo))}
                  className="ligne-survol group flex items-center gap-3 border-b border-bord/60 px-4 py-2 last:border-0 hover:bg-braise/70"
                >
                  <span
                    className="w-6 font-mono text-[13px] font-bold text-gris"
                    style={j.rang <= 3 ? { color: ['#fdc003', '#c9c3d4', '#c08a4a'][j.rang - 1] } : undefined}
                  >
                    {j.rang}
                  </span>
                  <Tete pseudo={j.pseudo} taille={24} />
                  <span className="min-w-0 flex-1 truncate font-semibold text-creme group-hover:text-or">{j.pseudo}</span>
                  <BadgeGrade grade={grades.get(j.uuid)} />
                  <Elo valeur={j.elo} className="w-12 text-right text-[14px]" />
                </Link>
              ))}
            </Panneau>
          </section>
        </Conteneur>

        {/* ═══════════════ LES CHAMPIONS ═══════════════ */}
        {terminee && champions.length > 0 && (
          <Conteneur className="pt-14">
            <TitreSection titre={ts(locale, 'a.temple', { n: terminee.id })} sous={ts(locale, 'a.temple-sous')} />
            <Champions lignes={champions.slice(0, 3)} locale={locale} saison={terminee.id} grades={grades} />
          </Conteneur>
        )}

        {/* ═══════════════ POURQUOI ═══════════════ */}
        <Conteneur className="pt-14">
          <TitreSection titre={ts(locale, 'a.pourquoi')} />
          <div className="apparition-grille grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ['a.f1-titre', 'a.f1-texte', 'items-diamond_sword'],
                ['a.f2-titre', 'a.f2-texte', 'items-iron_sword'],
                ['a.f3-titre', 'a.f3-texte', 'items-ender_pearl'],
                ['a.f4-titre', 'a.f4-texte', 'items-mushroom_stew'],
              ] as [CleS2, CleS2, string][]
            ).map(([titre, texte, icone]) => (
              <Panneau key={titre} className="p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/items/${icone}.png`} alt="" width={28} height={28} loading="lazy" className="[image-rendering:pixelated]" />
                <h3 className="mt-3 text-[16px] font-bold text-creme">{ts(locale, titre)}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-gris">{ts(locale, texte)}</p>
              </Panneau>
            ))}
          </div>
        </Conteneur>

        {/* ═══════════════ APPEL FINAL ═══════════════ */}
        <Conteneur className="pt-14">
          <Panneau className="apparition relative overflow-hidden px-6 py-10 text-center sm:py-12">
            <div aria-hidden className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_90%_at_50%_100%,rgba(254,147,1,.16),transparent_70%)]" />
            <h2 className="relative text-[26px] font-extrabold tracking-[-.02em] text-creme sm:text-[32px]">{ts(locale, 'a.final-titre')}</h2>
            <p className="relative mx-auto mt-2 max-w-[52ch] text-[15px] text-gris">{ts(locale, 'a.final-texte')}</p>
            <BoutonCopieIp
              aria-label={`${ts(locale, 'nav.copier')} — ${reglages.ip}`}
              className="reflet relative mt-6 inline-flex h-13 items-center rounded-[8px] bg-gradient-to-b from-or to-soupe px-6 font-mono text-[17px] font-bold text-encre hover:brightness-110"
            >
              {reglages.ip}
            </BoutonCopieIp>
          </Panneau>
        </Conteneur>
      </main>
    </PagePublique>
  )
}

function Champions({
  lignes,
  locale,
  saison,
  grades,
}: {
  lignes: LigneClassement[]
  locale: Locale
  saison: number
  grades: Map<string, import('@/lib/grades-commun').Grade>
}) {
  // Ordre d'estrade : 2e, 1er, 3e.
  const ordre = [1, 0, 2].filter((i) => lignes[i])
  const prix = cashprizeDe(saison).podium
  const couleurs = ['#fdc003', '#c9c3d4', '#c08a4a']
  return (
    <div className="apparition-grille grid grid-cols-3 items-end gap-2 sm:gap-4">
      {ordre.map((i) => {
        const j = lignes[i]
        return (
          <Link
            key={j.uuid}
            href={lien(locale, `${cheminProfil(j.pseudo)}/saison-${saison}`)}
            className="group flex flex-col items-center rounded-[8px] border bg-charbon px-2 pt-4 pb-4 text-center transition-[background-color,transform] duration-200 hover:-translate-y-1 hover:bg-braise sm:px-4"
            style={{ borderColor: `${couleurs[i]}55` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlCorps(j.pseudo, 240)}
              alt=""
              width={80}
              height={180}
              loading="lazy"
              className={`w-auto drop-shadow-[0_10px_18px_rgba(0,0,0,.55)] ${i === 0 ? 'h-[150px] sm:h-[200px]' : 'h-[120px] sm:h-[160px]'}`}
            />
            <span className="mt-3 font-titre text-[22px] leading-none" style={{ color: couleurs[i] }}>
              #{i + 1}
            </span>
            <span className="mt-2 flex max-w-full items-center gap-1.5">
              <span className="truncate text-[14px] font-bold text-creme group-hover:text-or sm:text-[16px]">{j.pseudo}</span>
              <BadgeGrade grade={grades.get(j.uuid)} className="hidden sm:inline-flex" />
            </span>
            <span className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2">
              <Elo valeur={j.elo} className="text-[15px]" anime defilement />
              <NomPalier elo={j.elo} locale={locale} className="hidden sm:inline" />
            </span>
            <span className="mt-1.5 rounded-[4px] bg-or/12 px-1.5 py-0.5 font-mono text-[12px] font-bold text-or">{euros(prix[i], locale)}</span>
          </Link>
        )
      })}
    </div>
  )
}
