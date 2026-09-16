import Link from 'next/link'

import { Section } from '@/components/ui/Section'
import { lien, t, type Locale } from '@/lib/i18n'
import { palierDe } from '@/lib/paliers'
import { cheminProfil, formaterDuree, tempsRelatif, urlTete } from '@/lib/practice-commun'
import type { MatchRecent } from '@/lib/practice'

import { PastilleMode } from './Petits'

/** Les derniers matchs ranked joués sur le serveur (ou dans le mode affiché). */
export function DerniersMatchs({ matchs, locale }: { matchs: MatchRecent[]; locale: Locale }) {
  if (matchs.length === 0) return null

  const joueur = (pseudo: string, elo: number, delta: number, gagnant: boolean) => (
    <Link
      href={lien(locale, cheminProfil(pseudo))}
      className="flex min-w-0 items-center gap-2 transition-colors hover:text-or"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={urlTete(pseudo, 32)} alt="" width={24} height={24} loading="lazy" className="shrink-0 rounded-micro [image-rendering:pixelated]" />
      <span className="min-w-0">
        <span className={`block truncate text-[14px] font-semibold ${gagnant ? 'text-creme' : 'text-gris'}`}>{pseudo}</span>
        <span className="block font-mono text-[10.5px] tabular-nums">
          <span style={{ color: palierDe(elo).couleur }}>{elo}</span>{' '}
          <span className={gagnant ? 'text-vert' : 'text-rouge'}>{gagnant ? `+${delta}` : `−${delta}`}</span>
        </span>
      </span>
    </Link>
  )

  return (
    <Section
      fond="charbon"
      etiquette={
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="point-respirant" />
          {t(locale, 'pr.derniers-etiquette')}
        </span>
      }
      titre={t(locale, 'pr.derniers-titre')}
    >
      <ol className="grid gap-2.5 md:grid-cols-2">
        {matchs.map((m) => (
          <li
            key={m.id}
            className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-carte border border-bord bg-braise px-4 py-3"
          >
            {joueur(m.gagnantPseudo, m.eloGagnantApres, m.gain, true)}
            <span className="text-center">
              <PastilleMode mode={m.mode} />
              <span className="block font-mono text-[10px] text-gris">
                {t(locale, 'pr.bat')} · {formaterDuree(m.duree)}
              </span>
            </span>
            <span className="flex min-w-0 items-center justify-end gap-3">
              {joueur(m.perdantPseudo, m.eloPerdantApres, m.perte, false)}
            </span>
            <span className="col-span-3 -mt-1 text-right font-mono text-[10px] text-gris/80">
              {tempsRelatif(m.instant, locale)}
            </span>
          </li>
        ))}
      </ol>
    </Section>
  )
}
