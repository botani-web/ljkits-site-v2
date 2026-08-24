import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Tout ce qui touche à Tebex : création du panier via l'API Headless, et
 * vérification de la signature des webhooks.
 *
 * Aucune dépendance : `fetch` natif et `node:crypto` suffisent.
 */

const BASE_HEADLESS = 'https://headless.tebex.io/api'

/**
 * Erreur métier : `message` est destiné à l'affichage et à l'admin,
 * `contexte` aux seuls logs (il contient le corps brut de la réponse).
 *
 * `corrigeableParLeJoueur` distingue les deux familles d'échec :
 *  - false (défaut) : panne côté prestataire ou configuration manquante. Le
 *    visiteur voit un message générique, le détail reste dans les logs.
 *  - true : le joueur peut y remédier seul (pseudo inexistant, par exemple).
 *    Le message est alors affiché tel quel — lui cacher la raison le laisserait
 *    réessayer indéfiniment.
 */
export class ErreurTebex extends Error {
  readonly contexte: string | null
  readonly corrigeableParLeJoueur: boolean

  constructor(
    message: string,
    contexte: string | null = null,
    corrigeableParLeJoueur = false,
  ) {
    super(message)
    this.name = 'ErreurTebex'
    this.contexte = contexte
    this.corrigeableParLeJoueur = corrigeableParLeJoueur
  }
}

function jetonPublic(): string {
  const jeton = process.env.TEBEX_PUBLIC_TOKEN
  if (!jeton || jeton.trim() === '') {
    throw new ErreurTebex('TEBEX_PUBLIC_TOKEN n’est pas configuré.')
  }
  return jeton.trim()
}

/**
 * Les deux familles de routes de l'API Headless. C'est LE piège de cette API :
 *
 *   'compte' → /api/accounts/{token}/…   créer un panier, le relire
 *   'panier' → /api/baskets/{ident}/…    y ajouter un package
 *
 * La seconde n'a PAS le segment `accounts/{token}`. Le lui ajouter renvoie un
 * 404 « The route … could not be found », pas une erreur d'authentification :
 * si tu vois passer un 404 ici, c'est presque toujours une portée erronée.
 */
type PorteeTebex = 'compte' | 'panier'

/** Appel HTTP vers l'API Headless, avec une erreur exploitable en cas d'échec. */
async function appeler<T>(
  portee: PorteeTebex,
  chemin: string,
  options: { methode: 'GET' | 'POST'; corps?: unknown },
): Promise<T> {
  const prefixe = portee === 'compte' ? `/accounts/${jetonPublic()}` : ''
  const url = `${BASE_HEADLESS}${prefixe}${chemin}`

  // Ce qui part dans les messages et les logs : le jeton n'y figure jamais,
  // mais la route exacte oui — sans elle, un échec est indébogable.
  const route = `${options.methode} ${portee === 'compte' ? '/accounts/{token}' : ''}${chemin}`

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
    const cause = erreur instanceof Error ? erreur.message : 'erreur réseau'
    throw new ErreurTebex(`Tebex est injoignable sur ${route} (${cause}).`, `${route}\n${cause}`)
  }

  const texte = await reponse.text()

  if (!reponse.ok) {
    // Tebex renvoie en général { "title": …, "detail": … } ou { "message": … }.
    // ⚠ Prendre le premier champ NON VIDE, pas le premier défini : Tebex
    // renvoie souvent detail:"" en mettant le motif réel dans title. Un `??`
    // retiendrait la chaîne vide et le message n'expliquerait plus rien.
    let detail = texte.slice(0, 300)
    try {
      const json = JSON.parse(texte)
      detail =
        [json.detail, json.message, json.title].find(
          (champ: unknown) => typeof champ === 'string' && champ.trim() !== '',
        ) ?? detail
    } catch {
      // Réponse non-JSON : on garde le texte brut tronqué.
    }
    throw new ErreurTebex(
      `Tebex a refusé ${route} (HTTP ${reponse.status}) : ${detail}`,
      `${route}\nHTTP ${reponse.status}\ncorps de la réponse : ${texte.slice(0, 1000)}`,
    )
  }

  try {
    return JSON.parse(texte) as T
  } catch {
    throw new ErreurTebex(
      `Réponse illisible de Tebex sur ${route}.`,
      `${route}\nHTTP ${reponse.status}\ncorps de la réponse : ${texte.slice(0, 1000)}`,
    )
  }
}

/* -------------------------------------------------------------------------- */
/* Création d'un panier                                                       */
/* -------------------------------------------------------------------------- */

type ReponsePanier = {
  data?: {
    ident?: string
    /**
     * ⚠ Tant que le panier est VIDE, Tebex renvoie `links: []` — un tableau,
     * pas un objet. Le lien de paiement n'apparaît qu'une fois au moins un
     * package ajouté. D'où le type large et le lecteur défensif ci-dessous.
     */
    links?: { checkout?: string } | unknown[]
  }
}

export type PanierTebex = {
  ident: string
  urlCheckout: string
}

