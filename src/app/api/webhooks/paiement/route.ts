/**
 * EMPLACEMENT RÉSERVÉ — webhook du prestataire de paiement (phase 3).
 *
 * Cette route existe pour que l'URL soit stable et connue d'avance :
 *   https://ljkits.eu/api/webhooks/paiement
 *
 * Elle ne fait RIEN pour l'instant et répond 501. Tant que la phase 3 n'est
 * pas faite, les commandes sont traitées à la main depuis /admin/commandes.
 *
 * ---------------------------------------------------------------------------
 * CE QU'ELLE DEVRA FAIRE
 * ---------------------------------------------------------------------------
 *
 * 1. VÉRIFIER LA SIGNATURE, avant toute autre chose.
 *    Tebex signe ses webhooks (en-tête `X-Signature`) : HMAC-SHA256 du corps
 *    brut avec le secret du webhook. Il faut donc lire `await request.text()`
 *    et NON `request.json()`, puis comparer en temps constant
 *    (`crypto.timingSafeEqual`). Une requête non signée est rejetée en 401 —
 *    sans ça, n'importe qui pourrait déclarer ses commandes payées.
 *
 * 2. RÉPONDRE VITE.
 *    Les prestataires réessaient si la réponse tarde. Valider, écrire le
 *    statut, répondre 200. La livraison RCON ne doit pas bloquer la réponse.
 *
 * 3. ÊTRE IDEMPOTENT.
 *    Un même webhook peut arriver plusieurs fois. `Commande.referenceExterne`
 *    est UNIQUE en base : écrire l'id de transaction du prestataire dessus
 *    fait échouer proprement le deuxième traitement du même paiement.
 *
 * 4. FAIRE AVANCER LA COMMANDE.
 *    Retrouver la commande (son id sera passé au prestataire à la création du
 *    panier), passer `statut` à PAYEE et poser `payeeAt`.
 *
 * 5. DÉCLENCHER LA LIVRAISON.
 *    `commandesAPlat(commande.lignes, commande.pseudoMinecraft)` — déjà écrit
 *    dans src/lib/livraison.ts et déjà utilisé par l'admin — donne la liste
 *    exacte des commandes console à exécuter. Il restera à ouvrir une
 *    connexion RCON vers le serveur Minecraft 1.8.8, les envoyer, puis passer
 *    la commande en LIVREE avec `livreeAt`.
 *
 *    ⚠ RCON est un protocole TCP : il ne fonctionne PAS depuis le runtime
 *    Edge, et mal depuis une fonction serverless (connexion sortante vers un
 *    port arbitraire, IP de sortie non fixe). Deux pistes à trancher le
 *    moment venu :
 *      - un petit service qui tourne à côté du serveur Minecraft et interroge
 *        une route de ce site pour récupérer les commandes à exécuter ;
 *      - ou un plugin côté serveur qui fait la même chose.
 *    C'est la piste la plus sûre : le port RCON n'a alors jamais besoin
 *    d'être exposé sur Internet.
 *
 * 6. EN CAS D'ÉCHEC DE PAIEMENT : statut ECHOUEE, rien à livrer.
 */

export async function POST() {
  return Response.json(
    { erreur: 'Webhook de paiement pas encore implémenté.' },
    { status: 501 },
  )
}

/** Utile pour vérifier depuis un navigateur que la route est bien déployée. */
export async function GET() {
  return Response.json(
    { statut: 'emplacement réservé', phase: 'non implémenté' },
    { status: 501 },
  )
}
