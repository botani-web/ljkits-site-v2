import { z } from 'zod'

import { prisma } from '@/lib/prisma'

/**
 * Collecte d'audience — appelée par <SuiviAudience>, jamais par un humain.
 *
 * Deux messages sur la même route, parce que le second part en `sendBeacon`
 * au moment où l'onglet se ferme : un beacon ne choisit ni sa méthode ni ses
 * en-têtes, il fallait donc un POST unique qui accepte les deux formes.
 *
 *   { type: 'vue',   … }  → enregistre la page vue, renvoie son id
 *   { type: 'duree', … }  → complète cette vue avec le temps passé dessus
 *
 * Ce qui n'est PAS collecté, et ne doit jamais l'être : adresse IP,
 * user-agent, identifiant persistant. `visiteId` est tiré au hasard et vit
 * dans le sessionStorage — il disparaît avec l'onglet. Pas de cookie, donc
 * pas de bandeau de consentement à afficher.
 */

export const dynamic = 'force-dynamic'

/**
 * Plafond de durée : 30 minutes.
 *
 * Un onglet laissé ouvert toute la nuit produirait une durée de huit heures
 * qui écraserait la moyenne de toutes les autres pages. On préfère une valeur
 * bornée et honnête à une moyenne rendue inutile par une seule valeur folle.
 */
const DUREE_MAX_MS = 30 * 60 * 1000

const messageVue = z.object({
  type: z.literal('vue'),
  /** Chemin interne uniquement : commence par « / », jamais d'URL absolue. */
  chemin: z
    .string()
    .min(1)
    .max(300)
    .refine((c) => c.startsWith('/') && !c.startsWith('//'), 'Chemin interne attendu.'),
  visiteId: z.string().min(8).max(64),
  source: z.string().max(120).nullable(),
  appareil: z.enum(['MOBILE', 'TABLETTE', 'BUREAU']),
})

const messageDuree = z.object({
  type: z.literal('duree'),
  id: z.string().min(1).max(64),
  dureeMs: z.number().int().min(0),
})

const message = z.discriminatedUnion('type', [messageVue, messageDuree])

export async function POST(requete: Request) {
  let corps: unknown
  try {
    corps = await requete.json()
  } catch {
    return Response.json({ erreur: 'Corps illisible.' }, { status: 400 })
  }

  const lu = message.safeParse(corps)
  if (!lu.success) {
    return Response.json({ erreur: 'Message invalide.' }, { status: 400 })
  }

  // L'admin ne s'auto-mesure pas : ce sont tes propres passages, ils
  // fausseraient les chiffres de fréquentation.
  if (lu.data.type === 'vue' && lu.data.chemin.startsWith('/admin')) {
    return Response.json({ ignore: true }, { status: 200 })
  }

  try {
    if (lu.data.type === 'vue') {
      const vue = await prisma.vuePage.create({
        data: {
          chemin: lu.data.chemin,
          visiteId: lu.data.visiteId,
          source: lu.data.source,
          appareil: lu.data.appareil,
        },
        select: { id: true },
      })
      return Response.json({ id: vue.id }, { status: 200 })
    }

    // `updateMany` plutôt que `update` : un id inconnu ne doit pas lever une
    // exception, il ne mérite qu'un silence. Le client n'attend pas la réponse.
    await prisma.vuePage.updateMany({
      where: { id: lu.data.id, dureeMs: null },
      data: { dureeMs: Math.min(lu.data.dureeMs, DUREE_MAX_MS) },
    })
    return Response.json({ recu: true }, { status: 200 })
  } catch (erreur) {
    // Une panne de statistiques ne doit jamais remonter au visiteur.
    console.error('[stats] écriture impossible :', erreur)
    return Response.json({ erreur: 'Écriture impossible.' }, { status: 500 })
  }
}
