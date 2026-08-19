import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { refuserSiJetonInvalide } from '@/lib/jeton'
import { prisma } from '@/lib/prisma'

/**
 * Compte rendu d'exécution — appelé par le bot RCON après chaque lot.
 *
 *   POST /api/livraison/confirmer
 *   Authorization: Bearer <LIVRAISON_TOKEN>
 *   { "resultats": [ { "id": "...", "succes": true },
 *                    { "id": "...", "succes": false, "erreur": "..." } ] }
 *
 * Comme /api/livraison/file, l'authentification est le jeton partagé, pas une
 * session admin.
 */

export const dynamic = 'force-dynamic'

const schemaResultats = z.object({
  resultats: z
    .array(
      z.object({
        id: z.string().min(1),
        succes: z.boolean(),
        erreur: z.string().max(500).optional(),
      }),
    )
    .min(1, 'Aucun résultat transmis.')
    .max(100, 'Cent résultats au maximum par appel.'),
})

export async function POST(requete: Request) {
  const refus = refuserSiJetonInvalide(requete)
  if (refus) {
    return Response.json({ erreur: refus }, { status: 401 })
  }

  let corps: unknown
  try {
    corps = await requete.json()
  } catch {
    return Response.json({ erreur: 'Corps JSON illisible.' }, { status: 400 })
  }

  const valide = schemaResultats.safeParse(corps)
  if (!valide.success) {
    return Response.json(
      { erreur: 'Requête invalide.', details: valide.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { resultats } = valide.data

  // On ne traite que des lignes réellement en attente : un bot qui rejoue un
  // ancien lot ne doit pas réécrire une ligne déjà relancée depuis l'admin.
  const lignes = await prisma.ligneLivraison.findMany({
    where: { id: { in: resultats.map((r) => r.id) }, statut: 'EN_ATTENTE' },
    select: { id: true, commandeId: true },
  })

  const connues = new Map(lignes.map((ligne) => [ligne.id, ligne.commandeId]))
  const commandesTouchees = new Set(lignes.map((ligne) => ligne.commandeId))

  let executees = 0
  let echouees = 0

  for (const resultat of resultats) {
    if (!connues.has(resultat.id)) continue

    if (resultat.succes) {
      await prisma.ligneLivraison.update({
        where: { id: resultat.id },
        data: {
          statut: 'EXECUTEE',
          executeeAt: new Date(),
          tentatives: { increment: 1 },
          derniereErreur: null,
        },
      })
      executees += 1
    } else {
      await prisma.ligneLivraison.update({
        where: { id: resultat.id },
        data: {
          // La ligne reste EN_ATTENTE tant qu'il reste des tentatives : c'est
          // le compteur, lu par /api/livraison/file, qui la sortira de la file.
          statut: 'ECHOUEE',
          tentatives: { increment: 1 },
          derniereErreur: resultat.erreur ?? 'Échec sans message.',
        },
      })
      echouees += 1
    }
  }

  /* ---- une commande entièrement exécutée passe en LIVREE ---- */
  const commandesLivrees: string[] = []

  for (const commandeId of commandesTouchees) {
    const restantes = await prisma.ligneLivraison.count({
      where: { commandeId, type: 'LIVRAISON', statut: { not: 'EXECUTEE' } },
    })
    if (restantes > 0) continue

    const commande = await prisma.commande.findUnique({ where: { id: commandeId } })
    // On ne touche qu'aux commandes payées : une commande remboursée ou en
    // litige ne doit pas repasser en LIVREE parce que ses retraits ont abouti.
    if (!commande || commande.statut !== 'PAYEE') continue

    await prisma.commande.update({
      where: { id: commandeId },
      data: { statut: 'LIVREE', livreeAt: commande.livreeAt ?? new Date() },
    })
    commandesLivrees.push(commandeId)
  }

  revalidatePath('/admin/commandes')
  for (const commandeId of commandesTouchees) {
    revalidatePath(`/admin/commandes/${commandeId}`)
  }

  return Response.json(
    {
      recu: resultats.length,
      traitees: connues.size,
      executees,
      echouees,
      commandesLivrees: commandesLivrees.length,
    },
    { status: 200 },
  )
}
