'use client'

import Image from 'next/image'
import Link from 'next/link'

import { classesBouton } from '@/components/ui/Bouton'
import { Enveloppe } from '@/components/ui/Enveloppe'

/**
 * Page d'erreur des routes du site.
 *
 * Elle prend la place du contenu quand un composant serveur ou client lève une
 * exception non rattrapée. Le layout racine, lui, reste en place : polices,
 * feuille de style et tokens sont donc disponibles.
 *
 * ⚠ Pas de <PagePublique> : c'est un composant CLIENT, et PagePublique est un
 * composant serveur asynchrone qui lit les réglages en base. Or la base est
 * précisément ce qui vient peut-être de tomber. Cette page ne dépend de rien
 * d'autre que d'elle-même.
 *
 * `digest` est l'identifiant que Next.js attribue à l'erreur côté serveur. Le
 * message réel n'est jamais envoyé au navigateur en production : c'est ce
 * digest qu'on retrouve dans les journaux, et c'est donc lui qu'on affiche
 * pour qu'un visiteur puisse le citer.
 */
export default function ErreurDeRoute({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="halo-hero flex min-h-screen flex-col items-center justify-center py-16 text-center">
      <Enveloppe>
        <div className="mx-auto max-w-lecture">
          <Link
            href="/"
            className="mb-9 inline-flex min-h-11 items-center"
            aria-label="Retour à l’accueil"
          >
            <Image src="/logo-texte.png" alt="LJKITS" width={71} height={24} />
          </Link>

          <p className="font-mono text-[11px] font-bold tracking-[.22em] text-oni uppercase">
            Erreur inattendue
          </p>

          <h1 className="text-h1 mt-4 font-titre">
            Le bol s’est <span className="text-or">renversé</span>
          </h1>

          <p className="mx-auto mt-4.5 max-w-[48ch] text-gris">
            Quelque chose a mal tourné de notre côté. Réessaye — si ça recommence, le
            serveur Minecraft, lui, tourne toujours.
          </p>

          {error.digest && (
            <p className="mt-5 font-mono text-[11px] tracking-[.06em] text-gris">
              Code de l’incident : <span className="text-creme">{error.digest}</span>
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-2.75">
            <button
              type="button"
              onClick={reset}
              className={classesBouton({ variante: 'plein' })}
            >
              Réessayer
            </button>
            <Link href="/" className={classesBouton({ variante: 'vide' })}>
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </Enveloppe>
    </main>
  )
}
