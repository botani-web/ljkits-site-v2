import { NextResponse } from 'next/server'

import { rechercherPartout } from '@/lib/joueurs'

/**
 * La recherche de la barre de navigation (16/10/2026) : toutes saisons
 * confondues, pour qu'un joueur de la saison 1 reste trouvable en saison 2.
 *
 * Lecture seule, rien de sensible (pseudo et Elo sont publics). Le CDN garde
 * chaque saisie 30 s : la même frappe chez dix visiteurs = une requête en base.
 */
export const dynamic = 'force-dynamic'

export async function GET(requete: Request) {
  const saisie = (new URL(requete.url).searchParams.get('q') ?? '').trim()
  if (saisie.length === 0 || saisie.length > 16) return NextResponse.json({ joueurs: [] })
  const joueurs = await rechercherPartout(saisie, 8)
  return NextResponse.json(
    { joueurs },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } },
  )
}
