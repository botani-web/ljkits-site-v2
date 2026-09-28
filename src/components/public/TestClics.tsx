'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { classesBouton } from '@/components/ui/Bouton'
import { t, type Locale } from '@/lib/i18n'

/**
 * LE TEST DE CLIC — CÔTÉ NAVIGATEUR.  (28/09/2026)
 *
 * Il ne mesure rien lui-même : il DATE chaque appui et chaque relâchement du
 * bouton gauche (`event.timeStamp`, précis à la fraction de milliseconde),
 * additionne le déplacement de la souris, et envoie tout au panel qui juge.
 *
 * ── LES CHOIX QUI COMPTENT ────────────────────────────────────────────────
 * - `pointerdown` et non `click` : `click` n'arrive qu'au relâchement, et deux
 *   clics très rapprochés peuvent être fusionnés en double-clic par le
 *   navigateur. Le jeu, lui, compte chaque appui.
 * - `isTrusted` est transmis : un clic fabriqué par un script dans la page
 *   (console du navigateur) vaut `false`. Un autoclicker du système passe pour
 *   vrai — c'est la RÉGULARITÉ qui le trahit, côté panel.
 * - Les clics ne passent pas par l'état React (un rendu par clic à 20 CPS
 *   ferait ramer la page et fausserait les instants) : ils vont dans une
 *   référence, et l'affichage se rafraîchit à chaque image.
 * - Pas de verdict affiché : un tricheur ne doit pas pouvoir régler son
 *   autoclicker à tâtons jusqu'à passer.
 */

const PANEL = process.env.NEXT_PUBLIC_PANEL_URL ?? 'https://panel.ljkits.eu'

type Clic = { d: number; u?: number; v: boolean }
type Essai = { clics: Clic[]; pointeur: string; mouvement: number }
type Session = { id: string; jeton: string; joueur: string; essais: number; duree: number; cpsJeu: number }
type Phase = 'code' | 'pret' | 'essai' | 'entre' | 'envoi' | 'fini'

/** Le plus petit écart non nul de `performance.now()` : la précision réelle du navigateur. */
function precisionHorloge(): number {
  let min = Infinity
  let avant = performance.now()
  for (let i = 0; i < 2000; i++) {
    const maintenant = performance.now()
    if (maintenant > avant) min = Math.min(min, maintenant - avant)
    avant = maintenant
  }
  return Math.round(min * 1000) / 1000
}

