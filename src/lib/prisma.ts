import { PrismaClient } from '@prisma/client'

/**
 * Client Prisma partagé.
 *
 * En développement, Next.js recharge les modules à chaque modification.
 * Sans ce cache sur globalThis, chaque rechargement ouvrirait un nouveau
 * pool de connexions et Neon finirait par les refuser.
 */
const globalPourPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalPourPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalPourPrisma.prisma = prisma
