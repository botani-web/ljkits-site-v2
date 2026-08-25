import { z } from 'zod'

import { auth } from '@/lib/auth'
import { requeteCronAutorisee } from '@/lib/cron'
import { prisma } from '@/lib/prisma'
import { lireDernierEchantillon, lireEtatCollecte } from '@/lib/stats'

/**
 * Relevé de fréquentation, poussé depuis le VPS.
 *
 * Ce n'est PAS un cron Vercel : c'est le bot Discord relié au serveur en RCON
 * qui appelle cette route toutes les dix minutes. La donnée vient donc
 * directement du serveur (aucune dépendance à mcstatus.io) et ne dépend
 * d'aucun plafond de plan.
 *
 * Un seul écrivain en base — l'app Next — garde le schéma encapsulé et la
 * saisie validée : le bot n'a ni les identifiants Neon ni les noms de tables
 * Prisma à connaître, juste le CRON_SECRET partagé, envoyé en Bearer :
 *
 *   POST /api/frequentation
 *   Authorization: Bearer <CRON_SECRET>
 *   { "enLigne": true, "joueurs": 12, "maxJoueurs": 60 }
 *
 * Serveur injoignable côté bot : il POST quand même { enLigne: false }, ce qui
 * pose une ligne à zéro. Un serveur éteint (ligne à false) se distingue ainsi
 * d'un collecteur en panne (aucune ligne).
 *
 * GET renvoie la fraîcheur du dernier relevé et le nombre d'échantillons reçus
 * sur 24 h, pour la tuile du tableau de bord — réservé à l'admin connecté.
 */
export const dynamic = 'force-dynamic'

/**
 * Un échantillon accepté au maximum par tranche de quatre minutes ; au-delà,
 * 429. Le collecteur légitime poste toutes les dix minutes (voire cinq si on
 * veut affiner la courbe), largement dans les clous — quatre minutes laissent
 * de la marge à la dérive d'un setInterval. Ce plafond est une ceinture de
 * sécurité : si le CRON_SECRET fuitait (un .env dans un backup, une capture
 * d'écran…), personne ne pourrait noyer la courbe sous des milliers de points.
 */
const FENETRE_MIN_MS = 4 * 60 * 1000

const corpsAttendu = z.object({
  enLigne: z.boolean(),
  joueurs: z.number().int().min(0).max(100_000),
  maxJoueurs: z.number().int().min(0).max(100_000).default(0),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ erreur: 'Non autorisé.' }, { status: 401 })
  }

  const { dernier, nombre24h } = await lireEtatCollecte()
  return Response.json(
    { releveLe: dernier ? dernier.toISOString() : null, echantillons24h: nombre24h },
    { status: 200 },
  )
}

export async function POST(requete: Request) {
  if (!requeteCronAutorisee(requete)) {
    return Response.json({ erreur: 'Non autorisé.' }, { status: 401 })
  }

  let corps: unknown
  try {
    corps = await requete.json()
  } catch {
    return Response.json({ erreur: 'Corps illisible.' }, { status: 400 })
  }

  const lu = corpsAttendu.safeParse(corps)
  if (!lu.success) {
    return Response.json({ erreur: 'Message invalide.' }, { status: 400 })
  }

  // Rate limit : refuse un relevé trop rapproché du précédent. Voir l'en-tête.
  // Le 429 dit combien de secondes attendre, pour un diagnostic direct depuis
  // les logs du bot (et l'en-tête Retry-After standard, tant qu'à faire).
  const dernier = await lireDernierEchantillon()
  if (dernier) {
    const ecouleMs = Date.now() - dernier.getTime()
    if (ecouleMs < FENETRE_MIN_MS) {
      const secondesRestantes = Math.ceil((FENETRE_MIN_MS - ecouleMs) / 1000)
      return Response.json(
        {
          erreur: 'Trop de relevés : un seul par tranche de 4 minutes.',
          secondesRestantes,
        },
        { status: 429, headers: { 'Retry-After': String(secondesRestantes) } },
      )
    }
  }

  // Hors ligne : on force joueurs à 0 quoi qu'ait envoyé le bot. Un serveur
  // éteint ne peut pas avoir de joueurs, et cette normalisation évite qu'une
  // donnée incohérente ne s'installe dans la courbe.
  const joueurs = lu.data.enLigne ? lu.data.joueurs : 0

  try {
    await prisma.echantillonFrequentation.create({
      data: { enLigne: lu.data.enLigne, joueurs, maxJoueurs: lu.data.maxJoueurs },
    })
    return Response.json({ enregistre: true }, { status: 200 })
  } catch (erreur) {
    console.error('[frequentation] écriture impossible :', erreur)
    return Response.json({ erreur: 'Écriture impossible.' }, { status: 500 })
  }
}
