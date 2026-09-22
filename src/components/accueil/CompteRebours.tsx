'use client'

import { useEffect, useState } from 'react'

import { useLocale } from '@/hooks/useLocale'
import { t } from '@/lib/i18n'

/**
 * Le temps qui reste avant la clôture de la saison — et donc avant le
 * versement du cashprize.
 *
 * Jamais rendu côté serveur : la page est en cache, un décompte calculé au
 * rendu serait faux dès la seconde suivante. Le serveur envoie des tirets,
 * le navigateur les remplace au montage.
 *
 * Les cases qui changent chaque seconde sont masquées aux lecteurs d'écran
 * (un bavardage continu) : ils lisent la date de clôture écrite en toutes
 * lettres, passée par `dateLisible`.
 */
export function CompteRebours({
  fin,
  dateLisible,
  compact = false,
}: {
  /** L'instant de clôture, en ISO. */
  fin: string
  /** « lundi 12 octobre à 14h30 », formaté côté serveur en heure de Paris. */
  dateLisible: string
  /** Plus petit : le bloc d'appel de fin de page. */
  compact?: boolean
}) {
  const locale = useLocale()
  const [restant, setRestant] = useState<number | null>(null)

  useEffect(() => {
    const cible = Date.parse(fin)
    const battre = () => {
      const secondes = Math.max(0, Math.floor((cible - Date.now()) / 1000))
      setRestant(secondes)
      return secondes === 0
    }
    if (battre()) return
    const minuteur = setInterval(() => {
      if (battre()) clearInterval(minuteur)
    }, 1000)
    return () => clearInterval(minuteur)
  }, [fin])

  if (restant === 0) {
    return (
      <p className="font-mono text-[12px] font-bold tracking-[.14em] text-or uppercase">
        {t(locale, 'ac.rebours-cloture')}
      </p>
    )
  }

  const cases = [
    { valeur: restant === null ? null : Math.floor(restant / 86_400), cle: 'ac.rebours-j' as const },
    { valeur: restant === null ? null : Math.floor((restant % 86_400) / 3_600), cle: 'ac.rebours-h' as const },
    { valeur: restant === null ? null : Math.floor((restant % 3_600) / 60), cle: 'ac.rebours-min' as const },
    { valeur: restant === null ? null : restant % 60, cle: 'ac.rebours-s' as const },
  ]

  return (
    <div>
      <p className="sr-only">{t(locale, 'ac.rebours-sr').replace('{d}', dateLisible)}</p>
      <ol aria-hidden className={`grid grid-cols-4 ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {cases.map((c) => (
          <li
            key={c.cle}
            className={`rounded-controle border border-bord bg-nuit text-center ${compact ? 'px-2 py-2' : 'px-1.5 py-2.5'}`}
          >
            <span
              className={`block font-titre leading-none tabular-nums text-creme ${
                compact ? 'text-[clamp(18px,4vw,24px)]' : 'text-[clamp(22px,3vw,30px)]'
              }`}
            >
              {c.valeur === null ? '--' : String(c.valeur).padStart(2, '0')}
            </span>
            <span className="mt-1.5 block font-mono text-[9.5px] tracking-[.16em] text-gris uppercase">
              {t(locale, c.cle)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
