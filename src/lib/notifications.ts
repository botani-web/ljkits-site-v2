/**
 * Les notifications d'administration.
 *
 * Un seul point d'entrée, appelé depuis deux endroits : la Server Action qui
 * crée la commande, et le webhook Tebex qui confirme le paiement.
 *
 * L'envoi est ATTENDU plutôt que lancé en arrière-plan. Sur une fonction
 * serverless, une promesse non attendue peut être tuée à la fin de la requête
 * et l'e-mail ne partirait jamais — au prix de quelques centaines de
 * millisecondes, on préfère la certitude. Et comme `envoyerAAdmin` avale ses
 * propres erreurs, cette attente ne peut jamais faire échouer l'appelant.
 */
import { envoyerAAdmin } from '@/lib/email'
import { courrielDeCommande } from '@/lib/email-commande'
import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/site'

/**
 * Prévient l'admin au sujet d'une commande.
 *
 * `nouvelle` vaut true à la création (panier validé, pas encore payé) et
 * false à la confirmation du paiement.
 */
export async function notifierCommande(commandeId: string, nouvelle: boolean): Promise<void> {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      select: {
        id: true,
        numero: true,
        pseudoMinecraft: true,
        montantTotalCentimes: true,
        statut: true,
        createdAt: true,
        transactionTebex: true,
        lignes: {
          select: { libelle: true, type: true, prixCentimes: true },
          orderBy: { libelle: 'asc' },
        },
      },
    })

    if (!commande) {
      console.warn(`[email] commande ${commandeId} introuvable, notification abandonnée.`)
      return
    }

    await envoyerAAdmin(courrielDeCommande(commande, nouvelle, SITE.url))
  } catch (erreur) {
    // Filet de sécurité : même une lecture en base qui échoue ne doit pas
    // remonter jusqu'au paiement du joueur.
    console.error('[email] notification impossible :', erreur)
  }
}
