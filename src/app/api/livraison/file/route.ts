import { refuserSiJetonInvalide } from '@/lib/jeton'
import { prisma } from '@/lib/prisma'

/**
 * File de livraison — lue par le bot RCON qui tourne à côté du serveur.
 *
 *   GET /api/livraison/file
 *   Authorization: Bearer <LIVRAISON_TOKEN>
 *
 * Renvoie les commandes console à exécuter, les plus anciennes d'abord.
 *
 * Cette route n'est PAS protégée par exigerAdmin() : l'appelant est un bot,
 * pas un navigateur avec une session. Son authentification est le jeton
 * partagé, comparé à temps constant (cf. src/lib/jeton.ts).
 *
 * Les lignes restent EN_ATTENTE jusqu'à confirmation : si le bot meurt en
 * cours de route, elles repartiront dans la file au prochain appel. La
 * livraison est donc « au moins une fois », et les commandes console doivent
 * supporter d'être rejouées.
 */

export const dynamic = 'force-dynamic'

/** Taille d'un lot. Au-delà, le bot rappellera. */
const TAILLE_LOT = 20

/**
 * Au-delà de ce nombre d'échecs, la ligne sort de la file et attend une
 * relance manuelle depuis l'admin. Sans ce plafond, une commande console
 * erronée serait resservie indéfiniment.
 */
const TENTATIVES_MAX = 5

export async function GET(requete: Request) {
  const refus = refuserSiJetonInvalide(requete)
  if (refus) {
    return Response.json({ erreur: refus }, { status: 401 })
  }

  const lignes = await prisma.ligneLivraison.findMany({
    where: { statut: 'EN_ATTENTE', tentatives: { lt: TENTATIVES_MAX } },
    orderBy: { createdAt: 'asc' },
    take: TAILLE_LOT,
    select: {
      id: true,
      commande: true,
      type: true,
      tentatives: true,
      commandeClient: { select: { numero: true, pseudoMinecraft: true } },
    },
  })

  return Response.json(
    {
      lignes: lignes.map((ligne) => ({
        id: ligne.id,
        commande: ligne.commande,
        type: ligne.type,
        tentatives: ligne.tentatives,
        pseudo: ligne.commandeClient.pseudoMinecraft,
        numeroCommande: ligne.commandeClient.numero,
      })),
    },
    { status: 200 },
  )
}
