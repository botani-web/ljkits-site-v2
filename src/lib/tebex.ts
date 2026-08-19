import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Tout ce qui touche à Tebex : création du panier via l'API Headless, et
 * vérification de la signature des webhooks.
 *
 * Aucune dépendance : `fetch` natif et `node:crypto` suffisent.
 */

const BASE_HEADLESS = 'https://headless.tebex.io/api/accounts'

/** Erreur métier : le message est destiné à être affiché, pas une trace. */
export class ErreurTebex extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ErreurTebex'
  }
}

function jetonPublic(): string {
  const jeton = process.env.TEBEX_PUBLIC_TOKEN
  if (!jeton || jeton.trim() === '') {
    throw new ErreurTebex('TEBEX_PUBLIC_TOKEN n’est pas configuré.')
  }
  return jeton.trim()
}

/** Appel HTTP vers l'API Headless, avec un message d'erreur exploitable. */
async function appeler<T>(
  chemin: string,
  options: { methode: 'GET' | 'POST'; corps?: unknown },
): Promise<T> {
  const url = `${BASE_HEADLESS}/${jetonPublic()}${chemin}`

  let reponse: Response
  try {
    reponse = await fetch(url, {
      method: options.methode,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: options.corps === undefined ? undefined : JSON.stringify(options.corps),
      // Un paiement ne doit jamais être servi depuis un cache.
      cache: 'no-store',
    })
  } catch (erreur) {
    throw new ErreurTebex(
      `Tebex est injoignable (${erreur instanceof Error ? erreur.message : 'erreur réseau'}).`,
    )
  }

  const texte = await reponse.text()

  if (!reponse.ok) {
    // Tebex renvoie en général { "title": …, "detail": … } ou { "message": … }.
    let detail = texte.slice(0, 300)
    try {
      const json = JSON.parse(texte)
      detail = json.detail ?? json.message ?? json.title ?? detail
    } catch {
      // Réponse non-JSON : on garde le texte brut tronqué.
    }
    throw new ErreurTebex(`Tebex a refusé la requête (HTTP ${reponse.status}) : ${detail}`)
  }

  try {
    return JSON.parse(texte) as T
  } catch {
    throw new ErreurTebex('Réponse illisible de Tebex.')
  }
}

/* -------------------------------------------------------------------------- */
/* Création d'un panier                                                       */
/* -------------------------------------------------------------------------- */

type ReponsePanier = {
  data?: {
    ident?: string
    links?: { checkout?: string }
  }
}

export type PanierTebex = {
  ident: string
  urlCheckout: string
}

/**
 * Crée un panier chez Tebex et y ajoute les packages.
 *
 * `username` est obligatoire pour les boutiques Minecraft, `ip_address` pour
 * les intégrations appelées depuis un serveur — c'est notre cas, l'appel part
 * d'une Server Action et non du navigateur du joueur.
 *
 * `custom` revient tel quel dans le webhook de paiement : c'est par lui qu'on
 * retrouve la commande. On y met l'id de la commande.
 */
export async function creerPanierTebex(parametres: {
  pseudoMinecraft: string
  packageIds: number[]
  commandeId: string
  ipClient: string
  urlRetour: string
  urlAnnulation: string
}): Promise<PanierTebex> {
  const panier = await appeler<ReponsePanier>('/baskets', {
    methode: 'POST',
    corps: {
      username: parametres.pseudoMinecraft,
      ip_address: parametres.ipClient,
      complete_url: parametres.urlRetour,
      cancel_url: parametres.urlAnnulation,
      complete_auto_redirect: true,
      custom: { commandeId: parametres.commandeId },
    },
  })

  const ident = panier.data?.ident
  const urlCheckout = panier.data?.links?.checkout

  if (!ident || !urlCheckout) {
    throw new ErreurTebex('Tebex n’a pas renvoyé d’identifiant de panier exploitable.')
  }

  // Les packages sont ajoutés un par un : l'API Headless n'accepte pas de lot.
  for (const packageId of parametres.packageIds) {
    await appeler(`/baskets/${encodeURIComponent(ident)}/packages`, {
      methode: 'POST',
      corps: { package_id: packageId, quantity: 1 },
    })
  }

  return { ident, urlCheckout }
}

