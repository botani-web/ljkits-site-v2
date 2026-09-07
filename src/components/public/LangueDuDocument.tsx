'use client'

import { useEffect } from 'react'

import type { Locale } from '@/lib/i18n'

/**
 * Aligne `<html lang>` sur la langue de la page.
 *
 * Le layout racine est partagé avec /admin : il ne peut pas connaître la
 * langue sans devenir dynamique, ce qui ferait sauter le cache des pages
 * publiques. On corrige donc l'attribut après l'hydratation. Les moteurs
 * lisent surtout l'URL et les liens `hreflang` des métadonnées, tous deux
 * corrects ; ceci sert d'abord aux lecteurs d'écran.
 */
export function LangueDuDocument({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
