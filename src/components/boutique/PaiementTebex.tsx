'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { classesBouton } from '@/components/ui/Bouton'
import { Panneau, SectionPanneau } from '@/components/ui/Panneau'

/**
 * Le passage au paiement, une fois la commande créée côté serveur.
 *
 * ── Pourquoi une modale, et pas une barre en bas d'écran ────────────────────
 * La version précédente était un bandeau `position: fixed` en `z-50`. Il était
 * invisible : un <dialog> ouvert par `showModal()` vit dans le TOP LAYER du
 * navigateur, une couche qui passe au-dessus de tout le document quel que soit
 * le z-index. Le tiroir du panier, encore ouvert, recouvrait donc le bandeau —
 * il fallait fermer le tiroir pour le trouver.
 *
 * Cette étape est elle-même un <dialog> modal. Elle rejoint le top layer, se
 * pose au-dessus de ce qui reste, prend le focus, et ne peut plus être
 * masquée par rien.
 *
 * ── Pourquoi deux clics et pas un ───────────────────────────────────────────
 * On ne connaît l'adresse de paiement qu'APRÈS la réponse de la Server Action.
 * Un `window.open()` à ce moment-là ne part plus d'un geste de l'utilisateur :
 * tous les bloqueurs de fenêtres le refusent. D'où un vrai lien, cliqué par le
 * joueur — ça, aucun bloqueur ne l'arrête.
 *
 * Créer la commande plus tôt, pour avoir l'adresse avant d'afficher cet écran,
 * reviendrait à enregistrer une commande à chaque ouverture du récapitulatif :
 * trois allers-retours suffiraient à déclencher le garde-fou anti-abus de
 * creerCommande et à bloquer le joueur une heure.
 */
export function PaiementTebex({
  commandeId,
  urlCheckout,
}: {
  commandeId: string
  /** Page de paiement hébergée par Tebex, pour ce panier. */
  urlCheckout: string
}) {
  const dialogue = useRef<HTMLDialogElement>(null)

  // Ouverte dès le montage : le parent ne rend ce composant qu'une fois la
  // commande créée, il n'y a pas d'état intermédiaire à attendre.
  useEffect(() => {
    const element = dialogue.current
    if (element && !element.open) element.showModal()
  }, [])

  return (
    <dialog
      ref={dialogue}
      aria-labelledby="titre-paiement"
      /*
        Pas de fermeture au clic sur le fond, et pas d'Échap non plus :
        la commande est créée côté serveur, refermer par inadvertance
        laisserait le joueur sans lien vers sa page de suivi. On sort par le
        lien de suivi, jamais par accident.
      */
      onCancel={(evenement) => evenement.preventDefault()}
      className="m-auto w-full max-w-[440px] bg-transparent p-4 text-creme backdrop:bg-nuit/80 backdrop:backdrop-blur-sm"
    >
      <Panneau ombre titre={<span id="titre-paiement">Paiement</span>}>
        <SectionPanneau dernier>
          <p className="text-[14.5px] text-creme">
            Ta commande est enregistrée. Le paiement s’ouvre dans un onglet séparé, sur la
            page sécurisée de Tebex.
          </p>

          <a
            href={urlCheckout}
            target="_blank"
            rel="noopener noreferrer"
            className={classesBouton({
              variante: 'plein',
              taille: 'grande',
              pleineLargeur: true,
              className: 'mt-4.5',
            })}
          >
            Payer sur Tebex
          </a>

          {/*
            Le paiement se déroule dans l'autre onglet : celui-ci n'apprendra
            jamais qu'il a abouti. On donne donc le lien vers la page de
            commande, qui lit le statut réel posé par le webhook — et qui vide
            le panier quand ce statut dit « payée ».
          */}
          <Link
            href={`/boutique/commande/${commandeId}`}
            className="mt-3 block text-center font-mono text-[10.5px] tracking-[.08em] text-gris uppercase underline underline-offset-2 transition-colors hover:text-creme"
          >
            Suivre ma commande
          </Link>
        </SectionPanneau>
      </Panneau>
    </dialog>
  )
}
