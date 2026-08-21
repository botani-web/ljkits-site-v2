'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Le paiement, affiché dans une modale posée sur ljkits.eu.
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
 * `ouvert`     la modale Tebex est à l'écran, on n'affiche rien nous-mêmes
 * `interrompu` le joueur l'a fermée sans payer — on propose de reprendre
 * `abandonne`  il a explicitement renoncé
 * `echec`      Tebex.js ne s'est pas chargé — repli vers la page hébergée
 */
type Etat = 'ouvert' | 'interrompu' | 'abandonne' | 'echec'

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

  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-bord bg-charbon px-6 py-4 text-center"
    >
      {etat === 'interrompu' ? (
        <>
          <p className="text-[14.5px] text-creme">
            Paiement interrompu. Ta commande est conservée.
          </p>
          <button
            type="button"
            onClick={reprendre}
            className="mt-2.5 rounded-[7px] bg-soupe px-4 py-2.5 font-mono text-[12.5px] font-bold tracking-wide text-[#1a0f00] transition-colors hover:bg-or"
          >
            Reprendre le paiement
          </button>
        </>
      ) : (
        <>
          <p className="text-[14.5px] text-creme">
            La fenêtre de paiement n’a pas pu s’ouvrir sur le site.
          </p>
          <a
            href={urlCheckout}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-block rounded-[7px] bg-soupe px-4 py-2.5 font-mono text-[12.5px] font-bold tracking-wide text-[#1a0f00] transition-colors hover:bg-or"
          >
            Payer dans un nouvel onglet
          </a>
        </>
      )}

      <button
        type="button"
        onClick={() => setEtat('abandonne')}
        className="mt-2 block w-full text-[13px] text-gris transition-colors hover:text-white"
      >
        Annuler
      </button>
    </div>
  )
}
