import { NextResponse } from 'next/server'

import { gradesAchetes } from '@/lib/joueurs'

/**
 * Ce que la boutique doit savoir d'un pseudo (16/10/2026) : est-il déjà venu,
 * a-t-il déjà LJ+ ou LJ++. Rien de privé — le grade se voit en jeu par tous.
 */
export const dynamic = 'force-dynamic'

export async function GET(requete: Request) {
  const pseudo = (new URL(requete.url).searchParams.get('pseudo') ?? '').trim()
  const etat = await gradesAchetes(pseudo)
  return NextResponse.json(etat, { headers: { 'Cache-Control': 'no-store' } })
}
