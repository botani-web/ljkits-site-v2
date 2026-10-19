'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { useLocale } from '@/hooks/useLocale'
import { lien } from '@/lib/i18n'
import { ts } from '@/lib/i18n-s2'
import { type EtatPalier, palierAffiche } from '@/lib/paliers'
import { cheminProfil, urlTete } from '@/lib/practice-commun'

type Trouve = { uuid: string; pseudo: string; elo: number; saison: number; etatPalier?: EtatPalier | null }

/**
 * La recherche de joueur de la barre de navigation (16/10/2026).
 *
 * Suggestions pendant la frappe (toutes saisons confondues), clavier complet
 * (↑ ↓ Entrée Échap) et « / » n'importe où sur la page pour y venir. Entrée sur
 * une saisie sans suggestion ouvre quand même le profil : un pseudo exact trouve
 * sa fiche même sans ranked. Motif « combobox » du WAI-ARIA.
 *
 * Les profils suggérés sont préchargés dès qu'ils s'affichent : le clic ouvre
 * une page déjà là.
 */
export function RechercheNav({ className = '', autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  const locale = useLocale()
  const routeur = useRouter()
  const identifiant = useId()
  const champ = useRef<HTMLInputElement>(null)
  const boite = useRef<HTMLDivElement>(null)
  const [saisie, setSaisie] = useState('')
  const [resultats, setResultats] = useState<Trouve[]>([])
  const [ouvert, setOuvert] = useState(false)
  const [actif, setActif] = useState(-1)

  useEffect(() => {
    const q = saisie.trim()
    if (!q) {
      setResultats([])
      setOuvert(false)
      return
    }
    const annulation = new AbortController()
    const minuteur = setTimeout(async () => {
      try {
        const reponse = await fetch(`/api/joueurs/recherche?q=${encodeURIComponent(q)}`, { signal: annulation.signal })
        const donnees = (await reponse.json()) as { joueurs: Trouve[] }
        setResultats(donnees.joueurs)
        setActif(donnees.joueurs.length > 0 ? 0 : -1)
        setOuvert(true)
        for (const j of donnees.joueurs.slice(0, 3)) routeur.prefetch(lien(locale, cheminProfil(j.pseudo)))
      } catch {
        // Frappe suivante ou réseau coupé : on garde ce qui est affiché.
      }
    }, 140)
    return () => {
      annulation.abort()
      clearTimeout(minuteur)
    }
  }, [saisie, locale, routeur])

  // « / » donne le focus à la recherche, sauf si on écrit déjà quelque part.
  useEffect(() => {
    function touche(e: KeyboardEvent) {
      const cible = e.target as HTMLElement | null
      if (e.key !== '/' || cible?.closest('input, textarea, [contenteditable="true"]')) return
      if (!champ.current || champ.current.offsetParent === null) return
      e.preventDefault()
      champ.current.focus()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [])

  useEffect(() => {
    function clic(e: MouseEvent) {
      if (boite.current && !boite.current.contains(e.target as Node)) setOuvert(false)
    }
    document.addEventListener('mousedown', clic)
    return () => document.removeEventListener('mousedown', clic)
  }, [])

  function ouvrir(pseudo: string) {
    setOuvert(false)
    setSaisie('')
    champ.current?.blur()
    routeur.push(lien(locale, cheminProfil(pseudo)))
  }

  function clavier(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOuvert(true)
      setActif((a) => Math.min(resultats.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActif((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const choisi = ouvert && actif >= 0 ? resultats[actif] : null
      const q = saisie.trim()
      if (choisi) ouvrir(choisi.pseudo)
      else if (/^[A-Za-z0-9_]{1,16}$/.test(q)) ouvrir(q)
    } else if (e.key === 'Escape') {
      setOuvert(false)
      champ.current?.blur()
    }
  }

  const liste = `${identifiant}-liste`
  const q = saisie.trim()

  return (
    <div ref={boite} className={`relative ${className}`}>
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gris"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="8.5" cy="8.5" r="5.5" />
        <path d="M13 13l4 4" />
      </svg>
      <input
        ref={champ}
        type="search"
        role="combobox"
        aria-expanded={ouvert}
        aria-controls={liste}
        aria-autocomplete="list"
        aria-activedescendant={ouvert && actif >= 0 ? `${identifiant}-${actif}` : undefined}
        aria-label={ts(locale, 'recherche.aria')}
        placeholder={ts(locale, 'recherche.placeholder')}
        autoComplete="off"
        spellCheck={false}
        maxLength={16}
        autoFocus={autoFocus}
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
        onFocus={() => q && setOuvert(true)}
        onKeyDown={clavier}
        className="h-10 w-full rounded-[6px] border border-bord bg-nuit/70 pr-9 pl-9 text-[14px] text-creme placeholder:text-gris/80 focus:border-or/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-[3px] border border-bord px-1.5 font-mono text-[11px] text-gris lg:block">
        /
      </kbd>

      {ouvert && q && (
        <ul
          id={liste}
          role="listbox"
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 overflow-hidden rounded-[8px] border border-bord bg-charbon py-1 shadow-[0_18px_40px_rgba(0,0,0,.55)]"
        >
          {resultats.map((j, i) => (
            <li
              key={j.uuid}
              id={`${identifiant}-${i}`}
              role="option"
              aria-selected={i === actif}
              onMouseEnter={() => setActif(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                ouvrir(j.pseudo)
              }}
              className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[14px] ${i === actif ? 'bg-braise' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlTete(j.pseudo, 48)} alt="" width={22} height={22} className="rounded-[3px] [image-rendering:pixelated]" />
              <span className="min-w-0 flex-1 truncate font-semibold text-creme">{j.pseudo}</span>
              <span className="font-mono text-[12.5px] font-bold" style={{ color: palierAffiche(j.elo, j.etatPalier).couleur }}>
                {j.elo}
              </span>
              <span className="w-7 text-right font-mono text-[10.5px] text-gris">{ts(locale, 'c.saison-courte', { n: j.saison })}</span>
            </li>
          ))}
          {resultats.length === 0 && (
            <li className="px-3 py-2.5 text-[13.5px] text-gris">
              {ts(locale, 'recherche.aucun')}
              {/^[A-Za-z0-9_]{1,16}$/.test(q) && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    ouvrir(q)
                  }}
                  className="mt-1 block text-left font-semibold text-or hover:text-soupe"
                >
                  {ts(locale, 'recherche.ouvrir', { q })}
                </button>
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
