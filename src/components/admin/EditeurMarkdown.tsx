'use client'

import { useState } from 'react'

import { markdownVersHtml } from '@/lib/markdown'

/**
 * Zone de saisie Markdown avec deux onglets : Écrire et Aperçu.
 *
 * L'aperçu utilise EXACTEMENT la même fonction que le rendu public
 * (src/lib/markdown.ts). Ce qu'on voit ici est donc ce qui sera publié,
 * échappement du HTML brut compris. Le prix à payer est que `marked` se
 * retrouve dans le bundle des pages d'admin — pas dans celui du site public,
 * qui rend son Markdown côté serveur.
 */
const AIDE_MARKDOWN = [
  { syntaxe: '**gras**', effet: 'texte en gras (doré)' },
  { syntaxe: '*italique*', effet: 'texte en italique' },
  { syntaxe: '## Titre', effet: 'sous-titre' },
  { syntaxe: '- élément', effet: 'liste à puces' },
  { syntaxe: '1. élément', effet: 'liste numérotée' },
  { syntaxe: '> encart', effet: 'encart orange (callout)' },
  { syntaxe: '[texte](https://…)', effet: 'lien' },
  { syntaxe: '`code`', effet: 'commande en jeu, ex /discord' },
]

export function EditeurMarkdown({
  nom,
  label,
  valeurInitiale = '',
  erreurs,
  lignes = 16,
}: {
  nom: string
  label: string
  valeurInitiale?: string
  erreurs?: string[]
  lignes?: number
}) {
  const [contenu, setContenu] = useState(valeurInitiale)
  const [onglet, setOnglet] = useState<'ecrire' | 'apercu'>('ecrire')

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={nom} className="text-sm font-semibold text-creme">
          {label}
        </label>

        <div className="flex gap-1" role="tablist" aria-label="Mode d’affichage">
          <BoutonOnglet actif={onglet === 'ecrire'} onClick={() => setOnglet('ecrire')}>
            Écrire
          </BoutonOnglet>
          <BoutonOnglet actif={onglet === 'apercu'} onClick={() => setOnglet('apercu')}>
            Aperçu
          </BoutonOnglet>
        </div>
      </div>

      {/*
        Le textarea reste monté même en mode Aperçu (simplement masqué) :
        c'est lui qui porte le `name`, donc c'est lui qui envoie la valeur
        avec le formulaire. Le démonter viderait le champ à l'envoi.
      */}
      <textarea
        id={nom}
        name={nom}
        rows={lignes}
        value={contenu}
        onChange={(evenement) => setContenu(evenement.target.value)}
        className={`w-full resize-y rounded-lg border border-bord bg-nuit px-3.5 py-2.5 font-mono text-sm leading-relaxed text-creme focus:border-soupe focus:outline-none ${
          onglet === 'apercu' ? 'hidden' : ''
        }`}
      />

      {onglet === 'apercu' && (
        <div className="min-h-40 rounded-lg border border-bord bg-nuit px-4 py-3.5">
          {contenu.trim() === '' ? (
            <p className="text-sm text-gris">Rien à afficher : le champ est vide.</p>
          ) : (
            <div
              className="markdown"
              dangerouslySetInnerHTML={{ __html: markdownVersHtml(contenu) }}
            />
          )}
        </div>
      )}

      {erreurs?.length ? (
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {erreurs.map((message) => (
            <li key={message} className="text-[13px] text-rouge">
              {message}
            </li>
          ))}
        </ul>
      ) : null}

      {/* ---- rappel de la syntaxe, sous la zone de texte ---- */}
      <details className="mt-3 rounded-lg border border-bord bg-charbon px-4 py-3">
        <summary className="cursor-pointer text-[13px] font-semibold text-gris select-none">
          Rappel de la syntaxe Markdown
        </summary>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {AIDE_MARKDOWN.map((ligne) => (
            <div key={ligne.syntaxe} className="flex items-baseline gap-2.5">
              <dt className="shrink-0 rounded bg-braise px-2 py-0.5 font-mono text-xs text-or">
                {ligne.syntaxe}
              </dt>
              <dd className="text-[13px] text-gris">{ligne.effet}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[13px] text-gris">
          Les balises HTML tapées ici ne sont pas interprétées : elles s’affichent telles
          quelles sur le site.
        </p>
      </details>
    </div>
  )
}

function BoutonOnglet({
  actif,
  onClick,
  children,
}: {
  actif: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={actif}
      onClick={onClick}
      className={`rounded-md px-3 py-1 font-mono text-[12px] font-bold tracking-wide uppercase transition-colors ${
        actif ? 'bg-soupe text-[#1a0f00]' : 'border border-bord text-gris hover:text-creme'
      }`}
    >
      {children}
    </button>
  )
}
