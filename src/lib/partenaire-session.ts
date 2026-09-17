import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

/**
 * LA SESSION D'UN PARTENAIRE.
 *
 * Volontairement a cote de NextAuth, pas dedans : NextAuth tient LE compte
 * admin, avec ses droits d'ecriture sur tout le site. Un streameur qui vient
 * lire ses chiffres n'a rien a faire dans ce systeme-la, et une erreur de
 * configuration ne doit jamais pouvoir le faire passer pour un admin.
 *
 * Le cookie ne contient AUCUN secret : le slug, une date d'expiration, et une
 * signature HMAC-SHA256 des deux. Il n'y a donc pas de table de sessions a
 * tenir — et un cookie recopie a la main ne vaut rien sans le secret.
 *
 * LIMITE ASSUMEE : un seul cookie, donc une seule session partenaire a la
 * fois par navigateur. Se connecter a un second espace deconnecte du premier.
 * Deux partenaires ne partagent pas un navigateur ; le jour ou ca arrive, il
 * suffira de suffixer le nom du cookie par le slug.
 */

const NOM_COOKIE = 'ljk_partenaire'

/** Une semaine : assez pour ne pas ressaisir le mot de passe a chaque live. */
const DUREE_MS = 7 * 24 * 60 * 60 * 1_000

/**
 * Le secret de signature.
 *
 * `PARTENAIRE_SECRET` s'il existe, sinon `AUTH_SECRET` — deja present en
 * local comme sur Vercel. Le declarer a part permet de faire tourner le
 * secret des partenaires sans deconnecter l'admin, et l'inverse.
 * Changer l'un ou l'autre invalide les sessions en cours : chacun se
 * reconnecte avec son mot de passe, rien n'est perdu.
 */
function secret(): string {
  const valeur = process.env.PARTENAIRE_SECRET ?? process.env.AUTH_SECRET
  if (!valeur) {
    throw new Error(
      'PARTENAIRE_SECRET (ou a defaut AUTH_SECRET) est manquant : impossible de signer la session partenaire.',
    )
  }
  return valeur
}

function signer(charge: string): string {
  return createHmac('sha256', secret()).update(charge).digest('base64url')
}

/** Comparaison a temps constant : une comparaison naive fuit la signature. */
function signatureValide(charge: string, signature: string): boolean {
  const attendue = Buffer.from(signer(charge))
  const recue = Buffer.from(signature)
  return attendue.length === recue.length && timingSafeEqual(attendue, recue)
}

/** Ouvre la session. A n'appeler QUE depuis une Server Action. */
export async function ouvrirSessionPartenaire(slug: string): Promise<void> {
  const expiration = Date.now() + DUREE_MS
  const charge = `${slug}.${expiration}`

  const boite = await cookies()
  boite.set(NOM_COOKIE, `${charge}.${signer(charge)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(DUREE_MS / 1_000),
  })
}

export async function fermerSessionPartenaire(): Promise<void> {
  const boite = await cookies()
  boite.delete(NOM_COOKIE)
}

/** Ce navigateur est-il connecte a CET espace partenaire ? */
export async function sessionOuvertePour(slug: string): Promise<boolean> {
  const cookie = (await cookies()).get(NOM_COOKIE)?.value
  if (!cookie) return false

  // Le slug peut contenir des points ? Non (voir validations), mais on decoupe
  // par la fin pour que la signature reste lisible quoi qu'il arrive.
  const morceaux = cookie.split('.')
  if (morceaux.length !== 3) return false

  const [slugSigne, expiration, signature] = morceaux
  if (!signatureValide(`${slugSigne}.${expiration}`, signature)) return false

  const fin = Number(expiration)
  if (!Number.isFinite(fin) || fin < Date.now()) return false

  return slugSigne === slug
}
