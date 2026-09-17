import { NextResponse, type NextRequest } from 'next/server'

import { LANGUE_DEFAUT, LANGUES } from '@/lib/i18n'

/**
 * Aiguillage des langues.
 *
 * `/` et les anciennes adresses sans préfixe partent vers l'anglais, qui
 * est la langue par défaut du site. Les redirections des anciens chemins
 * ne sont pas de la politesse : `/kits` a circulé sur Discord et dans le
 * jeu, ces liens doivent continuer de fonctionner.
 *
 * Tout ce qui n'est pas public — /admin, /api, /connexion, les fichiers —
 * est laissé tranquille par le `matcher` en bas.
 */
const PUBLIQUES = ['kits', 'classement', 'boutique', 'reglement', 'recrutement', 'joueur', 'partenaire']

export function middleware(requete: NextRequest) {
  const { pathname } = requete.nextUrl

  // Déjà préfixé : rien à faire.
  if (LANGUES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) {
    return NextResponse.next()
  }

  const premier = pathname.split('/')[1] ?? ''
  const estAncienChemin = pathname === '/' || PUBLIQUES.includes(premier)
  if (!estAncienChemin) {
    return NextResponse.next()
  }

  const url = requete.nextUrl.clone()
  url.pathname = `/${LANGUE_DEFAUT}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|admin|connexion|_next|.*\\..*).*)'],
}
