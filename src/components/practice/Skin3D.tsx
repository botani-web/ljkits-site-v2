'use client'

import { useEffect, useRef, useState } from 'react'

import type { Pose } from './skin3d-poses'

/**
 * LE SKIN D'UN JOUEUR, EN 3D ET EN MOUVEMENT (16/09/2026).
 *
 * skinview3d dessine le modèle Minecraft avec la texture brute du skin
 * (mc-heads.net/skin, servie avec CORS ouvert) et une pose animée : garde et
 * coup d'épée, bras levés du vainqueur, ou repos. On peut le faire tourner à
 * la souris ou au doigt.
 *
 * Tout ce qui peut échouer retombe proprement :
 *   - le temps du chargement, et sans WebGL : l'image fixe de mc-heads ;
 *   - un pseudo sans skin : le skin de Steve ;
 *   - « réduire les animations » demandé par le système : la pose reste figée.
 * La bibliothèque (three.js compris) n'est chargée qu'au moment où un skin
 * s'affiche, jamais dans le JavaScript commun des autres pages. Hors de
 * l'écran, le rendu se met en pause.
 */
export function Skin3D({
  pseudo,
  alt,
  pose = 'combat',
  halo = '#fdc003',
  interactif = true,
  decalage = 0,
  className = '',
}: {
  pseudo: string
  alt: string
  pose?: Pose
  /** La couleur du halo derrière le personnage : celle du palier. */
  halo?: string
  interactif?: boolean
  /** Décale l'animation, pour que trois skins voisins ne frappent pas en même temps. */
  decalage?: number
  className?: string
}) {
  const cadre = useRef<HTMLDivElement>(null)
  const toile = useRef<HTMLCanvasElement>(null)
  const [pret, setPret] = useState(false)

  useEffect(() => {
    const conteneur = cadre.current
    const canvas = toile.current
    if (!conteneur || !canvas) return
    let abandonne = false
    let nettoyer: (() => void) | undefined

    void (async () => {
      try {
        const [skinview, poses, three] = await Promise.all([
          import('skinview3d'),
          import('./skin3d-poses'),
          import('three'),
        ])
        if (abandonne) return

        const { width, height } = conteneur.getBoundingClientRect()
        const vue = new skinview.SkinViewer({
          canvas,
          width: Math.max(1, width),
          height: Math.max(1, height),
          fov: 40,
          zoom: 0.88,
          enableControls: interactif,
        })
        vue.controls.enableZoom = false
        vue.controls.enablePan = false
        vue.playerWrapper.rotation.y = poses.ANGLE_DEPART[pose]
        poses.equiper(vue.playerObject, three, pose)

        const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        vue.animation = new skinview.FunctionAnimation((joueur, progres) =>
          // Figée, la pose de combat montre l'épée armée plutôt qu'un bras ballant.
          poses.animer(joueur, reduit ? 1.0 + decalage : progres + decalage, pose),
        )
        vue.animation.speed = reduit ? 0 : 1

        try {
          await vue.loadSkin(`https://mc-heads.net/skin/${encodeURIComponent(pseudo)}`)
        } catch {
          await vue.loadSkin('https://mc-heads.net/skin/MHF_Steve').catch(() => undefined)
        }
        if (abandonne) {
          vue.dispose()
          return
        }
        setPret(true)

        const taille = new ResizeObserver(([entree]) => {
          vue.setSize(Math.max(1, entree.contentRect.width), Math.max(1, entree.contentRect.height))
        })
        taille.observe(conteneur)
        const visibilite = new IntersectionObserver(([entree]) => {
          vue.renderPaused = !entree.isIntersecting
        })
        visibilite.observe(conteneur)

        nettoyer = () => {
          taille.disconnect()
          visibilite.disconnect()
          vue.dispose()
        }
      } catch {
        // Pas de WebGL, ou bibliothèque introuvable : l'image fixe reste affichée.
      }
    })()

    return () => {
      abandonne = true
      nettoyer?.()
    }
  }, [pseudo, pose, decalage, interactif])

  return (
    <div ref={cadre} className={`relative ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[8%] rounded-full blur-2xl transition-opacity duration-700"
        style={{ background: `radial-gradient(closest-side, ${halo}66, ${halo}14 60%, transparent)` }}
      />
      {!pret && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://mc-heads.net/body/${encodeURIComponent(pseudo)}/200`}
          alt={alt}
          className="absolute inset-0 m-auto h-[80%] w-auto object-contain"
        />
      )}
      <canvas
        ref={toile}
        role="img"
        aria-label={alt}
        className={`relative block h-full w-full transition-opacity duration-500 ${pret ? 'opacity-100' : 'opacity-0'} ${
          interactif ? 'cursor-grab touch-pan-y active:cursor-grabbing' : ''
        }`}
      />
    </div>
  )
}
