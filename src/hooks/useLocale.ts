'use client'

import { usePathname } from 'next/navigation'

import { estLocale, LANGUE_DEFAUT, type Locale } from '@/lib/i18n'

/**
 * La langue courante, lue dans l'URL.
 *
 * Les composants client vivent tous sous /en ou /fr : l'adresse porte déjà
 * l'information. La lire ici évite de faire descendre une propriété `locale`
 * à travers toute la boutique — panier, modale, boutons — pour un chemin de
 * données qui n'apporterait rien de plus.
 *
 * Les composants SERVEUR, eux, reçoivent la langue en propriété : ils n'ont
 * pas accès aux hooks, et leur page la connaît déjà.
 */
export function useLocale(): Locale {
  const chemin = usePathname()
  const premier = chemin.split('/')[1]
  return estLocale(premier) ? premier : LANGUE_DEFAUT
}
