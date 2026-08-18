import { auth } from '@/lib/auth'

/**
 * Garde de sécurité des Server Actions.
 *
 * IMPORTANT : une Server Action est une route HTTP à part entière. Le fait
 * que le formulaire qui l'appelle soit rendu sous /admin ne protège RIEN —
 * n'importe qui peut rejouer la requête. Chaque action de mutation doit
 * donc appeler exigerAdmin() sur sa PREMIÈRE ligne, sans exception.
 *
 * En cas d'échec on lève une erreur : l'action s'arrête net, rien n'est
 * écrit, et Next.js renvoie une erreur 500 générique au client (l'appelant
 * n'apprend rien sur la raison du refus).
 */
export async function exigerAdmin() {
  const session = await auth()

  if (!session?.user) {
    throw new Error('Accès refusé : cette action est réservée à l’administrateur.')
  }

  return session
}
