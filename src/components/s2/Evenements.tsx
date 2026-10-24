import Link from 'next/link'

import { Panneau, Tete } from '@/components/s2/Briques'
import { type Evenement, type ResumeEvenement, type Statut } from '@/lib/evenements'
import { champ, lien, type Locale } from '@/lib/i18n'
import { dateEvenement, te } from '@/lib/i18n-evenements'

/**
 * LES BRIQUES DES ÉVÉNEMENTS (24/10/2026) : badge de statut et carte de la liste.
 * Rendues côté serveur, comme les briques de la refonte S2.
 */

export function cheminEvenement(slug: string): string {
  return `/evenements/${encodeURIComponent(slug)}`
}

export function nomEvenement(locale: Locale, e: Evenement): string {
  return champ(locale, e.nom, e.nomEn)
}

export function BadgeStatut({ statut, locale, className = '' }: { statut: Statut; locale: Locale; className?: string }) {
  const classes =
    statut === 'en-direct'
      ? 'border-vert/40 bg-vert/12 text-vert'
      : statut === 'a-venir'
        ? 'border-or/40 bg-or/10 text-or'
        : 'border-bord bg-braise text-gris'
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-[3px] text-[11.5px] font-bold uppercase tracking-[.08em] ${classes} ${className}`}>
      {statut === 'en-direct' && <span className="pastille-statut" aria-hidden />}
      {te(locale, `statut.${statut}`)}
    </span>
  )
}

export function CarteEvenement({ r, locale }: { r: ResumeEvenement; locale: Locale }) {
  const e = r.evenement
  const href = lien(locale, cheminEvenement(e.slug))
  return (
    <Panneau as="article" className="group relative overflow-hidden transition-colors hover:border-soupe/50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_100%_0%,rgba(254,147,1,.10),transparent_70%)]" />
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <BadgeStatut statut={r.statut} locale={locale} />
            <span className="rounded-full border border-bord px-2.5 py-[3px] text-[11.5px] font-semibold text-gris">{te(locale, 'jeu.hgrun')}</span>
          </div>
          <h3 className="mt-2.5 text-[20px] font-extrabold tracking-[-.01em] text-creme">
            <Link href={href} className="after:absolute after:inset-0 hover:text-or">
              {nomEvenement(locale, e)}
            </Link>
          </h3>
          <p className="mt-1 text-[14px] text-gris first-letter:uppercase">
            {dateEvenement(locale, e.debut)}
            {r.manches > 0 && <> · {te(locale, 'carte.manches', { n: r.manches })}</>}
            {r.joueurs > 0 && <> · {te(locale, 'carte.joueurs', { n: r.joueurs })}</>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-5">
          {e.cashprize && (
            <div className="text-right">
              <div className="text-[11.5px] font-medium uppercase tracking-[.08em] text-gris">{te(locale, 'ev.cashprize')}</div>
              <div className="text-[24px] font-extrabold leading-tight text-or">{e.cashprize}</div>
            </div>
          )}
          {r.gagnant && (
            <div className="flex items-center gap-2.5 rounded-[8px] border border-bord bg-nuit/60 px-3 py-2">
              <Tete pseudo={r.gagnant.pseudo} taille={34} />
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-[.08em] text-gris">
                  {te(locale, r.statut === 'termine' ? 'carte.gagnant' : 'carte.leader')}
                </div>
                <div className="truncate text-[15px] font-bold text-creme">{r.gagnant.pseudo}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Panneau>
  )
}
