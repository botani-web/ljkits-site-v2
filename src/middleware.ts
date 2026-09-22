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
const PUBLIQUES = ['classement', 'boutique', 'reglement', 'recrutement', 'joueur', 'partenaire', 'ljscan']

/**
 * /ljscan SUIT LA LANGUE DU NAVIGATEUR, contrairement au reste du site.
 *
 * C'est l'adresse que le staff donne EN JEU quand il demande un screenshare :
 * la page doit rassurer quelqu'un qui ne nous fait pas encore confiance et qui
 * s'apprête à lancer un .exe. Une page dans une langue qu'il ne lit pas fait
 * exactement l'inverse. Le reste du site garde l'anglais par défaut.
 */
function langueDemandee(entete: string | null): string {
  return entete?.toLowerCase().startsWith('fr') ? 'fr' : LANGUE_DEFAUT
}

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
  const langue = premier === 'ljscan'
    ? langueDemandee(requete.headers.get('accept-language'))
    : LANGUE_DEFAUT
  url.pathname = `/${langue}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|admin|connexion|_next|.*\\..*).*)'],
}
