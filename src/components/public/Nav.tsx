'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useReglages } from '@/components/public/ContexteReglages'
import { BoutonCopieIp } from '@/components/public/CopieIp'
import { IconeDiscord } from '@/components/public/IconeDiscord'

/**
 * Barre de navigation du site public — la barre flottante d'index.html.
 *
 * Les maquettes en proposaient deux variantes (flottante sur l'accueil et le
 * règlement, collée en haut sur les kits) : on garde la flottante, majoritaire,
 * pour que la navigation soit identique d'une page à l'autre.
 *
 * Composant client pour deux raisons : usePathname(), qui met en or le lien de
 * la page courante, et le menu burger en dessous de `md`.
 */
const LIENS = [
  { href: '/#jouer', label: 'Jouer' },
  { href: '/kits', label: 'Kits' },
  { href: '/classement', label: 'Classement' },
  { href: '/boutique', label: 'Boutique' },
  { href: '/reglement', label: 'Règlement' },
]

/** Un lien est-il celui de la page affichée ? */
function estActif(href: string, chemin: string) {
  // Les ancres de l'accueil (/#jouer) ne sont actives que sur l'accueil.
  if (href.startsWith('/#')) return chemin === '/'
  return chemin === href || chemin.startsWith(`${href}/`)
}

export function Nav() {
  const chemin = usePathname()
  const { ip, discord } = useReglages()
  const [menuOuvert, setMenuOuvert] = useState(false)

  // Stable : le panneau s'en sert comme dépendance d'effet.
  const fermer = useCallback(() => setMenuOuvert(false), [])

  return (
    <nav className="fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-contenu items-center justify-between gap-3 rounded-2xl border border-bord bg-nuit/85 px-4 py-3 backdrop-blur-xl sm:px-5.5">
      <Link href="/" aria-label="LJKITS — retour à l’accueil" className="flex min-h-11 items-center">
        <Image src="/logo-texte.png" alt="LJKITS" width={81} height={22} priority />
      </Link>

      {/* --- liens, à partir de md : en dessous ils vivent dans le panneau --- */}
      <div className="hidden gap-7 text-[15px] font-semibold md:flex">
        {LIENS.map((lien) => {
          const actif = estActif(lien.href, chemin)

          return (
            <Link
              key={lien.href}
              href={lien.href}
              aria-current={actif ? 'page' : undefined}
              // min-h-11 : à 768 px on est encore sur un écran tactile, et un
              // lien de 24 px de haut y est difficile à viser au pouce.
              className={`flex min-h-11 items-center transition-colors ${
                actif ? 'text-or' : 'text-gris hover:text-creme'
              }`}
            >
              {lien.label}
            </Link>
          )
        })}
      </div>

      <div className="flex items-center gap-2.5">
        {/*
          Masqué sous `sm` : à 360 px, logo + Discord + JOUER + burger dépassent
          les 328 px utiles. Le Discord reste accessible dans le panneau.
        */}
        <a
          href={discord}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden min-h-11 items-center gap-2 rounded-[10px] bg-discord px-4.5 text-sm font-bold text-white transition-all hover:bg-[#6a76f5] hover:shadow-[0_4px_18px_rgba(88,101,242,.35)] sm:flex"
        >
          <IconeDiscord className="size-4.5 fill-white" />
          <span className="hidden md:inline">Discord</span>
        </a>

        <BoutonCopieIp
          aria-label={`Copier l’adresse du serveur, ${ip}`}
          className="min-h-11 rounded-[10px] bg-linear-[135deg] from-soupe to-or px-4 text-sm font-extrabold tracking-wide text-[#1A1005] transition-shadow hover:shadow-[0_4px_18px_rgba(254,147,1,.45)] sm:px-5"
        >
          JOUER
        </BoutonCopieIp>

        <button
          type="button"
          onClick={() => setMenuOuvert(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOuvert}
          aria-controls="menu-mobile"
          aria-haspopup="dialog"
          className="flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-bord text-creme transition-colors hover:border-soupe hover:text-soupe md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
            className="size-5.5"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      <MenuMobile
        ouvert={menuOuvert}
        chemin={chemin}
        ip={ip}
        discord={discord}
        onFermer={fermer}
      />
    </nav>
  )
}

/**
 * Le panneau de navigation mobile.
 *
 * Bâti sur <dialog> natif, comme la modale de la boutique : Échap, clic sur le
 * fond, piégeage du focus et retour du focus au bouton burger sont gérés par le
 * navigateur. C'est ce qui permet de ne pas embarquer de librairie de modale —
 * et c'est le seul moyen d'avoir un vrai piège de focus sans en écrire un.
 */
function MenuMobile({
  ouvert,
  chemin,
  ip,
  discord,
  onFermer,
}: {
  ouvert: boolean
  chemin: string
  ip: string
  discord: string
  onFermer: () => void
}) {
  const dialogue = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialogue.current
    if (!element) return

    if (ouvert && !element.open) element.showModal()
    if (!ouvert && element.open) element.close()
  }, [ouvert])

  /**
   * Le panneau n'existe que sous `md`. Si la fenêtre est élargie alors qu'il
   * est ouvert, les liens réapparaissent dans la barre et le panneau resterait
   * un calque modal invisible qui bloque toute la page.
   */
  useEffect(() => {
    if (!ouvert) return

    const requete = window.matchMedia('(min-width: 768px)')
    const fermerSiLarge = () => {
      if (requete.matches) onFermer()
    }

    requete.addEventListener('change', fermerSiLarge)
    return () => requete.removeEventListener('change', fermerSiLarge)
  }, [ouvert, onFermer])

  return (
    <dialog
      ref={dialogue}
      id="menu-mobile"
      aria-label="Navigation"
      // Déclenché par Échap comme par close() : on resynchronise l'état React.
      onClose={onFermer}
      // Un clic sur le fond a pour cible le <dialog> lui-même.
      onClick={(evenement) => {
        if (evenement.target === dialogue.current) onFermer()
      }}
      className="fixed inset-0 m-0 max-h-none w-full max-w-none bg-transparent p-4 text-creme backdrop:bg-nuit/80 backdrop:backdrop-blur-sm md:hidden"
    >
      {/*
        Le <dialog> couvre tout l'écran pour que le clic « à côté » ait une
        cible ; le panneau visible, lui, est ce bloc, posé sous la barre.
      */}
      <div className="mx-auto mt-[72px] flex max-h-[calc(100dvh-88px)] max-w-contenu flex-col overflow-y-auto rounded-2xl border border-bord bg-charbon p-4 shadow-[0_18px_50px_rgba(0,0,0,.55)]">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
            Navigation
          </span>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer le menu"
            className="flex size-11 items-center justify-center rounded-[10px] border border-bord text-gris transition-colors hover:border-oni hover:text-oni"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
              className="size-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col">
          {LIENS.map((lien) => {
            const actif = estActif(lien.href, chemin)

            return (
              <Link
                key={lien.href}
                href={lien.href}
                aria-current={actif ? 'page' : undefined}
                // Fermeture au choix d'un lien. Nécessaire même pour la page
                // courante : Next ne remonte alors pas le composant, et le
                // panneau resterait ouvert sur un clic sur le lien actif.
                onClick={onFermer}
                className={`flex min-h-12 items-center rounded-[10px] px-3.5 text-[16.5px] font-semibold transition-colors ${
                  actif ? 'bg-braise text-or' : 'text-creme hover:bg-braise'
                }`}
              >
                {lien.label}
              </Link>
            )
          })}
        </div>

        <div className="mt-4 flex flex-col gap-2.5 border-t border-bord pt-4">
          <BoutonCopieIp
            aria-label={`Copier l’adresse du serveur, ${ip}`}
            className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-[10px] bg-linear-[135deg] from-soupe to-or px-4 font-mono text-[15px] font-bold text-[#1A1005]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.2"
              stroke="#1A1005"
              aria-hidden="true"
              className="size-4.5 shrink-0"
            >
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
            {ip}
          </BoutonCopieIp>

          <a
            href={discord}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onFermer}
            className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-[10px] bg-discord px-4 text-[15px] font-bold text-white"
          >
            <IconeDiscord className="size-4.5 shrink-0 fill-white" />
            Rejoindre le Discord
          </a>
        </div>
      </div>
    </dialog>
  )
}
