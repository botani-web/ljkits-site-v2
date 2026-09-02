import {
  lireChiffresSaison,
  lireClassementElo,
  lireDerniersCombats,
  lireSaisonCourante,
} from '@/lib/elo'

/**
 * Le classement Elo, en JSON, pour la mise à jour en direct de la page.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  POURQUOI DU SONDAGE ET PAS DU TEMPS RÉEL
 * ═══════════════════════════════════════════════════════════════════════
 * Un WebSocket est impossible sur Vercel : les fonctions serverless ne
 * gardent aucune connexion ouverte entre deux requêtes. Le SSE tiendrait
 * techniquement, mais chaque spectateur monopoliserait une fonction
 * pendant toute sa visite — sur un classement que les visiteurs laissent
 * ouvert en fond, la facture grimpe vite pour un gain nul : les combats
 * n'arrivent pas plus vite que quelques-uns par minute.
 *
 * La page interroge donc cette route à intervalle régulier.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  LE CACHE EST CE QUI REND LE SONDAGE VIABLE
 * ═══════════════════════════════════════════════════════════════════════
 * Sans lui, cent visiteurs qui sondent toutes les quinze secondes, ce
 * sont quatre cents requêtes par minute sur Neon. Avec le `s-maxage`
 * ci-dessous, le CDN de Vercel sert la même réponse à tout le monde et
 * la base n'est interrogée qu'UNE fois par fenêtre, quel que soit le
 * nombre de spectateurs.
 *
 * `stale-while-revalidate` évite en plus le pic au moment de l'expiration :
 * le CDN continue de servir la version périmée pendant qu'il en régénère
 * une, plutôt que de laisser passer tout le monde vers la base d'un coup.
 */
/*
 * DYNAMIQUE, ET NON `revalidate = 8`.
 *
 * Avec `revalidate`, Next gardait sa propre copie et la servait périmée en
 * régénérant en arrière-plan — exactement ce que fait déjà le CDN avec
 * `stale-while-revalidate`. Deux étages qui servent chacun du périmé, ça
 * s'additionne : jusqu'à une minute de retard en trafic faible. Un seul
 * étage suffit, et c'est le CDN, parce que lui seul mutualise entre
 * visiteurs.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const saison = await lireSaisonCourante()

  if (!saison) {
    return Response.json(
      { saison: null, lignes: [], combats: [], chiffres: null },
      { headers: enTetesCache() },
    )
  }

  const [lignes, chiffres, combats] = await Promise.all([
    lireClassementElo(saison.id),
    lireChiffresSaison(saison.id),
    lireDerniersCombats(saison.id, 10),
  ])

  return Response.json(
    {
      saison: { id: saison.id, nom: saison.nom },
      lignes,
      combats,
      chiffres: {
        joueurs: chiffres.joueurs,
        combats: chiffres.combats,
        derniereMaj: chiffres.derniereMaj?.toISOString() ?? null,
      },
    },
    { headers: enTetesCache() },
  )
}

/**
 * Deux destinataires, deux consignes.
 *
 * NAVIGATEUR : `max-age=0, must-revalidate`. Vercel retire `s-maxage` de
 * ce qu'il renvoie au client ; il restait un `public` nu, qui autorise un
 * navigateur à garder sa copie par heuristique. Le sondage relisait alors
 * son propre cache. Constaté en production le 02/09/2026.
 *
 * CDN : 8 s de fraîcheur, 20 s de périmé toléré pendant la régénération.
 * Le `stale-while-revalidate` était à 45 : c'est la borne haute du retard
 * possible, on la ramène à 20. Sur `Vercel-CDN-Cache-Control` pour que la
 * consigne CDN n'atteigne jamais le navigateur.
 */
function enTetesCache(): HeadersInit {
  return {
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'Vercel-CDN-Cache-Control': 'public, s-maxage=8, stale-while-revalidate=20',
  }
}