/* -------------------------------------------------------------------------- */
/* Webhooks                                                                   */
/* -------------------------------------------------------------------------- */

/** Enveloppe commune à tous les webhooks Tebex. */
export type WebhookTebex = {
  id: string
  type: string
  date?: string
  subject?: Record<string, unknown>
}

export const TYPE_VALIDATION = 'validation.webhook'
export const TYPE_PAIEMENT_COMPLETE = 'payment.completed'
export const TYPE_PAIEMENT_REMBOURSE = 'payment.refunded'
export const TYPE_LITIGE_OUVERT = 'payment.dispute.opened'
export const TYPE_LITIGE_PERDU = 'payment.dispute.lost'

/**
 * Vérifie la signature d'un webhook Tebex.
 *
 * Algorithme, tel que documenté par Tebex :
 *
 *   signature = HMAC_SHA256( clé = secret, message = SHA256_hex(corps brut) )
 *
 * Deux pièges :
 *
 *  1. Le message du HMAC est la représentation HEXADÉCIMALE du condensat du
 *     corps, pas ses octets bruts. L'exemple PHP de Tebex est
 *     `hash_hmac('sha256', hash('sha256', $json), $secret)`, et `hash()`
 *     renvoie une chaîne hexadécimale.
 *  2. Il faut le corps BRUT, exactement tel qu'il est arrivé. Passer par
 *     `request.json()` puis re-sérialiser change les octets (espaces, ordre)
 *     et fait échouer la vérification.
 */
export function signatureWebhookValide(corpsBrut: string, signatureRecue: string): boolean {
  const secret = process.env.TEBEX_WEBHOOK_SECRET
  if (!secret || secret.trim() === '') return false
  if (!signatureRecue) return false

  const condensatDuCorps = createHash('sha256').update(corpsBrut, 'utf8').digest('hex')
  const attendue = createHmac('sha256', secret.trim())
    .update(condensatDuCorps, 'utf8')
    .digest('hex')

  // Comparaison à temps constant sur des tampons de longueur garantie égale.
  const a = createHash('sha256').update(attendue, 'utf8').digest()
  const b = createHash('sha256').update(signatureRecue.trim(), 'utf8').digest()
  return timingSafeEqual(a, b)
}

/* -------------------------------------------------------------------------- */
/* Lecture défensive du contenu d'un évènement                                */
/* -------------------------------------------------------------------------- */

/**
 * Retrouve l'id de commande dans le `subject` d'un évènement.
 *
 * On l'a placé dans `custom.commandeId` à la création du panier, et Tebex le
 * renvoie tel quel. Les autres chemins sont des filets de sécurité : la forme
 * exacte du `subject` n'est pas figée dans la documentation, et une commande
 * introuvable signifierait un paiement encaissé sans livraison.
 */
export function extraireCommandeId(sujet: Record<string, unknown> | undefined): string | null {
  if (!sujet) return null

  const candidats: unknown[] = [
    (sujet.custom as Record<string, unknown> | undefined)?.commandeId,
    ((sujet.basket as Record<string, unknown> | undefined)?.custom as
      | Record<string, unknown>
      | undefined)?.commandeId,
    ((sujet.payment as Record<string, unknown> | undefined)?.custom as
      | Record<string, unknown>
      | undefined)?.commandeId,
  ]

  for (const candidat of candidats) {
    if (typeof candidat === 'string' && candidat.trim() !== '') return candidat.trim()
  }
  return null
}

/** Retrouve l'ident du panier, deuxième voie pour identifier la commande. */
export function extraireIdentPanier(
  sujet: Record<string, unknown> | undefined,
): string | null {
  if (!sujet) return null

  const candidats: unknown[] = [
    sujet.basket_ident,
    (sujet.basket as Record<string, unknown> | undefined)?.ident,
  ]

  for (const candidat of candidats) {
    if (typeof candidat === 'string' && candidat.trim() !== '') return candidat.trim()
  }
  return null
}

/** Retrouve l'identifiant de transaction ("tbx-…"). */
export function extraireTransaction(
  sujet: Record<string, unknown> | undefined,
): string | null {
  if (!sujet) return null

  const candidats: unknown[] = [sujet.transaction_id, sujet.id]

  for (const candidat of candidats) {
    if (typeof candidat === 'string' && candidat.trim() !== '') return candidat.trim()
  }
  return null
}
