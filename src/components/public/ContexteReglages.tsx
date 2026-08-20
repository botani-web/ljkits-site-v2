'use client'

import { createContext, useContext } from 'react'

import { REGLAGES_PAR_DEFAUT, type Reglages } from '@/lib/reglages'

/**
 * Met les réglages à disposition des composants CLIENT.
 *
 * La barre de navigation, le bouton de copie de l'IP ou l'encart de statut
 * tournent dans le navigateur : ils ne peuvent pas interroger la base. Les
 * réglages sont donc lus une fois côté serveur, dans <PagePublique>, et
 * descendus par ce contexte.
 *
 * Les composants SERVEUR, eux, n'en ont pas besoin : ils appellent directement
 * `lireReglages()`, dont l'appel est dédupliqué par le cache de React.
 */
const ContexteReglages = createContext<Reglages>(REGLAGES_PAR_DEFAUT)

export function FournisseurReglages({
  reglages,
  children,
}: {
  reglages: Reglages
  children: React.ReactNode
}) {
  return <ContexteReglages value={reglages}>{children}</ContexteReglages>
}

/** Les réglages courants, depuis n'importe quel composant client. */
export function useReglages() {
  return useContext(ContexteReglages)
}
