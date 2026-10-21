import { NextResponse } from 'next/server'

import { lireProfil } from '@/lib/practice'
import { modesDeSaison } from '@/lib/practice-commun'
import { saisonDu } from '@/lib/saison'
import { contexteSaison } from '@/lib/saisons'

/**
 * Les stats ranked d'un joueur pour l'accueil du launcher (21/10/2026).
 *
 * Lecture seule, rien de plus que sa page /joueur : Elo, place et bilan par
 * mode de la saison affichée, et ses derniers matchs. Le cache du CDN garde
 * la réponse 30 s : un launcher ouvert ne coûte pas une requête en base à
 * chaque rafraîchissement.
 */
export const dynamic = 'force-dynamic'

/** Un pseudo Minecraft : 3 à 16 lettres, chiffres ou « _ ». */
const PSEUDO = /^[A-Za-z0-9_]{3,16}$/
const MATCHS_RENDUS = 5

export async function GET(requete: Request) {
  const pseudo = (new URL(requete.url).searchParams.get('pseudo') ?? '').trim()
  if (!PSEUDO.test(pseudo)) {
    return NextResponse.json({ erreur: 'pseudo invalide' }, { status: 400 })
  }

  const contexte = await contexteSaison(null)
  if (!contexte) return NextResponse.json({ erreur: 'aucune saison' }, { status: 404 })
  const { saison } = contexte
  const fin = saisonDu().numero === saison ? saisonDu().fin.toISOString() : null

  const profil = await lireProfil(saison, pseudo)
  const entete = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' }
  if (!profil) {
    return NextResponse.json({ saison, fin, joueur: null }, { headers: entete })
  }

  // Les modes de la saison dans l'ordre du site, même ceux pas encore joués.
  const parMode = new Map(profil.modes.map((m) => [m.mode, m]))
  const modes = modesDeSaison(saison).map((m) => {
    const s = parMode.get(m.id)
    return {
      mode: m.id,
      nom: m.nom,
      elo: s?.elo ?? null,
      rang: s?.rang ?? null,
      total: s?.total ?? null,
      victoires: s?.victoires ?? 0,
      defaites: s?.defaites ?? 0,
      serie: s?.serie ?? 0,
    }
  })

  const matchs = profil.historique
    .filter((m) => !m.annule)
    .slice(0, MATCHS_RENDUS)
    .map((m) => ({
      id: m.id,
      mode: m.mode,
      instant: m.instant,
      victoire: m.victoire,
      adversaire: m.adversairePseudo,
      delta: m.delta,
      duree: m.duree,
    }))

  return NextResponse.json(
    {
      saison,
      fin,
      joueur: { uuid: profil.uuid, pseudo: profil.pseudo, exclu: profil.exclu, modes, matchs },
    },
    { headers: entete },
  )
}
