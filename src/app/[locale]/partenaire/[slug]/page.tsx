import type { Metadata } from 'next'
import Link from 'next/link'

import { sortirPartenaire } from '@/actions/partenaire'
import { BarresJours } from '@/components/partenaire/BarresJours'
import { FormulaireAcces } from '@/components/partenaire/FormulaireAcces'
import { TuileStat } from '@/components/practice/Petits'
import { PagePublique } from '@/components/public/PagePublique'
import { classesBouton } from '@/components/ui/Bouton'
import { CadreTable, EnteteTable } from '@/components/ui/CadreTable'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { Panneau, SectionPanneau } from '@/components/ui/Panneau'
import { Section } from '@/components/ui/Section'
import { Etiquette } from '@/components/ui/TeteSection'
import { formaterDate } from '@/lib/format'
import { type CleTexte, estLocale, LANGUE_DEFAUT, lien, t, type Locale } from '@/lib/i18n'
import {
  JOUEURS_AFFICHES,
  lirePartenaire,
  lireStatsPartenaire,
  VISITEURS_AFFICHES,
} from '@/lib/partenaire'
import {
  formaterTempsJeu,
  joursDuGraphique,
  lirePeriode,
  PERIODES,
  type Periode,
} from '@/lib/partenaire-commun'
import { sessionOuvertePour } from '@/lib/partenaire-session'
import { urlTete } from '@/lib/practice-commun'

/**
 * L'ESPACE D'UN PARTENAIRE / STREAMEUR (17/09/2026).
 *
 * Combien de joueurs son hote a amenes, combien sont revenus, combien de
 * temps ils ont joue. Rien d'autre : ni adresse IP, ni donnee personnelle,
 * ni chiffre d'affaires.
 *
 * DEUX TABLEAUX, DEUX SENS. Le premier — « joueur par joueur » — ne contient
 * que les joueurs ATTRIBUES au partenaire : c'est lui qui paie. Le second —
 * « joueurs revenus par ton IP » — montre les joueurs deja connus du serveur
 * qui se sont connectes par son adresse, pour information seulement ; aucun
 * de leurs chiffres n'entre dans les grands nombres du haut. La page est protegee par un mot de passe a lui
 * (cf. src/lib/partenaire-session.ts), et chaque chiffre se recalcule en
 * direct depuis les tables du plugin.
 *
 * UNE PAGE POUR TOUS LES CAS. Slug inconnu, partenaire desactive, session
 * absente ou expiree : le visiteur voit le meme formulaire d'acces. Repondre
 * 404 sur un slug inconnu reviendrait a publier la liste des partenaires.
 *
 * Rendue a la demande et jamais mise en cache : ces chiffres sont prives, et
 * deux partenaires ne doivent en aucun cas se partager une page en cache.
 */
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ periode?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  return {
    title: t(locale, 'part.meta-titre'),
    description: t(locale, 'part.meta-desc'),
    // Un espace prive n'a rien a faire dans les moteurs de recherche.
    robots: { index: false, follow: false },
  }
}

/** L'ecran d'accueil : le formulaire, et rien d'autre a apprendre. */
function EcranAcces({ slug, locale, message }: { slug: string; locale: Locale; message?: string }) {
  return (
    <PagePublique locale={locale}>
      <main className="halo-hero flex min-h-[70vh] items-center justify-center px-gouttiere py-[clamp(48px,8vw,96px)]">
        <div className="w-full max-w-[420px]">
          <Panneau ombre titre={t(locale, 'part.acces-titre')}>
            <SectionPanneau dernier>
              <p className="mb-5 text-sm text-gris">{message ?? t(locale, 'part.acces-chapeau')}</p>
              <FormulaireAcces slug={slug} locale={locale} />
              <p className="mt-5 text-[12.5px] leading-snug text-gris">{t(locale, 'part.acces-aide')}</p>
            </SectionPanneau>
          </Panneau>
        </div>
      </main>
    </PagePublique>
  )
}

