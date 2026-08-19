'use server'

import { revalidatePath } from 'next/cache'

import { exigerAdmin } from '@/actions/garde'
import { lignesAExecuter } from '@/lib/livraison'
import { prisma } from '@/lib/prisma'

/**
 * Remet une ligne échouée dans la file.
 *
 * Le compteur de tentatives repart à zéro : c'est ce qui la fait ressortir
 * dans /api/livraison/file, qui ignore les lignes ayant atteint le plafond.
 * À utiliser après avoir corrigé la cause — une commande console erronée
 * relancée telle quelle échouera à nouveau.
 */
export async function relancerLigneLivraison(id: string) {
  await exigerAdmin()

  const ligne = await prisma.ligneLivraison.findUnique({ where: { id } })
  if (!ligne) return

  await prisma.ligneLivraison.update({
    where: { id },
    data: {
      statut: 'EN_ATTENTE',
      tentatives: 0,
      derniereErreur: null,
      executeeAt: null,
    },
  })

  revalidatePath('/admin/commandes')
  revalidatePath(`/admin/commandes/${ligne.commandeId}`)
}

/**
 * Reconstruit la file de livraison d'une commande à partir de ses lignes.
 *
 * Sert quand les commandes console d'un article ont été corrigées après coup :
 * on repart des instantanés de la commande, on efface les lignes en attente ou
 * échouées, et on en régénère de neuves. Les lignes DÉJÀ EXÉCUTÉES ne sont pas
 * touchées — il ne faut pas rejouer ce qui a abouti.
 */
export async function regenererLignesLivraison(commandeId: string) {
  await exigerAdmin()

  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { lignes: true, lignesLivraison: true },
  })
  if (!commande) return

  // Le sens dépend d'où en est la commande : une commande remboursée doit
  // rejouer des retraits, pas des livraisons.
  const sens =
    commande.statut === 'REMBOURSEE' || commande.statut === 'LITIGE' ? 'RETRAIT' : 'LIVRAISON'

  const commandes = lignesAExecuter(commande.lignes, commande.pseudoMinecraft, sens)

  await prisma.$transaction([
    prisma.ligneLivraison.deleteMany({
      where: { commandeId, statut: { in: ['EN_ATTENTE', 'ECHOUEE'] } },
    }),
    prisma.ligneLivraison.createMany({
      data: commandes.map((texte) => ({ commandeId, type: sens, commande: texte })),
    }),
  ])

  revalidatePath('/admin/commandes')
  revalidatePath(`/admin/commandes/${commandeId}`)
}
