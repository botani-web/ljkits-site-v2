/**
 * Point d'entrée HTTP de NextAuth (connexion, déconnexion, lecture de session).
 * Ce fichier ne contient rien d'autre : toute la configuration est dans
 * src/lib/auth.ts.
 */
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
