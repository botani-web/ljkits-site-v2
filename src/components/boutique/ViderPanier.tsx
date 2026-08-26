'use client'

import { useEffect } from 'react'

import { ecrirePanierStocke } from '@/lib/panier'

/**
 * Vide le panier une fois le paiement confirmé.
 *
 * Monté par la page de commande, et UNIQUEMENT quand le statut réel — celui
 * que le webhook Tebex a posé en base — dit que la commande est payée ou
 * livrée. Jamais sur un clic : quelqu'un qui ouvre le paiement puis renonce
 * doit retrouver sa sélection intacte.
 *
 * Le paiement se déroulant dans un onglet séparé, c'est cette page qui est la
 * première à savoir qu'il a abouti. `localStorage` étant partagé par tous les
 * onglets d'un même domaine, l'onglet resté sur la boutique repart lui aussi
 * d'un panier vide au prochain chargement.
 *
 * N'affiche rien.
 */
export function ViderPanier() {
  useEffect(() => {
    ecrirePanierStocke([])
  }, [])

  return null
}
