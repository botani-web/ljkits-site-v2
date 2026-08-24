'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Le paiement, affiché dans une modale posée sur ljkits.eu — SUR BUREAU
 * seulement. Sur écran tactile la lightbox de Tebex.js se dimensionne mal, on
 * bascule donc vers la page hébergée par Tebex, ouverte dans un onglet séparé
 * (cf. `paiementEnOngletSepare`).
 *
 * On passe par Tebex.js, la librairie officielle, et non par un <iframe>
 * maison : c'est elle qui gère le dimensionnement, le fond, la fermeture et
 * surtout les évènements de fin de paiement. Un iframe brut afficherait la
 * page mais ne nous dirait jamais que le joueur a payé.
 *
 * Le script n'est chargé QUE lorsqu'un paiement démarre (216 Ko) : inutile de
 * l'imposer à tous les visiteurs de la boutique.
 *
 * ⚠ Le panier est créé avec `complete_auto_redirect: false` (cf. lib/tebex.ts).
 * Sans ça, Tebex ferait naviguer l'iframe vers ljkits.eu et le site
 * s'afficherait à l'intérieur de lui-même.
 */

/** La part de l'API Tebex.js qu'on utilise. */
type Tebex = {
  checkout: {
    init: (options: {
      ident: string
      theme?: 'auto' | 'default' | 'light' | 'dark'
      colors?: { name: string; color: string }[]
      closeOnEsc?: boolean
      closeOnClickOutside?: boolean
      popupOnMobile?: boolean
    }) => void
    launch: () => Promise<void>
    on: (evenement: string, rappel: () => void) => void
  }
}

declare global {
  interface Window {
    Tebex?: Tebex
  }
}

const URL_SCRIPT = 'https://js.tebex.io/v/1.js'

/**
 * Délai au-delà duquel on considère que la modale ne s'ouvrira pas.
 *
 * Ce n'est pas de la prudence excessive : en test, Tebex.js a posé son
 * overlay plein écran puis n'a jamais créé son iframe — spinner infini,
 * `launch()` ni résolue ni rejetée, aucune requête vers pay.tebex.io. Sans
 * ce garde-fou, le joueur reste devant un voile transparent en z-index
 * 9999999 qui intercepte TOUS ses clics : la boutique paraît figée.
 */
const DELAI_OUVERTURE_MS = 12_000

/**
 * Retire l'overlay laissé par Tebex.js quand l'ouverture a échoué.
 * Sans ça, il continue de bloquer les clics sur toute la page.
 */
function retirerOverlayTebex() {
  document.querySelectorAll('.tebex-js-lightbox').forEach((element) => element.remove())
}

/**
 * Charge Tebex.js une seule fois, même si le joueur ouvre plusieurs paiements.
 * La promesse est mémorisée au niveau du module, pas du composant.
 */
let chargement: Promise<Tebex> | null = null

function chargerTebex(): Promise<Tebex> {
  if (window.Tebex) return Promise.resolve(window.Tebex)
  if (chargement) return chargement

  chargement = new Promise<Tebex>((resoudre, rejeter) => {
    const script = document.createElement('script')
    script.src = URL_SCRIPT
    script.async = true
    script.onload = () =>
      window.Tebex ? resoudre(window.Tebex) : rejeter(new Error('Tebex.js chargé mais absent'))
    script.onerror = () => {
      // Une prochaine tentative doit pouvoir réessayer.
      chargement = null
      rejeter(new Error('Tebex.js injoignable'))
    }
    document.head.appendChild(script)
  })

  return chargement
}

/** Les couleurs de la modale, alignées sur la palette du site. */
const COULEURS = [
  { name: 'primary', color: '#fe9301' },
  { name: 'secondary', color: '#fdc003' },
  { name: 'background', color: '#171029' },
  { name: 'surface', color: '#211736' },
  { name: 'surface-variant', color: '#2e2245' },
]

/**
 * Le paiement doit-il passer par un onglet séparé plutôt que par la modale ?
 *
 * La lightbox de Tebex.js se dimensionne mal sur les écrans tactiles : le
 * formulaire de paiement y est tronqué. Sur ces appareils on ouvre donc la
 * page hébergée par Tebex dans un onglet à part, où elle s'affiche
 * correctement et où le clavier virtuel ne casse rien. Le bureau, lui, garde
 * la modale : c'est tout l'intérêt de ne pas quitter le site.
 *
 * Deux critères, parce qu'aucun ne suffit seul :
 *   - `pointer: coarse` attrape les tablettes larges — un iPad en paysage
 *     dépasse 1024 px tout en restant tactile ;
 *   - la largeur attrape les navigateurs tactiles qui annoncent un pointeur
 *     fin, et les fenêtres trop étroites pour la lightbox.
 */
function paiementEnOngletSepare() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 1023px)').matches
  )
}

/**
 * `ouvert`     la modale Tebex est à l'écran, on n'affiche rien nous-mêmes
 * `interrompu` le joueur l'a fermée sans payer — on propose de reprendre
 * `abandonne`  il a explicitement renoncé
 * `echec`      Tebex.js ne s'est pas chargé — repli vers la page hébergée
 * `externe`    écran tactile : la page hébergée s'ouvre dans un onglet à part
 */
type Etat = 'ouvert' | 'interrompu' | 'abandonne' | 'echec' | 'externe'

