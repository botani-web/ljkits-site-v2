'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useReglages } from '@/components/public/ContexteReglages'
import { BoutonCopieIp } from '@/components/public/CopieIp'
import { IconeDiscord } from '@/components/public/IconeDiscord'
import { classesBouton } from '@/components/ui/Bouton'

/**
 * Barre de navigation du site public.
 *
 * Collée en haut et dans le flux (`sticky`), pleine largeur, filet en bas.
 * C'est le choix des cinq maquettes validées ; elle remplace la pilule
 * flottante arrondie d'avant. La conséquence directe : les pages n'ont plus
 * à réserver 150px de vide sous une barre en `position:fixed`.
 *
 * Sa hauteur est figée à 69px et publiée par le token `--spacing-nav`, dont
 * les barres d'outils collantes de /kits, /classement et /boutique se servent
 * pour se poser exactement dessous.
 *
 * Composant client pour deux raisons : usePathname(), qui met en soupe le lien
 * de la page courante, et le menu burger sous 860px.
 */
const LIENS = [
  { href: '/kits', label: 'Kits' },
  { href: '/classement', label: 'Classement' },
  { href: '/boutique', label: 'Boutique' },
  { href: '/reglement', label: 'Règlement' },
]

/** Un lien est-il celui de la page affichée ? */
function estActif(href: string, chemin: string) {
  return chemin === href || chemin.startsWith(`${href}/`)
}

export function Nav() {
  const chemin = usePathname()
  const { ip, discord } = useReglages()
  const [menuOuvert, setMenuOuvert] = useState(false)

  // Stable : le panneau s'en sert comme dépendance d'effet.
  const fermer = useCallback(() => setMenuOuvert(false), [])

  return (
    <nav className="sticky top-0 z-70 border-b border-bord bg-nuit/86 backdrop-blur-[14px]">
      <div className="mx-auto flex max-w-contenu items-center gap-6.5 px-gouttiere py-3">
        <Link href="/" aria-label="LJKITS — retour à l’accueil" className="flex items-center">
          <Image src="/logo-texte.png" alt="LJKITS" width={71} height={24} priority />
        </Link>

        {/* --- liens, à partir de 860px : en dessous ils vivent dans le panneau --- */}
        <div className="ml-2 hidden gap-6.5 min-[860px]:flex">
          {LIENS.map((lien) => {
            const actif = estActif(lien.href, chemin)

            return (
              <Link
                key={lien.href}
                href={lien.href}
                aria-current={actif ? 'page' : undefined}
                // min-h-11 : à 860px on est encore sur un écran tactile, et un
                // lien de 19px de haut y est difficile à viser au pouce.
                className={`flex min-h-11 items-center font-mono text-xs font-medium tracking-[.12em] uppercase transition-colors ${
                  actif ? 'text-soupe' : 'text-gris hover:text-creme'
                }`}
              >
                {lien.label}
              </Link>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          {/*
            Sous 860px, la barre ne garde que le logo, le Discord et le burger :
            les quatre ensemble ne tiennent pas dans les 324px utiles d'un
            écran de 360. C'est « Copier l'IP » qui cède la place, parce que
            c'est l'action la moins urgente des deux tant qu'on n'a pas encore
            décidé de jouer — et parce qu'elle reste à un doigt dans le panneau,
            où l'adresse est en plus affichée en toutes lettres.
          */}
          <a
            href={discord}
            target="_blank"
            rel="noopener noreferrer"
            className={classesBouton({ variante: 'vide' })}
          >
            <IconeDiscord className="size-4 shrink-0 fill-current" />
            Discord
          </a>

          {/*
            `max-[860px]:hidden` et non `hidden min-[860px]:inline-flex`.

            classesBouton() pose déjà `inline-flex` dans sa chaîne de base. Deux
            utilitaires de `display` dans le même attribut, c'est l'ordre de la
            FEUILLE DE STYLE qui tranche, pas celui de l'attribut — et Tailwind
            émet `.inline-flex` après `.hidden`. Le bouton restait donc visible
            à toutes les largeurs.

            Une règle sous media query, elle, est écrite après toutes les règles
            de base : elle gagne sans dépendre de cet ordre.
          */}
          <BoutonCopieIp
            aria-label={`Copier l’adresse du serveur, ${ip}`}
            className={classesBouton({
              variante: 'plein',
              className: 'max-[860px]:hidden',
            })}
          >
            Copier l’IP
          </BoutonCopieIp>

          <button
            type="button"
            onClick={() => setMenuOuvert(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOuvert}
            aria-controls="menu-mobile"
            aria-haspopup="dialog"
            className="flex size-11 shrink-0 items-center justify-center rounded-controle border border-bord text-creme transition-colors hover:border-soupe hover:text-soupe min-[860px]:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="size-[18px]"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
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
   * Le panneau n'existe que sous 860px. Si la fenêtre est élargie alors qu'il
   * est ouvert, les liens réapparaissent dans la barre et le panneau resterait
   * un calque modal invisible qui bloque toute la page.
   */
  useEffect(() => {
    if (!ouvert) return

    const requete = window.matchMedia('(min-width: 860px)')
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
      className="fixed inset-0 m-0 max-h-none w-full max-w-none bg-transparent p-4 text-creme backdrop:bg-nuit/80 backdrop:backdrop-blur-sm min-[860px]:hidden"
    >
      {/*
        Le <dialog> couvre tout l'écran pour que le clic « à côté » ait une
        cible ; le panneau visible, lui, est ce bloc, posé sous la barre.
      */}
      <div className="mx-auto mt-[76px] flex max-h-[calc(100dvh-92px)] max-w-contenu flex-col overflow-y-auto rounded-carte border border-bord bg-charbon p-4 shadow-[0_18px_50px_rgba(0,0,0,.55)]">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10.5px] font-bold tracking-[.2em] text-soupe uppercase">
            Navigation
          </span>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer le menu"
            className="flex size-11 items-center justify-center rounded-controle border border-bord text-gris transition-colors hover:border-oni hover:text-oni"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
                className={`flex min-h-12 items-center rounded-controle px-3.5 font-mono text-[13px] font-bold tracking-[.12em] uppercase transition-colors ${
                  actif ? 'bg-braise text-soupe' : 'text-creme hover:bg-braise'
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
            className={classesBouton({ variante: 'plein', pleineLargeur: true })}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
              className="size-4 shrink-0"
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
            className={classesBouton({ variante: 'vide', pleineLargeur: true })}
          >
            <IconeDiscord className="size-4 shrink-0 fill-current" />
            Rejoindre le Discord
          </a>
        </div>
      </div>
    </dialog>
  )
}
