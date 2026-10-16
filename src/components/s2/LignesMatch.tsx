import Link from 'next/link'

import { BadgeGrade, Delta, Elo, IconeMode, Tete } from '@/components/s2/Briques'
import type { Grade } from '@/lib/grades-commun'
import { lien, t, type Locale } from '@/lib/i18n'
import { ts } from '@/lib/i18n-s2'
import type { MatchProfil, MatchRecent } from '@/lib/practice'
import { cheminMatchCourt, cleRaison, formaterDuree, infosMode, tempsRelatif } from '@/lib/practice-commun'

/**
 * LES LIGNES DE MATCH (refonte S2, 16/10/2026) : chaque ligne est un lien vers
 * le récap du match. Deux points de vue : neutre (flux, accueil) ou celui d'un
 * joueur (son historique).
 */

/** Vu de nulle part : « gagnant +12  vs  −9 perdant ». */
export function LigneMatchNeutre({
  m,
  locale,
  grades,
  compacte = false,
}: {
  m: MatchRecent
  locale: Locale
  grades?: Map<string, Grade>
  compacte?: boolean
}) {
  const annule = m.annule != null
  return (
    <Link
      href={lien(locale, cheminMatchCourt(m.id))}
      className="ligne-survol group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-bord/60 px-3.5 py-2.5 last:border-0 hover:bg-braise/70 sm:px-4"
    >
      <span className="grid size-8 place-items-center rounded-[6px] bg-nuit/70" title={infosMode(m.mode).nom}>
        <IconeMode mode={m.mode} taille={18} />
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px]">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Tete pseudo={m.gagnantPseudo} taille={20} />
          <span className="truncate font-semibold text-creme group-hover:text-or">{m.gagnantPseudo}</span>
          {grades && <BadgeGrade grade={grades.get(m.gagnant)} />}
          <Delta valeur={m.gain} annule={annule} className="text-[12px]" />
        </span>
        <span className="text-[12px] text-gris">{ts(locale, 'c.vs')}</span>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Tete pseudo={m.perdantPseudo} taille={20} />
          <span className="truncate text-gris">{m.perdantPseudo}</span>
          {!compacte && <Delta valeur={-m.perte} annule={annule} className="text-[12px]" />}
        </span>
      </span>
      <span className="text-right text-[12px] whitespace-nowrap text-gris">
        {!compacte && <span className="mr-2 hidden font-mono text-creme/80 sm:inline">{formaterDuree(m.duree)}</span>}
        {annule ? <span className="text-soupe">{ts(locale, 'c.annule')}</span> : tempsRelatif(m.instant, locale)}
      </span>
    </Link>
  )
}

/** Vu par un joueur : sa victoire ou sa défaite, contre qui, et ce que ça lui a rapporté. */
export function LigneMatchProfil({ m, locale }: { m: MatchProfil; locale: Locale }) {
  const annule = m.annule != null
  return (
    <Link
      href={lien(locale, cheminMatchCourt(m.id))}
      className="ligne-survol group relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-bord/60 py-2.5 pr-3.5 pl-4 last:border-0 hover:bg-braise/70 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
    >
      <span
        aria-hidden
        className={`absolute inset-y-1.5 left-0 w-[3px] rounded-r-full ${annule ? 'bg-gris/50' : m.victoire ? 'bg-vert' : 'bg-rouge'}`}
      />
      <span className="flex items-center gap-2.5">
        <span
          className={`w-6 text-center font-mono text-[12px] font-bold ${annule ? 'text-gris' : m.victoire ? 'text-vert' : 'text-rouge'}`}
        >
          {m.victoire ? ts(locale, 'c.v') : ts(locale, 'c.d')}
        </span>
        <IconeMode mode={m.mode} taille={18} />
      </span>
      <span className="flex min-w-0 items-center gap-2 text-[14px]">
        <span className="text-[12px] text-gris">{ts(locale, 'c.vs')}</span>
        <Tete pseudo={m.adversairePseudo} taille={20} />
        <span className="truncate font-semibold text-creme group-hover:text-or">{m.adversairePseudo}</span>
        <span className="hidden truncate text-[12px] text-gris md:inline">· {t(locale, cleRaison(m.raison))}</span>
      </span>
      <span className="hidden text-right font-mono text-[12.5px] text-gris sm:block">{formaterDuree(m.duree)}</span>
      <span className="flex flex-col items-end leading-tight">
        <span className="whitespace-nowrap">
          <Elo valeur={m.eloApres} className="text-[13.5px]" /> <Delta valeur={m.delta} annule={annule} className="text-[12.5px]" />
        </span>
        <span className="text-[11.5px] whitespace-nowrap text-gris">
          {annule ? <span className="text-soupe">{ts(locale, 'c.annule')}</span> : tempsRelatif(m.instant, locale)}
        </span>
      </span>
    </Link>
  )
}