/** Extrait le lien de paiement, en tolérant le `links: []` du panier vide. */
function lienDeCheckout(donnees: ReponsePanier['data']): string | null {
  const liens = donnees?.links
  if (!liens || Array.isArray(liens)) return null
  return typeof liens.checkout === 'string' && liens.checkout !== '' ? liens.checkout : null
}

/**
 * Crée un panier chez Tebex et y ajoute les packages.
 *
 * `username` est obligatoire pour les boutiques Minecraft.
 *
 * ⚠ NE PAS envoyer `ip_address` : ce champ n'est accepté que sur une requête
 * authentifiée en Basic auth avec la clé PRIVÉE. Avec le seul jeton public,
 * Tebex répond « HTTP 422 : Basic auth credentials are required » — un message
 * qui parle d'authentification alors que le problème est un champ de trop.
 * On s'en passe sans rien perdre : le joueur est redirigé vers pay.tebex.io,
 * où Tebex voit sa véritable IP.
 *
 * `custom` revient tel quel dans le webhook de paiement : c'est par lui qu'on
 * retrouve la commande. On y met l'id de la commande.
 */
export async function creerPanierTebex(parametres: {
  pseudoMinecraft: string
  packageIds: number[]
  commandeId: string
  urlRetour: string
  urlAnnulation: string
}): Promise<PanierTebex> {
  if (parametres.packageIds.length === 0) {
    throw new ErreurTebex('Panier vide : aucun package à envoyer à Tebex.')
  }

  /**
   * Tebex vérifie le pseudo auprès de Mojang et répond 404 « Invalid Username
   * provided » s'il n'existe pas. C'est une faute de frappe du joueur, pas une
   * panne : on le lui dit, plutôt que de lui servir « paiement indisponible,
   * réessaie plus tard » qu'il pourrait réessayer cent fois.
   */
  const creerPanier = async (options: { methode: 'POST'; corps: unknown }) => {
    try {
      return await appeler<ReponsePanier>('compte', '/baskets', options)
    } catch (erreur) {
      if (erreur instanceof ErreurTebex && /invalid username/i.test(erreur.message)) {
        throw new ErreurTebex(
          `Le compte Minecraft « ${parametres.pseudoMinecraft} » est introuvable. Vérifie l'orthographe de ton pseudo.`,
          erreur.contexte,
          true,
        )
      }
      throw erreur
    }
  }

  const panier = await creerPanier({
    methode: 'POST',
    corps: {
      username: parametres.pseudoMinecraft,
      complete_url: parametres.urlRetour,
      cancel_url: parametres.urlAnnulation,
      // ⚠ FAUX volontairement. Le paiement s'affiche dans une modale Tebex.js
      // posée sur ljkits.eu : si Tebex redirigeait tout seul vers complete_url,
      // c'est l'IFRAME qui naviguerait, et le site s'afficherait imbriqué dans
      // lui-même. La fin de paiement est donc gérée côté client, sur
      // l'évènement payment:complete (cf. PaiementTebex.tsx).
      // complete_url reste renseigné : il sert au repli plein écran.
      complete_auto_redirect: false,
      custom: { commandeId: parametres.commandeId },
    },
  })

  const ident = panier.data?.ident
  if (!ident) {
    throw new ErreurTebex('Tebex n’a pas renvoyé d’identifiant de panier.')
  }

  // Les packages sont ajoutés un par un : l'API Headless n'accepte pas de lot.
  // Portée 'panier' : cette route n'a pas le segment accounts/{token}.
  for (const packageId of parametres.packageIds) {
    await appeler('panier', `/baskets/${encodeURIComponent(ident)}/packages`, {
      methode: 'POST',
      corps: { package_id: packageId, quantity: 1 },
    })
  }

  // Le lien de paiement se lit APRÈS remplissage, jamais à la création : sur un
  // panier vide il n'existe pas encore.
  const rempli = await appeler<ReponsePanier>(
    'compte',
    `/baskets/${encodeURIComponent(ident)}`,
    { methode: 'GET' },
  )
  const urlCheckout = lienDeCheckout(rempli.data)

  if (!urlCheckout) {
    throw new ErreurTebex(
      `Tebex n’a pas renvoyé de lien de paiement pour le panier ${ident}.`,
      `panier ${ident} rempli avec ${parametres.packageIds.length} package(s), links absent`,
    )
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

/**
 * `validation.webhook` n'apparaît PAS dans la liste des types à cocher côté
 * Tebex, et c'est normal : on ne s'y abonne pas. Tebex l'envoie de lui-même,
 * une fois, au moment où l'endpoint est enregistré, pour vérifier que l'URL
 * répond. Il attend un 200 contenant exactement l'id reçu.
 */
export const TYPE_VALIDATION = 'validation.webhook'
export const TYPE_PAIEMENT_COMPLETE = 'payment.completed'
export const TYPE_PAIEMENT_REFUSE = 'payment.declined'
export const TYPE_PAIEMENT_REMBOURSE = 'payment.refunded'
export const TYPE_LITIGE_OUVERT = 'payment.dispute.opened'
export const TYPE_LITIGE_PERDU = 'payment.dispute.lost'
export const TYPE_LITIGE_GAGNE = 'payment.dispute.won'

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
