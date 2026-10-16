import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { Skin3D } from '@/components/practice/Skin3D'
import { PagePublique } from '@/components/public/PagePublique'
import {
  BadgeGrade,
  BarreWinrate,
  Chiffre,
  Conteneur,
  Elo,
  Forme,
  IconeMode,
  NomPalier,
  Panneau,
  Tete,
} from '@/components/s2/Briques'
import { CourbeElo } from '@/components/s2/CourbeElo'
import { LigneMatchProfil } from '@/components/s2/LignesMatch'
import { PucesSaison } from '@/components/s2/Selecteurs'
import { cheminClassement, cheminProfilSaison } from '@/lib/chemins-s2'
import { formaterDate } from '@/lib/format'
import { estLocale, LANGUE_DEFAUT, lien, type Locale } from '@/lib/i18n'
import { ts } from '@/lib/i18n-s2'
import { gradesEnCache, lirePresence, saisonsJouees, trouverJoueur } from '@/lib/joueurs'
import { palierDe } from '@/lib/paliers'
import { lireArchiveJoueur, lireProfil, type Profil, type Rival } from '@/lib/practice'
import { cheminProfil, formaterDuree, formaterTempsJeu, infosMode, modesDeSaison, tempsRelatif } from '@/lib/practice-commun'
import { contexteSaison, lireSaisonsCache } from '@/lib/saisons'
import { IMAGE_OG } from '@/lib/site'

/**
 * LE PROFIL D'UN JOUEUR (refonte S2, 16/10/2026), dans l'esprit des pages joueur
 * des grands serveurs practice : identité à gauche (skin, grade, présence),
 * Elo et classement d'un coup d'œil, puis chaque mode, la courbe, l'historique
 * (chaque match mène à son récap), les records et les rivaux.
 *
 * Partagé par /joueur/<pseudo> (saison par défaut) et /joueur/<pseudo>/saison-N.
 * Un joueur sans ranked a quand même sa fiche (grade, présence) : un nouveau
 * venu qui se cherche doit se trouver.
 */

const HISTORIQUE_VISIBLE = 20

export const lireFiche = cache(async (pseudoBrut: string, saisonDemandee: number | null) => {
  const pseudo = decodeURIComponent(pseudoBrut)
  const joueur = await trouverJoueur(pseudo)
  if (!joueur) return null
  const [contexte, jouees, toutes] = await Promise.all([contexteSaison(null), saisonsJouees(joueur.uuid), lireSaisonsCache()])
  if (!contexte) return null
  if (saisonDemandee != null && !toutes.some((s) => s.id === saisonDemandee)) return null
  // Sans saison demandée : la saison par défaut si le joueur y a joué, sinon sa plus récente.
  const saison =
    saisonDemandee ?? (jouees.includes(contexte.parDefaut) || jouees.length === 0 ? contexte.parDefaut : jouees[0])
  const [profil, presence, grades, archive] = await Promise.all([
    jouees.includes(saison) ? lireProfil(saison, joueur.pseudo) : Promise.resolve(null),
    lirePresence(joueur.uuid),
    gradesEnCache([joueur.uuid]),
    lireArchiveJoueur(saison, joueur.uuid),
  ])
  return {
    uuid: joueur.uuid,
    pseudo: profil?.pseudo ?? joueur.pseudo,
    saison,
    parDefaut: contexte.parDefaut,
    saisons: toutes.filter((s) => jouees.includes(s.id)),
    jouees,
    profil,
    presence,
    grade: grades.get(joueur.uuid) ?? null,
    archive,
    terminee: toutes.find((s) => s.id === saison)?.terminee ?? false,
  }
})

export async function metadataProfil(pseudo: string, brut: string, saison: number | null): Promise<Metadata> {
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const f = await lireFiche(pseudo, saison)
  if (!f) return { title: ts(locale, 'p.introuvable') }
  const titre = ts(locale, 'p.meta-titre', { p: f.pseudo })
  const description = ts(locale, 'p.meta-desc', { p: f.pseudo })
  return {
    title: titre,
    description,
    alternates: { canonical: lien(locale, cheminProfilSaison(f.pseudo, f.saison, f.parDefaut)) },
    openGraph: { title: titre, description, images: IMAGE_OG },
  }
}

