import { NextResponse, type NextRequest } from 'next/server'

import { LANGUE_DEFAUT, LANGUES } from '@/lib/i18n'
import { MAINTENANCE, OUVERTS_EN_MAINTENANCE } from '@/lib/site'

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
const PUBLIQUES = ['classement', 'boutique', 'reglement', 'recrutement', 'joueur', 'match', 'matchs', 'partenaire', 'ljscan', 'suggestions', 'avis']

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

  // Déjà préfixé : rien à faire… sauf en maintenance (12/10/2026), où tout ce qui
  // n'est pas le classement ou un profil affiche la page de maintenance.
  const prefixe = LANGUES.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (prefixe) {
    // Refonte S2 (16/10/2026) : la saison et le mode passent dans le chemin. Les
    // anciennes adresses `?mode=`/`?saison=` (partagées sur Discord) y sont renvoyées.
    const parametres = requete.nextUrl.searchParams
    const morceaux = pathname.split('/')
    const saisonDemandee = parametres.get('saison')
    const modeDemande = parametres.get('mode')
    if ((saisonDemandee || modeDemande) && morceaux[2] === 'classement' && morceaux.length === 3) {
      const url = requete.nextUrl.clone()
      url.search = ''
      url.pathname = [pathname, saisonDemandee && /^\d{1,3}$/.test(saisonDemandee) ? `saison-${saisonDemandee}` : '', modeDemande && modeDemande !== 'global' && /^[a-z]{1,20}$/.test(modeDemande) ? modeDemande : '']
        .filter(Boolean)
        .join('/')
      return NextResponse.redirect(url, 308)
    }
    if (saisonDemandee && /^\d{1,3}$/.test(saisonDemandee) && morceaux[2] === 'joueur' && morceaux.length === 4) {
      const url = requete.nextUrl.clone()
      url.search = ''
      url.pathname = `${pathname}/saison-${saisonDemandee}`
      return NextResponse.redirect(url, 308)
    }

    if (MAINTENANCE) {
      const section = pathname.split('/')[2] ?? ''
      if (!OUVERTS_EN_MAINTENANCE.includes(section)) {
        const url = requete.nextUrl.clone()
        url.pathname = `/${prefixe}/maintenance`
        return NextResponse.rewrite(url)
      }
    }
    return NextResponse.next()
  }

  const premier = pathname.split('/')[1] ?? ''
  const estAncienChemin = pathname === '/' || PUBLIQUES.includes(premier)
  if (!estAncienChemin) {
    return NextResponse.next()
  }

  const url = requete.nextUrl.clone()
  // /suggestions aussi : c'est le lien posté sur Discord, lu par des FR et des EN.
  const langue = premier === 'ljscan' || premier === 'suggestions'
    ? langueDemandee(requete.headers.get('accept-language'))
    : LANGUE_DEFAUT
  url.pathname = `/${langue}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|admin|connexion|_next|.*\\..*).*)'],
}
