'use client'

import Link from 'next/link'

import { classesBouton } from '@/components/ui/Bouton'

/**
 * Le passage au paiement, une fois la commande créée côté serveur.
 *
 * Le paiement s'ouvre TOUJOURS dans un onglet séparé, sur la page hébergée par
 * Tebex. C'était déjà le cas sur écran tactile ; c'est désormais la règle
 * partout.
 *
 * ── Pourquoi la modale a disparu ────────────────────────────────────────────
 * La version précédente chargeait Tebex.js (216 Ko) pour poser une lightbox
 * par-dessus la boutique sur bureau. Elle avait trois défauts que l'onglet
 * séparé fait disparaître d'un coup :
 *
 *   - la lightbox se dimensionnait mal et tronquait le formulaire dès que la
 *     fenêtre était étroite ;
 *   - il est arrivé qu'elle pose son voile plein écran sans jamais créer son
 *     iframe : `launch()` ne se résolvait ni ne rejetait, et un calque en
 *     z-index 9999999 interceptait tous les clics. Il fallait un minuteur de
 *     douze secondes et un nettoyage manuel du DOM pour s'en sortir ;
 *   - 216 Ko de script pour un cas d'usage que la page hébergée traite mieux.
 *
 * ── Ce qu'on perd, et pourquoi ce n'est pas grave ───────────────────────────
 * Cet onglet-ci ne recevra jamais l'évènement `payment:complete`, qui vivait
 * dans la lightbox. Ce n'est pas une perte : la source de vérité du paiement
 * n'a jamais été le navigateur, c'est le webhook Tebex
 * (cf. src/app/api/webhooks/paiement/route.ts). La page de commande lit le
 * statut réel qu'il a posé, et c'est vers elle que Tebex redirige l'onglet de
 * paiement une fois réglé.
 *
 * Le panier, lui, est vidé par la page de commande dès qu'elle constate un
 * paiement confirmé — pas d'un clic optimiste sur le lien : quelqu'un qui
 * renonce en cours de route doit retrouver sa sélection intacte.
 */
export function PaiementTebex({
  commandeId,
  urlCheckout,
}: {
  commandeId: string
  /** Page de paiement hébergée par Tebex, pour ce panier. */
  urlCheckout: string
}) {
  return (
    <div
      // `status` et non `alert` : ouvrir le paiement dans un onglet est le
      // déroulement normal, pas une anomalie. L'annoncer comme une alerte
      // serait mentir au lecteur d'écran.
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-bord bg-charbon px-gouttiere py-4 text-center shadow-[0_-16px_40px_rgba(0,0,0,.6)]"
    >
      <p className="text-[14.5px] text-creme">
        Ta commande est enregistrée. Le paiement s’ouvre dans un onglet séparé, sur la page
        sécurisée de Tebex.
      </p>

      <a
        href={urlCheckout}
        target="_blank"
        rel="noopener noreferrer"
        className={classesBouton({ variante: 'plein', className: 'mt-2.5' })}
      >
        Payer sur Tebex
      </a>

      {/*
        Le paiement se passe dans l'autre onglet : celui-ci n'apprendra jamais
        qu'il a abouti. On donne donc le lien vers la page de commande, qui lit
        le statut réel posé par le webhook.
      */}
      <Link
        href={`/boutique/commande/${commandeId}`}
        className="mt-2 block font-mono text-[10.5px] tracking-[.08em] text-gris uppercase underline underline-offset-2 transition-colors hover:text-creme"
      >
        Suivre ma commande
      </Link>
    </div>
  )
}
