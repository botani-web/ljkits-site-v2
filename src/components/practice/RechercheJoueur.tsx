'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { lien, t, type Locale } from '@/lib/i18n'
import { nomPalier, palierDe } from '@/lib/paliers'
import { cheminProfil, urlTete } from '@/lib/practice-commun'

type Suggestion = { uuid: string; pseudo: string; elo: number }

/**
 * La recherche de joueur : suggestions pendant la frappe, clavier complet
 * (↑ ↓ Entrée Échap), et Entrée sur une saisie sans suggestion tente quand
 * même le profil — un pseudo exact trouve sa fiche même s'il n'est pas classé.
 *
 * Accessibilité : motif « combobox » du WAI-ARIA, la suggestion active est
 * annoncée par aria-activedescendant.
 */
export function RechercheJoueur({
  locale,
  grand = false,
  className = '',
}: {
  locale: Locale
  grand?: boolean
  className?: string
}) {
  const routeur = useRouter()
  const identifiant = useId()
  const boite = useRef<HTMLDivElement>(null)
  const [saisie, setSaisie] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [ouvert, setOuvert] = useState(false)
  const [actif, setActif] = useState(-1)
  const [charge, setCharge] = useState(false)

  useEffect(() => {
    const requete = saisie.trim()
    if (!requete) {
      setSuggestions([])
      setOuvert(false)
      return
    }
    const annulation = new AbortController()
    // 160 ms : assez pour ne pas interroger à chaque lettre d'un pseudo tapé vite.
    const minuteur = setTimeout(async () => {
      setCharge(true)
      try {
        const reponse = await fetch(`/api/practice/recherche?q=${encodeURIComponent(requete)}`, {
          signal: annulation.signal,
        })
        const donnees = (await reponse.json()) as { joueurs: Suggestion[] }
        setSuggestions(donnees.joueurs)
        setActif(donnees.joueurs.length > 0 ? 0 : -1)
        setOuvert(true)
      } catch {
        // Frappe suivante (abandon) ou réseau coupé : on garde l'état affiché.
      } finally {
        if (!annulation.signal.aborted) setCharge(false)
      }
    }, 160)
    return () => {
      clearTimeout(minuteur)
      annulation.abort()
    }
  }, [saisie])

  useEffect(() => {
    const fermer = (evenement: PointerEvent) => {
      if (!boite.current?.contains(evenement.target as Node)) setOuvert(false)
    }
    document.addEventListener('pointerdown', fermer)
    return () => document.removeEventListener('pointerdown', fermer)
  }, [])

  const ouvrirProfil = (pseudo: string) => {
    setOuvert(false)
    routeur.push(lien(locale, cheminProfil(pseudo)))
  }

  const auClavier = (evenement: React.KeyboardEvent<HTMLInputElement>) => {
    if (evenement.key === 'ArrowDown' && suggestions.length) {
      evenement.preventDefault()
      setOuvert(true)
      setActif((i) => (i + 1) % suggestions.length)
    } else if (evenement.key === 'ArrowUp' && suggestions.length) {
      evenement.preventDefault()
      setOuvert(true)
      setActif((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (evenement.key === 'Enter') {
      evenement.preventDefault()
      const choisie = ouvert && actif >= 0 ? suggestions[actif] : undefined
      if (choisie) ouvrirProfil(choisie.pseudo)
      else if (saisie.trim()) ouvrirProfil(saisie.trim())
    } else if (evenement.key === 'Escape') {
      setOuvert(false)
    }
  }

  const liste = `${identifiant}-liste`
  const aucun = ouvert && !charge && saisie.trim() !== '' && suggestions.length === 0

  return (
    <div ref={boite} className={`relative ${className}`}>
      <label htmlFor={`${identifiant}-champ`} className="sr-only">
        {t(locale, 'pr.recherche-aria')}
      </label>
      <div
        className={`flex items-center gap-3 rounded-controle border border-bord bg-charbon/90 px-4 backdrop-blur transition-colors focus-within:border-or/70 ${
          grand ? 'h-14' : 'h-11'
        }`}
      >
        <svg viewBox="0 0 24 24" className="size-[18px] shrink-0 text-gris" aria-hidden>
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-4.2-4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id={`${identifiant}-champ`}
          type="search"
          role="combobox"
          aria-expanded={ouvert && suggestions.length > 0}
          aria-controls={liste}
          aria-autocomplete="list"
          aria-activedescendant={ouvert && actif >= 0 ? `${identifiant}-option-${actif}` : undefined}
          autoComplete="off"
          spellCheck={false}
          maxLength={16}
          value={saisie}
          placeholder={t(locale, 'pr.recherche-placeholder')}
          onChange={(e) => setSaisie(e.target.value)}
          onFocus={() => suggestions.length && setOuvert(true)}
          onKeyDown={auClavier}
          className={`w-full bg-transparent text-creme outline-none placeholder:text-gris/70 ${grand ? 'text-[16px]' : 'text-[15px]'}`}
        />
        {charge && <span aria-hidden className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-bord border-t-or" />}
      </div>

      {ouvert && (suggestions.length > 0 || aucun) && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-carte border border-bord bg-charbon shadow-[0_18px_50px_-12px_rgba(0,0,0,.7)]">
          {aucun ? (
            <p className="px-4 py-5 text-center font-mono text-[12px] text-gris">{t(locale, 'pr.recherche-aucun')}</p>
          ) : (
            <ul id={liste} role="listbox" className="max-h-[320px] overflow-y-auto py-1">
              {suggestions.map((joueur, index) => {
                const palier = palierDe(joueur.elo)
                return (
                  <li
                    key={joueur.uuid}
                    id={`${identifiant}-option-${index}`}
                    role="option"
                    aria-selected={index === actif}
                    onPointerEnter={() => setActif(index)}
                    onClick={() => ouvrirProfil(joueur.pseudo)}
                    className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition-colors ${
                      index === actif ? 'bg-braise' : ''
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlTete(joueur.pseudo, 32)} alt="" width={28} height={28} className="rounded-micro [image-rendering:pixelated]" />
                    <span className="min-w-0 flex-1 truncate font-semibold">{joueur.pseudo}</span>
                    <span className="font-mono text-[10px] tracking-[.1em] uppercase" style={{ color: palier.couleur }}>
                      {nomPalier(palier, locale)}
                    </span>
                    <span className="w-11 text-right font-mono text-[13px] font-bold tabular-nums" style={{ color: palier.couleur }}>
                      {joueur.elo}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="hidden border-t border-bord bg-nuit px-3.5 py-2 font-mono text-[10px] tracking-[.08em] text-gris sm:block">
            {t(locale, 'pr.recherche-aide')}
          </p>
        </div>
      )}
    </div>
  )
}