export async function PageProfil({ pseudo, brut, saison: saisonDemandee }: { pseudo: string; brut: string; saison: number | null }) {
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const f = await lireFiche(pseudo, saisonDemandee)
  if (!f) notFound()
  const { profil, presence, grade, saison } = f
  const g = profil?.global ?? null
  const eloGlobal = g?.elo ?? null
  const halo = eloGlobal != null ? palierDe(eloGlobal).couleur : '#fdc003'

  return (
    <PagePublique locale={locale}>
      <main className="pb-6">
        {/* ═══════════════ IDENTITÉ ═══════════════ */}
        <section className="relative overflow-hidden border-b border-bord">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(40% 90% at 12% 60%, ${halo}17, transparent 70%)` }}
          />
          <Conteneur className="relative grid gap-6 pt-6 pb-7 md:grid-cols-[230px_minmax(0,1fr)] md:items-end md:pt-8">
            <Skin3D
              pseudo={f.pseudo}
              alt={f.pseudo}
              pose="combat"
              halo={halo}
              className="mx-auto h-[250px] w-[200px] md:h-[300px] md:w-[230px]"
            />

            <div className="entree min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                {presence.enLigne ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-vert/12 px-2.5 py-0.5 text-[12px] font-semibold text-vert">
                    <span className="pastille-statut !size-1.5" aria-hidden />
                    {ts(locale, 'p.en-ligne')}
                  </span>
                ) : (
                  <span className="text-[12.5px] text-gris">
                    {presence.derniereVenue
                      ? ts(locale, 'p.vu', { t: tempsRelatif(presence.derniereVenue, locale) })
                      : ts(locale, 'p.jamais-vu')}
                  </span>
                )}
                {profil?.exclu && (
                  <span className="rounded-full bg-rouge/12 px-2.5 py-0.5 text-[12px] font-semibold text-rouge">{ts(locale, 'p.exclu')}</span>
                )}
              </div>

              <h1 className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <span className="truncate text-[32px] leading-tight font-extrabold tracking-[-.02em] text-creme sm:text-[42px]">{f.pseudo}</span>
                <BadgeGrade grade={grade} className="!h-6 !px-2 !text-[12px]" />
              </h1>

              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-gris">
                {g && g.rang > 0 && (
                  <li>
                    <Link
                      href={lien(locale, cheminClassement(saison, 'global', f.parDefaut, Math.ceil(g.rang / 100)))}
                      className="font-semibold text-creme hover:text-or"
                    >
                      {ts(locale, 'p.rang-global', { r: g.rang })}
                    </Link>
                    <span className="text-gris"> / {g.total}</span>
                  </li>
                )}
                {presence.premiereVenue && (
                  <li>
                    {ts(locale, 'p.premiere-venue')} <span className="text-creme">{formaterDate(new Date(presence.premiereVenue), locale)}</span>
                  </li>
                )}
                {presence.tempsJeu > 0 && (
                  <li>
                    {ts(locale, 'p.temps-jeu')} <span className="text-creme">{formaterTempsJeu(presence.tempsJeu)}</span>
                  </li>
                )}
                {profil?.discordLie && <li className="text-[#8b95ff]">✓ {ts(locale, 'p.discord-lie')}</li>}
              </ul>

              {f.saisons.length > 0 && (
                <div className="mt-4">
                  <PucesSaison
                    saisons={f.saisons}
                    actuelle={saison}
                    locale={locale}
                    href={(s) => cheminProfilSaison(f.pseudo, s, f.parDefaut)}
                  />
                </div>
              )}

              {g && (
                <Panneau className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 px-4 py-4 sm:grid-cols-3 lg:grid-cols-6">
                  <Chiffre libelle={ts(locale, 'p.elo-global')} sous={<NomPalier elo={g.elo} locale={locale} />}>
                    <Elo valeur={g.elo} className="text-[26px]" />
                  </Chiffre>
                  <Chiffre libelle={ts(locale, 'c.pic')}>
                    <Elo valeur={g.eloMax} />
                  </Chiffre>
                  <Chiffre libelle={ts(locale, 'c.matchs')} sous={<Forme resultats={profil!.forme.slice(0, 5)} locale={locale} />}>
                    <span className="font-mono">{g.matchs}</span>
                  </Chiffre>
                  <Chiffre libelle={`${ts(locale, 'c.v')} / ${ts(locale, 'c.d')}`}>
                    <span className="font-mono">
                      <span className="text-vert">{g.victoires}</span>
                      <span className="text-gris"> / </span>
                      <span className="text-rouge">{g.defaites}</span>
                    </span>
                  </Chiffre>
                  <Chiffre libelle={ts(locale, 'c.winrate')} sous={<BarreWinrate valeur={g.winrate} className="mt-1.5 w-20" />}>
                    <span className="font-mono">{g.winrate}%</span>
                  </Chiffre>
                  <Chiffre libelle={ts(locale, 'p.temps-ranked')} sous={`${ts(locale, 'c.meilleure-serie')} ${g.recordSerie}`}>
                    <span className="font-mono">{formaterTempsJeu(profil!.temps.total)}</span>
                  </Chiffre>
                </Panneau>
              )}
            </div>
          </Conteneur>
        </section>

        {!profil ? (
          <Conteneur className="pt-8">
            <Panneau className="px-6 py-12 text-center">
              <p className="mx-auto max-w-[52ch] text-[15px] text-gris">
                {f.jouees.length === 0
                  ? ts(locale, 'p.aucune-saison', { p: f.pseudo })
                  : ts(locale, 'p.autre-saison', { n: saison, m: f.jouees[0] })}
              </p>
              {f.jouees.length > 0 && (
                <Link
                  href={lien(locale, cheminProfilSaison(f.pseudo, f.jouees[0], f.parDefaut))}
                  className="mt-4 inline-flex h-10 items-center rounded-[6px] bg-or/15 px-4 font-semibold text-or hover:bg-or/25"
                >
                  {ts(locale, 'c.saison', { n: f.jouees[0] })}
                </Link>
              )}
            </Panneau>
            {f.archive && <Archive archive={f.archive} saison={saison} locale={locale} />}
          </Conteneur>
        ) : (
          <>
            {/* ═══════════════ PAR MODE ═══════════════ */}
            <Conteneur className="pt-7">
              <h2 className="mb-3 text-[18px] font-bold text-creme">{ts(locale, 'p.modes')}</h2>
              <CartesModes profil={profil} saison={saison} locale={locale} parDefaut={f.parDefaut} />
            </Conteneur>

            <Conteneur className="grid gap-6 pt-7 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
              <div className="apparition-grille flex min-w-0 flex-col gap-6">
                {profil.courbes.some((c) => c.points.length >= 2) && (
                  <section>
                    <h2 className="mb-3 text-[18px] font-bold text-creme">{ts(locale, 'p.progression')}</h2>
                    <Panneau className="px-3 pt-4 pb-3 sm:px-4">
                      <CourbeElo courbes={profil.courbes} locale={locale} />
                    </Panneau>
                  </section>
                )}

                <section>
                  <h2 className="mb-3 text-[18px] font-bold text-creme">
                    {ts(locale, 'p.historique')}{' '}
                    <span className="text-[14px] font-normal text-gris">({profil.totaux.matchs})</span>
                  </h2>
                  <Panneau className="overflow-hidden">
                    {profil.historique.length === 0 ? (
                      <p className="px-4 py-8 text-center text-[14px] text-gris">{ts(locale, 'p.historique-vide')}</p>
                    ) : (
                      <>
                        {profil.historique.slice(0, HISTORIQUE_VISIBLE).map((m) => (
                          <LigneMatchProfil key={m.id} m={m} locale={locale} />
                        ))}
                        {profil.historique.length > HISTORIQUE_VISIBLE && (
                          <details className="group border-t border-bord">
                            <summary className="cursor-pointer list-none px-4 py-3 text-center text-[13.5px] font-semibold text-or hover:bg-braise/60 group-open:hidden [&::-webkit-details-marker]:hidden">
                              {ts(locale, 'p.voir-plus', { n: profil.historique.length - HISTORIQUE_VISIBLE })}
                            </summary>
                            {profil.historique.slice(HISTORIQUE_VISIBLE).map((m) => (
                              <LigneMatchProfil key={m.id} m={m} locale={locale} />
                            ))}
                          </details>
                        )}
                      </>
                    )}
                  </Panneau>
                </section>
              </div>

              <aside className="apparition-grille flex min-w-0 flex-col gap-6">
                <Records profil={profil} locale={locale} />
                <Rivaux profil={profil} locale={locale} />
                <Activite activite={profil.activite} locale={locale} />
                {f.archive && <Archive archive={f.archive} saison={saison} locale={locale} />}
              </aside>
            </Conteneur>
          </>
        )}
      </main>
    </PagePublique>
  )
}

/* ================================================================ */

function CartesModes({ profil, saison, locale, parDefaut }: { profil: Profil; saison: number; locale: Locale; parDefaut: number }) {
  const joues = new Map(profil.modes.map((m) => [m.mode, m]))
  // Les modes de la saison, puis ceux joués qui n'y figurent plus (anciens ladders).
  const ordre = [...modesDeSaison(saison).map((m) => m.id as string), ...profil.modes.map((m) => m.mode)].filter(
    (id, i, liste) => liste.indexOf(id) === i,
  )
  return (
    <div className="apparition-grille grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 lg:grid-cols-4">
      {ordre.map((id) => {
        const m = joues.get(id)
        const infos = infosMode(id)
        const href = lien(locale, cheminClassement(saison, id as never, parDefaut, m && m.rang > 0 ? Math.ceil(m.rang / 100) : 1))
        if (!m) {
          return (
            <Link key={id} href={href} className="flex items-center gap-3 rounded-[8px] border border-bord/70 bg-charbon/40 px-4 py-3.5 opacity-60 hover:opacity-90">
              <IconeMode mode={id} taille={26} className="grayscale" />
              <span>
                <span className="block text-[14.5px] font-semibold text-creme">{infos.nom}</span>
                <span className="text-[12.5px] text-gris">{ts(locale, 'c.non-classe')}</span>
              </span>
            </Link>
          )
        }
        return (
          <Link
            key={id}
            href={href}
            className="group relative overflow-hidden rounded-[8px] border border-bord bg-charbon px-4 py-3.5 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[color:var(--teinte)] hover:bg-braise"
            style={{ ['--teinte' as string]: `${infos.couleur}88` }}
          >
            <span aria-hidden className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: infos.couleur }} />
            <span className="flex items-center gap-3">
              <IconeMode mode={id} taille={26} />
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold text-creme">{infos.nom}</span>
                <span className="text-[12px] text-gris">
                  {m.rang > 0 ? ts(locale, 'p.rang-mode', { r: m.rang, t: m.total }) : '—'}
                </span>
              </span>
              <span className="text-right">
                <Elo valeur={m.elo} className="block text-[20px] leading-tight" />
                <NomPalier elo={m.elo} locale={locale} />
              </span>
            </span>
            <span className="mt-3 flex items-center justify-between gap-2 text-[12.5px]">
              <span className="font-mono">
                <span className="text-vert">{m.victoires}</span>
                <span className="text-gris"> / </span>
                <span className="text-rouge">{m.defaites}</span>
              </span>
              <span className="text-gris">
                {ts(locale, 'c.pic')} <span className="font-mono text-creme">{m.eloMax}</span>
              </span>
              <span className="font-mono text-creme">{m.winrate}%</span>
            </span>
            <BarreWinrate valeur={m.winrate} className="mt-1.5" />
          </Link>
        )
      })}
    </div>
  )
}

function Records({ profil, locale }: { profil: Profil; locale: Locale }) {
  const r = profil.records
  const lignes: { libelle: string; valeur: React.ReactNode; sous?: string }[] = []
  if (r.plusRapide)
    lignes.push({
      libelle: ts(locale, 'p.plus-rapide'),
      valeur: formaterDuree(r.plusRapide.duree),
      sous: `${infosMode(r.plusRapide.mode).nom} · ${ts(locale, 'p.contre', { p: r.plusRapide.adversaire })}`,
    })
  if (r.plusGrosGain)
    lignes.push({
      libelle: ts(locale, 'p.plus-gros-gain'),
      valeur: <span className="text-vert">+{r.plusGrosGain.gain}</span>,
      sous: `${infosMode(r.plusGrosGain.mode).nom} · ${ts(locale, 'p.contre', { p: r.plusGrosGain.adversaire })}`,
    })
  if (r.plusGrossePerte)
    lignes.push({
      libelle: ts(locale, 'p.plus-grosse-perte'),
      valeur: <span className="text-rouge">−{r.plusGrossePerte.perte}</span>,
      sous: `${infosMode(r.plusGrossePerte.mode).nom} · ${ts(locale, 'p.contre', { p: r.plusGrossePerte.adversaire })}`,
    })
  if (r.dureeMoyenne != null) lignes.push({ libelle: ts(locale, 'p.duree-moyenne'), valeur: formaterDuree(r.dureeMoyenne) })
  lignes.push({ libelle: ts(locale, 'p.clutchs'), valeur: r.clutchs })
  lignes.push({ libelle: ts(locale, 'p.parfaites'), valeur: r.parfaites })
  if (r.modeFavori)
    lignes.push({
      libelle: ts(locale, 'p.mode-favori'),
      valeur: (
        <span className="inline-flex items-center gap-1.5">
          <IconeMode mode={r.modeFavori} taille={16} />
          {infosMode(r.modeFavori).nom}
        </span>
      ),
    })

  return (
    <section>
      <h2 className="mb-3 text-[18px] font-bold text-creme">{ts(locale, 'p.records')}</h2>
      <Panneau className="divide-y divide-bord/60">
        {lignes.map((l) => (
          <div key={l.libelle} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="min-w-0">
              <span className="block text-[13.5px] text-gris">{l.libelle}</span>
              {l.sous && <span className="block truncate text-[12px] text-gris/75">{l.sous}</span>}
            </span>
            <span className="shrink-0 font-mono text-[15px] font-bold text-creme">{l.valeur}</span>
          </div>
        ))}
      </Panneau>
    </section>
  )
}

function Rivaux({ profil, locale }: { profil: Profil; locale: Locale }) {
  const { nemesis, victime, faceAFace } = profil.rivaux
  if (!nemesis && !victime && faceAFace.length === 0) return null
  return (
    <section>
      <h2 className="mb-3 text-[18px] font-bold text-creme">{ts(locale, 'p.rivaux')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {nemesis && <CarteRival r={nemesis} titre={ts(locale, 'p.nemesis')} couleur="text-rouge" locale={locale} />}
        {victime && <CarteRival r={victime} titre={ts(locale, 'p.victime')} couleur="text-vert" locale={locale} />}
      </div>
      {faceAFace.length > 0 && (
        <Panneau className="mt-3 overflow-hidden">
          <p className="border-b border-bord px-4 py-2 text-[11.5px] font-semibold tracking-[.08em] text-gris uppercase">
            {ts(locale, 'p.face-a-face')}
          </p>
          {faceAFace.slice(0, 6).map((r) => (
            <Link
              key={r.uuid}
              href={lien(locale, cheminProfil(r.pseudo))}
              className="flex items-center gap-2.5 border-b border-bord/60 px-4 py-2 text-[14px] last:border-0 hover:bg-braise/60"
            >
              <Tete pseudo={r.pseudo} taille={20} />
              <span className="min-w-0 flex-1 truncate font-semibold text-creme">{r.pseudo}</span>
              <span className="font-mono text-[13px]">
                <span className="text-vert">{r.victoires}</span>
                <span className="text-gris"> – </span>
                <span className="text-rouge">{r.defaites}</span>
              </span>
            </Link>
          ))}
        </Panneau>
      )}
    </section>
  )
}

function CarteRival({ r, titre, couleur, locale }: { r: Rival; titre: string; couleur: string; locale: Locale }) {
  return (
    <Link href={lien(locale, cheminProfil(r.pseudo))} className="rounded-[8px] border border-bord bg-charbon px-3.5 py-3 hover:bg-braise">
      <span className={`block text-[11.5px] font-semibold tracking-[.08em] uppercase ${couleur}`}>{titre}</span>
      <span className="mt-2 flex min-w-0 items-center gap-2">
        <Tete pseudo={r.pseudo} taille={28} />
        <span className="truncate font-semibold text-creme">{r.pseudo}</span>
      </span>
      <span className="mt-1.5 block font-mono text-[13px]">
        <span className="text-vert">{r.victoires}</span>
        <span className="text-gris"> – </span>
        <span className="text-rouge">{r.defaites}</span>
      </span>
    </Link>
  )
}

function Activite({ activite, locale }: { activite: Profil['activite']; locale: Locale }) {
  const max = Math.max(1, ...activite.map((a) => a.matchs))
  return (
    <section>
      <h2 className="mb-3 text-[18px] font-bold text-creme">{ts(locale, 'p.activite')}</h2>
      <Panneau className="px-4 pt-4 pb-3">
        <div className="flex h-20 items-end gap-1">
          {activite.map((a) => {
            const jour = new Date(`${a.jour}T12:00:00Z`).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
              day: 'numeric',
              month: 'short',
            })
            return (
              <span
                key={a.jour}
                title={ts(locale, 'p.activite-aria', { n: a.matchs, d: jour })}
                className={`flex-1 rounded-t-[3px] ${a.matchs ? 'bg-or/80' : 'bg-bord'}`}
                style={{ height: `${a.matchs ? Math.max(8, (a.matchs / max) * 100) : 4}%` }}
              />
            )
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-gris">
          <span>{ts(locale, 'p.il-y-a-14')}</span>
          <span>{ts(locale, 'p.aujourdhui')}</span>
        </div>
      </Panneau>
    </section>
  )
}

function Archive({
  archive,
  saison,
  locale,
}: {
  archive: NonNullable<Awaited<ReturnType<typeof lireArchiveJoueur>>>
  saison: number
  locale: Locale
}) {
  const unranked = archive.practice.filter((p) => !p.ranked)
  if (!archive.ffa && unranked.length === 0) return null
  return (
    <section>
      <h2 className="mb-3 text-[18px] font-bold text-creme">{ts(locale, 'p.archive', { n: saison })}</h2>
      <Panneau className="divide-y divide-bord/60">
        {archive.ffa && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
            <span className="text-gris">{ts(locale, 'p.archive-ffa')}</span>
            <span className="font-mono text-creme">
              {ts(locale, 'p.archive-kills', { k: archive.ffa.kills, m: archive.ffa.morts })}
            </span>
          </div>
        )}
        {unranked.map((p) => (
          <div key={p.mode} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px]">
            <span className="inline-flex items-center gap-2 text-gris">
              <IconeMode mode={p.mode} taille={16} />
              {infosMode(p.mode).nom} · {ts(locale, 'p.archive-unranked')}
            </span>
            <span className="font-mono">
              <span className="text-vert">{p.victoires}</span>
              <span className="text-gris"> / </span>
              <span className="text-rouge">{p.defaites}</span>
            </span>
          </div>
        ))}
      </Panneau>
    </section>
  )
}
