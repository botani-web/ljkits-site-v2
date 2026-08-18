'use server'

import { AuthError } from 'next-auth'

import { exigerAdmin } from '@/actions/garde'
import type { EtatFormulaire } from '@/actions/etat'
import { signIn, signOut } from '@/lib/auth'
import { schemaConnexion } from '@/lib/validations'

/**
 * Connexion à l'administration.
 *
 * SEULE action du projet qui n'appelle pas exigerAdmin(), et pour cause :
 * c'est elle qui crée la session. Sa protection, c'est la vérification du
 * mot de passe faite par le provider Credentials (cf. src/lib/auth.ts).
 */
export async function connecter(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const resultat = schemaConnexion.safeParse({
    email: String(formData.get('email') ?? ''),
    motDePasse: String(formData.get('motDePasse') ?? ''),
  })

  if (!resultat.success) {
    return { champs: resultat.error.flatten().fieldErrors }
  }

  try {
    await signIn('credentials', {
      ...resultat.data,
      redirectTo: '/admin/kits',
    })
  } catch (erreur) {
    // signIn() signale la réussite en levant une redirection Next.js :
    // il faut impérativement la laisser remonter.
    if (erreur instanceof AuthError) {
      // Message volontairement vague : ne pas révéler si l'e-mail existe.
      return { erreur: 'E-mail ou mot de passe incorrect.' }
    }
    throw erreur
  }

  return {}
}

/** Déconnexion. */
export async function deconnecter() {
  await exigerAdmin()
  await signOut({ redirectTo: '/connexion' })
}