export function TestClics({ locale }: { locale: Locale }) {
  const [phase, setPhase] = useState<Phase>('code')
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [numero, setNumero] = useState(1)
  const [affichage, setAffichage] = useState({ reste: 15, cps: 0, clics: 0 })

  const essais = useRef<Essai[]>([])
  const courant = useRef<Essai | null>(null)
  const debut = useRef<number | null>(null)
  const dernierePos = useRef<{ x: number; y: number } | null>(null)
  const image = useRef<number | null>(null)

  const ouvrir = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setErreur(null)
      try {
        const r = await fetch(`${PANEL}/api/verif/ouvrir`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code.trim().toUpperCase() }),
        })
        if (r.status === 429) return setErreur(t(locale, 'verif.erreur-essais'))
        if (!r.ok) return setErreur(t(locale, 'verif.erreur-code'))
        setSession(await r.json())
        setPhase('pret')
      } catch {
        setErreur(t(locale, 'verif.erreur-reseau'))
      }
    },
    [code, locale],
  )

  const terminerEssai = useCallback(() => {
    if (image.current) cancelAnimationFrame(image.current)
    image.current = null
    if (courant.current) essais.current.push(courant.current)
    courant.current = null
    debut.current = null
    setPhase('entre')
  }, [])

  // Rafraîchit le chrono et le compteur à chaque image, et clôt l'essai à 15 s.
  const boucle = useCallback(() => {
    if (!session || debut.current === null || !courant.current) return
    const ecoule = performance.now() - debut.current
    if (ecoule >= session.duree) return terminerEssai()
    const n = courant.current.clics.length
    setAffichage({
      reste: Math.ceil((session.duree - ecoule) / 1000),
      cps: ecoule > 500 ? Math.round((n / ecoule) * 1000 * 10) / 10 : 0,
      clics: n,
    })
    image.current = requestAnimationFrame(boucle)
  }, [session, terminerEssai])

  const appui = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || !session) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      if (e.pointerType !== 'mouse') {
        courant.current = null
        debut.current = null
        setErreur(t(locale, 'verif.pas-souris'))
        setPhase('pret')
        return
      }
      if (phase === 'pret') {
        setErreur(null)
        courant.current = { clics: [], pointeur: e.pointerType, mouvement: 0 }
        debut.current = e.timeStamp
        dernierePos.current = { x: e.clientX, y: e.clientY }
        setPhase('essai')
        image.current = requestAnimationFrame(boucle)
      }
      const c = courant.current
      if (!c || debut.current === null) return
      if (e.timeStamp - debut.current > session.duree) return
      c.clics.push({ d: e.timeStamp, v: e.isTrusted })
    },
    [boucle, locale, phase, session],
  )

  const relachement = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !courant.current) return
    const clics = courant.current.clics
    for (let i = clics.length - 1; i >= 0; i--) {
      if (clics[i].u === undefined) {
        clics[i].u = e.timeStamp
        break
      }
    }
  }, [])

  const mouvement = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const c = courant.current
    const p = dernierePos.current
    if (!c || !p) return
    c.mouvement += Math.hypot(e.clientX - p.x, e.clientY - p.y)
    dernierePos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const suivant = useCallback(async () => {
    if (!session) return
    if (numero < session.essais) {
      setNumero((n) => n + 1)
      setAffichage({ reste: Math.round(session.duree / 1000), cps: 0, clics: 0 })
      setPhase('pret')
      return
    }
    setPhase('envoi')
    try {
      const r = await fetch(`${PANEL}/api/verif/resultat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.id,
          jeton: session.jeton,
          essais: essais.current,
          nav: { ua: navigator.userAgent, precision: precisionHorloge() },
        }),
      })
      if (!r.ok && r.status !== 409) throw new Error(String(r.status))
      setPhase('fini')
    } catch {
      setErreur(t(locale, 'verif.erreur-reseau'))
      setPhase('entre')
    }
  }, [locale, numero, session])

  useEffect(
    () => () => {
      if (image.current) cancelAnimationFrame(image.current)
    },
    [],
  )

  if (phase === 'code') {
    return (
      <form onSubmit={ouvrir} className="rounded-carte border border-bord bg-charbon/60 p-5">
        <label htmlFor="code-verif" className="block font-titre text-[18px] text-creme">
          {t(locale, 'verif.code-label')}
        </label>
        <p className="mt-1 text-[14px] text-gris">{t(locale, 'verif.code-aide')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            id="code-verif"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            autoComplete="off"
            spellCheck={false}
            className="w-[12ch] rounded-controle border border-bord bg-nuit px-3.5 py-2.5 font-mono text-[20px] tracking-[.3em] text-creme focus:border-soupe focus:outline-none"
          />
          <button type="submit" disabled={code.length !== 6} className={classesBouton({})}>
            {t(locale, 'verif.code-bouton')}
          </button>
        </div>
        {erreur && <p className="mt-3 text-[14px] text-rouge">{erreur}</p>}
      </form>
    )
  }

  if (phase === 'fini') {
    return (
      <div className="rounded-carte border border-soupe/60 bg-soupe/10 p-6">
        <h2 className="font-titre text-[22px] text-creme">{t(locale, 'verif.merci-titre')}</h2>
        <p className="mt-2 text-gris">{t(locale, 'verif.merci')}</p>
      </div>
    )
  }

  const total = session?.essais ?? 3
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-carte border border-bord bg-charbon/60 p-5">
        <p className="font-mono text-[11.5px] tracking-[.1em] text-soupe uppercase">
          {t(locale, 'verif.joueur')} · {session?.joueur}
        </p>
        <p className="mt-2 text-creme">{t(locale, 'verif.consigne')}</p>
        {!!session?.cpsJeu && (
          <p className="mt-2 text-gris">{t(locale, 'verif.vitesse-jeu').replace('{c}', String(session.cpsJeu))}</p>
        )}
        <p className="mt-2 text-[13px] text-gris/80">{t(locale, 'verif.souris')}</p>
      </div>

      <div className="flex items-baseline justify-between font-mono text-[13px] text-gris">
        <span>
          {t(locale, 'verif.essai').replace('{n}', String(numero)).replace('{t}', String(total))}
        </span>
        <span>
          {t(locale, 'verif.secondes').replace('{s}', String(affichage.reste))} ·{' '}
          {t(locale, 'verif.cps').replace('{c}', String(affichage.cps))}
        </span>
      </div>

      <div
        role="button"
        tabIndex={-1}
        onPointerDown={appui}
        onPointerUp={relachement}
        onPointerMove={mouvement}
        onContextMenu={(e) => e.preventDefault()}
        className={`flex h-[260px] cursor-crosshair touch-none items-center justify-center rounded-carte border-2 select-none ${
          phase === 'essai' ? 'border-soupe bg-soupe/25' : 'border-soupe/60 bg-soupe/10'
        }`}
      >
        <span className="font-titre text-[clamp(18px,3vw,26px)] text-creme">
          {phase === 'pret' && t(locale, 'verif.pret')}
          {phase === 'essai' && `${t(locale, 'verif.en-cours')} ${affichage.clics}`}
          {phase === 'entre' && t(locale, 'verif.fini-essai')}
          {phase === 'envoi' && t(locale, 'verif.envoi')}
        </span>
      </div>

      {phase === 'entre' && (
        <button type="button" onClick={suivant} className={classesBouton({ pleineLargeur: true })}>
          {numero < total ? t(locale, 'verif.suivant') : t(locale, 'verif.code-bouton')}
        </button>
      )}
      {erreur && <p className="text-[14px] text-rouge">{erreur}</p>}
    </div>
  )
}
