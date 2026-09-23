import { formaterDateHeure } from '@/lib/format'
import { t, type Locale } from '@/lib/i18n'
import type { SanctionProfil, TypeSanction } from '@/lib/sanctions'
import { tempsRelatif } from '@/lib/practice-commun'

/**
 * LE CASIER D'UN JOUEUR.
 *
 * Une ligne par sanction : ce que c'est, pourquoi, quand, et si elle court
 * toujours. Le nom du staff n'apparaît pas (voir lib/sanctions.ts).
 *
 * La couleur ne porte JAMAIS l'information seule : chaque ligne écrit son
 * type en toutes lettres, et l'état en clair à droite. Un daltonien lit la
 * même chose que les autres.
 *
 * Un joueur sans sanction voit une phrase, pas un tableau vide : c'est une
 * bonne nouvelle, elle mérite d'être dite.
 */

/**
 * Les clés de texte sont ÉCRITES, pas fabriquées : `t()` n'accepte que des
 * clés connues, et c'est exactement ce qui empêche un libellé manquant de
 * passer en production.
 */
const LIBELLES = {
  BAN: 'pr.sanction-ban',
  RANKEDBAN: 'pr.sanction-rankedban',
  TEMPBAN: 'pr.sanction-tempban',
  RANKEDTEMPBAN: 'pr.sanction-rankedtempban',
  MUTE: 'pr.sanction-mute',
  WARN: 'pr.sanction-warn',
  KICK: 'pr.sanction-kick',
} as const

const ETATS = {
  active: 'pr.sanction-etat-active',
  levee: 'pr.sanction-etat-levee',
  expiree: 'pr.sanction-etat-expiree',
} as const

/** Couleur de la pastille, par gravité. */
const TONS: Record<TypeSanction, string> = {
  BAN: 'border-oni/50 bg-oni/15 text-oni',
  RANKEDBAN: 'border-oni/50 bg-oni/15 text-oni',
  TEMPBAN: 'border-soupe/50 bg-soupe/15 text-soupe',
  RANKEDTEMPBAN: 'border-soupe/50 bg-soupe/15 text-soupe',
  MUTE: 'border-or/40 bg-or/12 text-or',
  WARN: 'border-or/40 bg-or/12 text-or',
  KICK: 'border-bord bg-braise text-gris',
}

/**
 * LES MOTIFS SONT PARFOIS DÉJÀ BILINGUES.
 *
 * L'anticheat écrit « Combat anormal | Abnormal combat packets » dans la
 * raison : un seul champ, deux langues séparées par une barre. On rend donc
 * la moitié qui correspond à la langue du lecteur. Un motif écrit à la main
 * par le staff n'a pas de barre : il est rendu tel quel, dans les deux
 * langues — traduire la prose du staff n'est pas notre travail.
 */
function motif(raison: string | null, locale: Locale): string | null {
  if (!raison) return null
  const moities = raison.split('|').map((m) => m.trim()).filter(Boolean)
  if (moities.length !== 2) return raison.trim()
  return locale === 'en' ? moities[1] : moities[0]
}

export function Sanctions({
  sanctions,
  locale,
  pseudo,
}: {
  sanctions: SanctionProfil[]
  locale: Locale
  pseudo: string
}) {
  if (sanctions.length === 0) {
    return (
      <p className="text-[15px] text-gris">
        {t(locale, 'pr.sanctions-vide').replace('{p}', pseudo)}
      </p>
    )
  }

  return (
    <ol className="space-y-2">
      {sanctions.map((s, i) => (
        <li
          key={`${s.type}-${s.creeLe.getTime()}-${i}`}
          className="flex flex-wrap items-start gap-x-4 gap-y-2 rounded-carte border border-bord bg-charbon/60 px-4 py-3"
        >
          <span
            className={`inline-flex min-w-[124px] justify-center rounded-controle border px-2.5 py-1 font-mono text-[11px] tracking-[.1em] uppercase ${TONS[s.type]}`}
          >
            {t(locale, LIBELLES[s.type])}
          </span>

          <span className="min-w-[180px] flex-1 text-[15px] text-creme">
            {motif(s.raison, locale) || t(locale, 'pr.sanction-sans-raison')}
          </span>

          <span className="font-mono text-[11px] tracking-[.08em] text-gris uppercase">
            <time dateTime={s.creeLe.toISOString()} title={formaterDateHeure(s.creeLe, locale)}>
              {tempsRelatif(s.creeLe, locale)}
            </time>
          </span>

          <span
            className={`font-mono text-[11px] tracking-[.08em] uppercase ${
              s.etat === 'active' ? 'text-oni' : 'text-gris/70'
            }`}
          >
            {s.etat === 'active' && s.expireLe
              ? t(locale, 'pr.sanction-jusqu-a').replace('{d}', formaterDateHeure(s.expireLe, locale))
              : t(locale, `pr.sanction-etat-${s.etat}`)}
          </span>
        </li>
      ))}
    </ol>
  )
}
