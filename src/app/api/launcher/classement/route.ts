import { NextResponse } from 'next/server'

import { estVue, lireClassementCache } from '@/lib/practice'
import { contexteSaison } from '@/lib/saisons'

/**
 * Le classement d'un mode pour l'onglet Classement du launcher (21/10/2026).
 *
 * Lecture seule, les mêmes lignes que la page /classement : pseudo, Elo et
 * bilan. 50 lignes au plus, le launcher n'en montre qu'une dizaine.
 */
export const dynamic = 'force-dynamic'

const LIMITE_MAX = 50

export async function GET(requete: Request) {
  const params = new URL(requete.url).searchParams
  const mode = params.get('mode') ?? 'global'
  if (!estVue(mode)) {
    return NextResponse.json({ erreur: 'mode inconnu' }, { status: 400 })
  }
  const limite = Math.min(Math.max(Number(params.get('limite')) || 10, 1), LIMITE_MAX)

  const contexte = await contexteSaison(null)
  if (!contexte) return NextResponse.json({ erreur: 'aucune saison' }, { status: 404 })
  const { saison } = contexte

  const lignes = (await lireClassementCache(saison, mode, limite)).map((l) => ({
    rang: l.rang,
    pseudo: l.pseudo,
    elo: l.elo,
    victoires: l.victoires,
    defaites: l.defaites,
  }))

  return NextResponse.json(
    { saison, mode, lignes },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } },
  )
}
