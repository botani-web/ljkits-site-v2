import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'

import { prisma } from '@/lib/prisma'
import { schemaConnexion } from '@/lib/validations'

/**
 * Authentification de l'unique compte admin.
 *
 * Stratégie JWT : la session vit dans un cookie signé, il n'y a pas de table
 * de sessions en base. Un seul provider, Credentials, qui vérifie l'e-mail et
 * le mot de passe contre la table Admin.
 *
 * `auth()` est réutilisé partout ailleurs :
 *   - dans le layout /admin, pour rediriger un visiteur non connecté,
 *   - dans exigerAdmin(), appelé en tête de CHAQUE Server Action.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },

  // Le formulaire de connexion est une page à moi, pas celle de NextAuth.
  pages: { signIn: '/connexion' },

  // Le site tourne derrière un seul nom de domaine, en local comme sur Vercel.
  trustHost: true,

  providers: [
    Credentials({
      // Déclaration des champs attendus : NextAuth ne transmet que ceux-là.
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        motDePasse: { label: 'Mot de passe', type: 'password' },
      },

      async authorize(identifiants) {
        // Toujours revalider côté serveur, quoi qu'ait envoyé le navigateur.
        const resultat = schemaConnexion.safeParse(identifiants)
        if (!resultat.success) return null

        const { email, motDePasse } = resultat.data

        const admin = await prisma.admin.findUnique({ where: { email } })
        if (!admin) return null

        const motDePasseValide = await compare(motDePasse, admin.motDePasseHash)
        if (!motDePasseValide) return null

        // Ce qui est renvoyé ici alimente le jeton JWT (callback ci-dessous).
        return { id: admin.id, email: admin.email }
      },
    }),
  ],

  callbacks: {
    // À la connexion, on recopie l'id de l'admin dans le jeton…
    jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
    // …puis du jeton vers la session lue par auth().
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },
})