export default async function PagePartenaire({ params, searchParams }: Props) {
  const { locale: brut, slug: slugBrut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const slug = decodeURIComponent(slugBrut).toLowerCase()

  if (!(await sessionOuvertePour(slug))) {
    return <EcranAcces slug={slug} locale={locale} />
  }

  const partenaire = await lirePartenaire(slug)
  // Session valide mais partenaire supprime entre-temps : on repasse par la
  // porte, sans dire ce qui s'est passe.
  if (!partenaire) return <EcranAcces slug={slug} locale={locale} />
  if (!partenaire.actif) {
    return <EcranAcces slug={slug} locale={locale} message={t(locale, 'part.ferme')} />
  }

  const { periode: periodeBrute } = await searchParams
  const periode = lirePeriode(periodeBrute)
  const stats = await lireStatsPartenaire(partenaire.hote, periode)
  const { chiffres } = stats

  // Une table explicite plutôt qu'une clé construite : le dictionnaire reste
  // grep-able, et TypeScript vérifie que les quatre clés existent vraiment.
  const LIBELLES: Record<string, CleTexte> = {
    '7': 'part.periode-7',
    '30': 'part.periode-30',
    '90': 'part.periode-90',
    tout: 'part.periode-tout',
  }
  const libellePeriode = (valeur: Periode) => t(locale, LIBELLES[String(valeur)])

  const chemin = (valeur: Periode) =>
    lien(locale, `/partenaire/${partenaire.slug}${valeur === 'tout' ? '' : `?periode=${valeur}`}`)

  return (
    <PagePublique locale={locale}>
      {/* ══════════════════════════ EN-TÊTE ══════════════════════════ */}
      <header className="halo-hero relative pt-[clamp(44px,6vw,84px)] pb-[clamp(24px,3.5vw,40px)]">
        <Enveloppe>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Etiquette>{t(locale, 'part.etiquette')}</Etiquette>
              <h1 className="text-h1 mt-3 font-titre">
                {t(locale, 'part.titre-avant')} <span className="text-or">{t(locale, 'part.titre-accent')}</span>
              </h1>
              <p className="mt-4 max-w-[62ch] text-[16px] text-gris">
                {t(locale, 'part.chapeau').replace('{h}', partenaire.hote)}
              </p>
            </div>

            <form action={sortirPartenaire} className="shrink-0">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="slug" value={partenaire.slug} />
              <button type="submit" className={classesBouton({ variante: 'vide' })}>
                {t(locale, 'part.deconnexion')}
              </button>
            </form>
          </div>

          {/* ---------- la période ---------- */}
          <nav aria-label={t(locale, 'part.periode')} className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {PERIODES.map((valeur) => {
                const actif = valeur === periode
                return (
                  <li key={String(valeur)}>
                    <Link
                      href={chemin(valeur)}
                      scroll={false}
                      aria-current={actif ? 'page' : undefined}
                      className={`flex min-h-11 items-center rounded-controle border px-4 font-mono text-[12px] font-bold tracking-[.1em] uppercase transition ${
                        actif
                          ? 'border-or/70 bg-or/10 text-or'
                          : 'border-bord bg-charbon text-gris hover:border-gris/60 hover:text-creme'
                      }`}
                    >
                      {libellePeriode(valeur)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </Enveloppe>
      </header>

      {/* ══════════════════════════ LES GRANDS CHIFFRES ══════════════════════════ */}
      <section className="pb-[clamp(28px,4vw,48px)]">
        <Enveloppe>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <TuileStat
              libelle={t(locale, 'part.joueurs')}
              valeur={String(chiffres.joueurs)}
              detail={
                <>
                  {t(locale, 'part.joueurs-aide')}
                  <span className="mt-1.5 block font-mono text-[10px] tracking-[.12em] text-or/85 uppercase">
                    {t(locale, 'part.joueurs-payes')}
                  </span>
                </>
              }
              couleur="var(--color-or)"
            />
            <TuileStat
              libelle={t(locale, 'part.nouveaux')}
              valeur={String(chiffres.nouveaux)}
              detail={t(locale, 'part.nouveaux-aide')}
            />
            <TuileStat
              libelle={t(locale, 'part.revenus')}
              valeur={String(chiffres.revenus)}
              detail={t(locale, 'part.revenus-aide')}
            />
            <TuileStat
              libelle={t(locale, 'part.temps')}
              valeur={formaterTempsJeu(chiffres.secondes, locale)}
              detail={t(locale, 'part.temps-aide')}
            />
            <TuileStat
              libelle={t(locale, 'part.temps-moyen')}
              valeur={formaterTempsJeu(chiffres.secondesParJoueur, locale)}
            />
            <TuileStat
              libelle={t(locale, 'part.sessions')}
              valeur={String(chiffres.sessions)}
              detail={t(locale, 'part.sessions-aide')}
            />
            <TuileStat
              libelle={t(locale, 'part.visiteurs')}
              valeur={String(chiffres.visiteurs)}
              detail={t(locale, 'part.visiteurs-aide')}
            />
          </div>

          {/* La règle du jeu, dite une fois, à l'endroit où on lit les chiffres. */}
          <div className="mt-3.5 rounded-carte border border-bord bg-charbon p-5">
            <p className="text-[14px] leading-relaxed text-gris">
              {t(locale, 'part.attribution').replace('{h}', partenaire.hote)}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-gris/85">{t(locale, 'part.historique')}</p>
            <p className="mt-2 font-mono text-[11.5px] tracking-[.08em] text-gris/70 uppercase">
              {t(locale, 'part.confidentialite')}
            </p>
          </div>
        </Enveloppe>
      </section>

      {/* ══════════════════════════ JOUR PAR JOUR ══════════════════════════ */}
      <Section
        fond="charbon"
        etiquette={t(locale, 'part.graphe-etiquette')}
        titre={t(locale, 'part.graphe-titre').replace('{n}', String(joursDuGraphique(periode)))}
      >
        <BarresJours jours={stats.jours} locale={locale} />
      </Section>

      {/* ══════════════════════════ JOUEUR PAR JOUEUR ══════════════════════════ */}
      <Section etiquette={t(locale, 'part.table-etiquette')} titre={t(locale, 'part.table-titre')}>
        {stats.joueurs.length === 0 ? (
          <p className="rounded-carte border border-dashed border-bord px-6 py-12 text-center font-mono text-[13px] text-gris">
            {t(locale, 'part.table-vide')}
          </p>
        ) : (
          <>
            <CadreTable>
              <EnteteTable
                colonnes="minmax(0,1fr) 92px 110px 118px"
                libelles={[
                  t(locale, 'part.col-joueur'),
                  t(locale, 'part.col-sessions'),
                  t(locale, 'part.col-temps'),
                  t(locale, 'part.col-derniere'),
                ]}
                alignerADroite={[1, 2, 3]}
                className="hidden sm:grid"
              />

              <ul>
                {stats.joueurs.map((joueur) => (
                  <li
                    key={joueur.pseudo}
                    className="grid grid-cols-1 gap-2 border-b border-bord px-4.5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_92px_110px_118px] sm:gap-3"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={urlTete(joueur.pseudo, 32)}
                        alt=""
                        width={22}
                        height={22}
                        loading="lazy"
                        className="size-[22px] shrink-0 rounded-micro"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[14.5px] text-creme">{joueur.pseudo}</span>
                        <span className="block font-mono text-[10.5px] text-gris">
                          {t(locale, 'part.col-premiere')} · {formaterDate(joueur.premiere, locale)}
                        </span>
                      </span>
                    </span>

                    <span className="font-mono text-[13px] tabular-nums text-gris sm:text-right">
                      <span className="sm:hidden">{t(locale, 'part.col-sessions')} · </span>
                      {joueur.sessions}
                    </span>

                    <span className="font-mono text-[13px] tabular-nums text-creme sm:text-right">
                      <span className="sm:hidden text-gris">{t(locale, 'part.col-temps')} · </span>
                      {formaterTempsJeu(joueur.secondes, locale)}
                    </span>

                    <span className="font-mono text-[12px] text-gris sm:text-right">
                      <span className="sm:hidden">{t(locale, 'part.col-derniere')} · </span>
                      {joueur.derniere ? formaterDate(joueur.derniere, locale) : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </CadreTable>

            <p className="mt-3 font-mono text-[11.5px] text-gris">
              {t(locale, 'part.table-limite')
                .replace('{n}', String(Math.min(JOUEURS_AFFICHES, stats.joueurs.length)))
                .replace('{t}', String(chiffres.joueursDepuisToujours))}
            </p>
          </>
        )}
      </Section>

      {/* ══════════════════════════ LES JOUEURS DE PASSAGE ══════════════════════════ */}
      <Section
        fond="charbon"
        etiquette={t(locale, 'part.visiteurs-etiquette')}
        titre={t(locale, 'part.visiteurs-titre')}
      >
        {stats.visiteurs.length === 0 ? (
          <p className="rounded-carte border border-dashed border-bord px-6 py-12 text-center font-mono text-[13px] text-gris">
            {t(locale, 'part.visiteurs-vide')}
          </p>
        ) : (
          <>
            <CadreTable fond="braise">
              <EnteteTable
                colonnes="minmax(0,1fr) 92px 110px 118px"
                libelles={[
                  t(locale, 'part.col-joueur'),
                  t(locale, 'part.col-sessions'),
                  t(locale, 'part.col-temps'),
                  t(locale, 'part.col-derniere'),
                ]}
                alignerADroite={[1, 2, 3]}
                className="hidden sm:grid"
              />

              <ul>
                {stats.visiteurs.map((joueur, index) => (
                  <li
                    // Deux comptes peuvent porter le meme pseudo : l'index
                    // garantit une cle unique, la ligne ne bouge jamais.
                    key={`${joueur.pseudo}-${index}`}
                    className="grid grid-cols-1 gap-2 border-b border-bord px-4.5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_92px_110px_118px] sm:gap-3"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={urlTete(joueur.pseudo, 32)}
                        alt=""
                        width={22}
                        height={22}
                        loading="lazy"
                        className="size-[22px] shrink-0 rounded-micro"
                      />
                      <span className="min-w-0 truncate text-[14.5px] text-creme">{joueur.pseudo}</span>
                    </span>

                    <span className="font-mono text-[13px] tabular-nums text-gris sm:text-right">
                      <span className="sm:hidden">{t(locale, 'part.col-sessions')} · </span>
                      {joueur.sessions}
                    </span>

                    <span className="font-mono text-[13px] tabular-nums text-creme sm:text-right">
                      <span className="sm:hidden text-gris">{t(locale, 'part.col-temps')} · </span>
                      {formaterTempsJeu(joueur.secondes, locale)}
                    </span>

                    <span className="font-mono text-[12px] text-gris sm:text-right">
                      <span className="sm:hidden">{t(locale, 'part.col-derniere')} · </span>
                      {formaterDate(joueur.derniere, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </CadreTable>

            {stats.visiteurs.length >= VISITEURS_AFFICHES && (
              <p className="mt-3 font-mono text-[11.5px] text-gris">
                {t(locale, 'part.visiteurs-limite').replace('{n}', String(VISITEURS_AFFICHES))}
              </p>
            )}
          </>
        )}

        {/* La regle de remuneration, dite noir sur blanc sous le tableau. */}
        <div className="mt-3.5 rounded-carte border border-bord bg-braise p-5">
          <p className="text-[14px] leading-relaxed text-gris">{t(locale, 'part.visiteurs-note')}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-gris/85">
            {t(locale, 'part.visiteurs-colonnes').replace('{h}', partenaire.hote)}
          </p>
        </div>
      </Section>
    </PagePublique>
  )
}
