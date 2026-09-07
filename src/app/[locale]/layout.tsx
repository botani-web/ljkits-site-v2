import { notFound } from 'next/navigation'

import { LangueDuDocument } from '@/components/public/LangueDuDocument'
import { estLocale, LANGUES, type Locale } from '@/lib/i18n'

/**
 * Le segment de langue commun à toutes les pages publiques.
 *
 * Il ne fait que deux choses : refuser une langue inconnue — `/de/kits`
 * doit être un 404 franc, pas une page à moitié traduite — et corriger
 * l'attribut `lang` du document.
 *
 * POURQUOI `lang` EST CORRIGÉ ICI ET PAS DANS LE LAYOUT RACINE : le
 * layout racine porte le `<html>`, mais il est partagé avec /admin et
 * /connexion et ne connaît pas la langue de la page. Le lire depuis les
 * en-têtes rendrait TOUTES les pages dynamiques et ferait sauter le cache
 * d'une heure des pages publiques. Un composant client de cinq lignes
 * coûte moins cher que de perdre le rendu statique.
 */
export function generateStaticParams() {
  return LANGUES.map((locale) => ({ locale }))
}

export default async function LayoutLangue({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!estLocale(locale)) notFound()

  return (
    <>
      <LangueDuDocument locale={locale as Locale} />
      {children}
    </>
  )
}