export function PaiementTebex({
  identPanier,
  commandeId,
  urlCheckout,
  onPaye,
}: {
  identPanier: string
  commandeId: string
  /** Page hébergée par Tebex, ouverte si le script ne se charge pas. */
  urlCheckout: string
  /** Le paiement est passé : le panier peut être vidé. */
  onPaye: () => void
}) {
  const router = useRouter()
  const [etat, setEtat] = useState<Etat>('ouvert')
  const tebex = useRef<Tebex | null>(null)
  /** Passe à vrai sur l'évènement `open` : la modale est bien à l'écran. */
  const ouverte = useRef(false)

  useEffect(() => {
    // Écran tactile : on ne charge même pas Tebex.js (216 Ko pour rien) et on
    // renvoie directement vers la page hébergée.
    if (paiementEnOngletSepare()) {
      setEtat('externe')
      return
    }

    let annule = false
    const minuteries: ReturnType<typeof setTimeout>[] = []

    chargerTebex()
      .then((librairie) => {
        if (annule) return
        tebex.current = librairie

        const echouer = (raison: string) => {
          if (annule || ouverte.current) return
          console.error('[boutique] modale de paiement indisponible :', raison)
          retirerOverlayTebex()
          setEtat('echec')
        }

        // Si l'évènement `open` n'arrive pas, on bascule sur le repli.
        const garde = setTimeout(
          () => echouer(`aucune ouverture après ${DELAI_OUVERTURE_MS} ms`),
          DELAI_OUVERTURE_MS,
        )
        minuteries.push(garde)

        librairie.checkout.init({
          ident: identPanier,
          theme: 'dark',
          colors: COULEURS,
          closeOnEsc: true,
          // Un clic à côté ne doit pas interrompre un paiement en cours.
          closeOnClickOutside: false,
          // Filet de sécurité : on ne devrait plus arriver ici sur tactile,
          // mais si notre détection rate un appareil, Tebex.js ouvrira sa
          // propre fenêtre au lieu d'une lightbox tronquée.
          popupOnMobile: true,
        })

        librairie.checkout.on('open', () => {
          ouverte.current = true
          clearTimeout(garde)
        })

        librairie.checkout.on('payment:complete', () => {
          onPaye()
          router.push(`/boutique/commande/${commandeId}`)
        })

        // Fermeture sans payer : la commande reste EN_ATTENTE côté serveur et
        // le panier Tebex reste valide. On propose de reprendre CE panier
        // plutôt que de relancer la Server Action, qui créerait une commande
        // de plus — et trois de suite bloqueraient le joueur une heure
        // (cf. le garde-fou anti-abus de creerCommande).
        librairie.checkout.on('close', () => {
          if (!annule) setEtat('interrompu')
        })

        return librairie.checkout.launch().catch((erreur: Error) => {
          clearTimeout(garde)
          echouer(erreur.message)
        })
      })
      .catch((erreur) => {
        if (annule) return
        console.error('[boutique] modale de paiement indisponible :', erreur)
        retirerOverlayTebex()
        setEtat('echec')
      })

    return () => {
      annule = true
      minuteries.forEach(clearTimeout)
    }
    // Monté une fois par panier Tebex : le parent remonte le composant avec
    // une nouvelle clé quand l'ident change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identPanier])

  const reprendre = useCallback(() => {
    setEtat('ouvert')
    ouverte.current = false
    tebex.current?.checkout.launch().catch(() => {
      retirerOverlayTebex()
      setEtat('echec')
    })
  }, [])

  if (etat === 'ouvert' || etat === 'abandonne') return null

  /** Le bouton principal du panneau, quel que soit l'état. */
  const CLASSE_ACTION =
    'mt-2.5 inline-flex min-h-11 items-center justify-center rounded-[7px] bg-soupe px-4 font-mono text-[12.5px] font-bold tracking-wide text-[#1a0f00] transition-colors hover:bg-or'

  return (
    <div
      // `externe` est le déroulement normal sur tactile, pas une anomalie :
      // l'annoncer comme une alerte serait mentir au lecteur d'écran.
      role={etat === 'externe' ? 'status' : 'alert'}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-bord bg-charbon px-6 py-4 text-center"
    >
      {etat === 'interrompu' && (
        <>
          <p className="text-[14.5px] text-creme">
            Paiement interrompu. Ta commande est conservée.
          </p>
          <button type="button" onClick={reprendre} className={CLASSE_ACTION}>
            Reprendre le paiement
          </button>
        </>
      )}

      {etat === 'externe' && (
        <>
          <p className="text-[14.5px] text-creme">
            Le paiement s’ouvre dans un onglet séparé — il s’affiche mieux qu’une
            fenêtre posée sur le site.
          </p>
          <a href={urlCheckout} target="_blank" rel="noopener noreferrer" className={CLASSE_ACTION}>
            Payer sur Tebex
          </a>
          {/*
            Le paiement se passe dans l'autre onglet : celui-ci ne recevra
            jamais l'évènement `payment:complete`. On donne donc le lien vers la
            page de commande, qui lit le statut réel posé par le webhook.
          */}
          <a
            href={`/boutique/commande/${commandeId}`}
            className="mt-2 block text-[13px] text-gris underline-offset-2 transition-colors hover:text-creme"
          >
            Suivre ma commande
          </a>
        </>
      )}

      {etat === 'echec' && (
        <>
          <p className="text-[14.5px] text-creme">
            La fenêtre de paiement n’a pas pu s’ouvrir sur le site.
          </p>
          <a href={urlCheckout} target="_blank" rel="noopener noreferrer" className={CLASSE_ACTION}>
            Payer dans un nouvel onglet
          </a>
        </>
      )}

      <button
        type="button"
        onClick={() => setEtat('abandonne')}
        className="mt-2 block min-h-11 w-full text-[13px] text-gris transition-colors hover:text-white"
      >
        Annuler
      </button>
    </div>
  )
}
