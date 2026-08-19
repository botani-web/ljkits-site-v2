import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Comparaison de secrets à temps constant.
 *
 * Une comparaison ordinaire (`a === b`) s'arrête au premier caractère qui
 * diffère : le temps de réponse renseigne alors sur le nombre de caractères
 * corrects, et un attaquant peut reconstituer le secret octet par octet.
 *
 * `timingSafeEqual` exige deux tampons de MÊME longueur — sinon il lève une
 * exception, ce qui rendrait la longueur du secret observable. On compare donc
 * les empreintes SHA-256, toujours longues de 32 octets quelle que soit
 * l'entrée.
 */
export function secretsIdentiques(recu: string, attendu: string): boolean {
  const a = createHash('sha256').update(recu, 'utf8').digest()
  const b = createHash('sha256').update(attendu, 'utf8').digest()
  return timingSafeEqual(a, b)
}

/**
 * Extrait le jeton d'un en-tête `Authorization: Bearer <jeton>`.
 * Accepte aussi l'en-tête sans préfixe, par tolérance.
 */
export function lireJetonPorteur(enTete: string | null): string | null {
  if (!enTete) return null
  const valeur = enTete.trim()
  if (valeur === '') return null
  return valeur.toLowerCase().startsWith('bearer ') ? valeur.slice(7).trim() : valeur
}

/**
 * Vérifie le jeton d'appel des routes de livraison.
 *
 * Ces routes ne sont PAS protégées par exigerAdmin() : c'est un bot qui les
 * appelle, pas un navigateur avec une session. Le jeton partagé est leur seule
 * authentification, d'où la comparaison à temps constant.
 *
 * Renvoie un message d'erreur, ou null si l'appel est autorisé.
 */
export function refuserSiJetonInvalide(requete: Request): string | null {
  const attendu = process.env.LIVRAISON_TOKEN

  // Sans jeton configuré, on refuse TOUT : mieux vaut une livraison à l'arrêt
  // qu'une route de livraison ouverte à tous.
  if (!attendu || attendu.trim() === '') {
    return 'LIVRAISON_TOKEN n’est pas configuré côté serveur.'
  }

  const recu = lireJetonPorteur(requete.headers.get('authorization'))
  if (!recu) return 'Jeton manquant.'
  if (!secretsIdentiques(recu, attendu)) return 'Jeton invalide.'

  return null
}
