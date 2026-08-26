'use client'

import { SITE } from '@/lib/site'

import './globals.css'

/**
 * Le filet de sécurité de dernier recours.
 *
 * Il ne se déclenche que si le LAYOUT RACINE lui-même a échoué. Next.js
 * remplace alors tout le document : ce composant doit donc fournir ses propres
 * <html> et <body>, ce qu'aucune autre page du site ne fait.
 *
 * Conséquences, et c'est pour ça qu'il est si dépouillé :
 *
 *  - `next/font` est déclaré dans le layout racine, qui n'existe plus ici. Les
 *    variables --police-* ne sont donc pas posées, et --font-titre retombe sur
 *    la pile de secours déclarée dans globals.css. Réimporter les polices
 *    ferait télécharger deux fichiers de plus sur une page qui ne s'affiche que
 *    quand tout est déjà cassé.
 *  - L'adresse affichée est SITE.ip, la valeur de repli du code. La vraie
 *    adresse vit en base, et la base est hors de portée ici : c'est justement
 *    le cas pour lequel ce repli existe.
 *  - La feuille de style, elle, est importée ici explicitement : sans elle,
 *    même les tokens de couleur manqueraient et la page s'afficherait en noir
 *    sur blanc.
 *  - Aucune dépendance à un composant du site : ni Enveloppe, ni Bouton, ni
 *    réglages en base. Si le layout est tombé, on ne peut plus rien supposer.
 */
export default function ErreurGlobale({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-[52ch]">
          <p className="font-mono text-[11px] font-bold tracking-[.22em] text-oni uppercase">
            Erreur critique
          </p>

          <h1 className="mt-4 font-titre text-[clamp(28px,6vw,48px)] leading-none">
            LJKITS est momentanément indisponible
          </h1>

          <p className="mt-5 text-gris">
            Le site n’a pas pu se charger. Recharge la page dans un instant — le serveur
            Minecraft, lui, n’est pas concerné : <b className="text-creme">{SITE.ip}</b> reste
            joignable.
          </p>

          {error.digest && (
            <p className="mt-5 font-mono text-[11px] tracking-[.06em] text-gris">
              Code de l’incident : <span className="text-creme">{error.digest}</span>
            </p>
          )}

          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-controle bg-soupe px-4.5 py-2.5 font-mono text-[12.5px] font-bold tracking-[.08em] text-encre uppercase transition-colors hover:bg-or"
          >
            Recharger
          </button>
        </div>
      </body>
    </html>
  )
}
