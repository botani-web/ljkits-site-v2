import { NextResponse } from 'next/server'

import { lireSaisonCourante } from '@/lib/elo'
import { rechercherJoueurs } from '@/lib/practice'

/**
 * Les suggestions de la recherche de joueur (classement et profils).
 *
 * Lecture seule, sans donnée sensible (pseudo et Elo sont déjà publics sur le
 * classement). Le cache du CDN absorbe la frappe : la même saisie, tapée par
 * plusieurs visiteurs, ne coûte qu'une requête en base toutes les 30 secondes.
 */
export const dynamic = 'force-dynamic'

/** Un pseudo Minecraft fait au plus 16 caractères. */
const SAISIE_MAX = 16

export async function GET(requete: Request) {
  const saisie = (new URL(requete.url).searchParams.get('q') ?? '').trim()
  if (saisie.length === 0 || saisie.length > SAISIE_MAX) {
    return NextResponse.json({ joueurs: [] })
  }

  const saison = await lireSaisonCourante()
  const joueurs = saison ? await rechercherJoueurs(saison.id, saisie, 8) : []

  return NextResponse.json(
    { joueurs },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } },
  )
}
