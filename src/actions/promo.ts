'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import type { EtatFormulaire } from '@/actions/etat'
import { exigerAdmin } from '@/actions/garde'
import { prisma } from '@/lib/prisma'
import { REGLAGES_PAR_DEFAUT } from '@/lib/reglages'

/**
 * Enregistre la promo de la boutique (16/10/2026).
 *
 * ⚠ AFFICHAGE SEULEMENT : ce qui est payé reste le prix de Tebex. La même
 * réduction doit être créée dans le panel Tebex (une « sale »), sinon le joueur
 * verrait -20 % sur le site et paierait plein tarif.
 */
const schemaPromo = z.object({
  promoActive: z.boolean(),
  promoPourcentage: z.coerce.number().int('Un nombre entier.').min(0).max(90, '90 % au maximum.'),
  promoRayon: z.enum(['grades', 'coins', 'tout']),
  promoFin: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === '') return null
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) {
        ctx.addIssue({ code: 'custom', message: 'Date illisible.' })
        return z.NEVER
      }
      return d
    }),
  promoBulle: z.string().trim().max(12, '12 caractères au maximum (ex. -20%).'),
  promoTexte: z.string().trim().max(160, '160 caractères au maximum.'),
  promoTexteEn: z.string().trim().max(160, '160 caractères au maximum.'),
})

export async function enregistrerPromo(_etatPrecedent: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = schemaPromo.safeParse({
    promoActive: formData.get('promoActive') === 'on',
    promoPourcentage: String(formData.get('promoPourcentage') ?? '0'),
    promoRayon: String(formData.get('promoRayon') ?? 'grades'),
    // Le formulaire envoie la fin déjà convertie en ISO par le navigateur (heure locale de l'admin).
    promoFin: String(formData.get('promoFinIso') ?? ''),
    promoBulle: String(formData.get('promoBulle') ?? ''),
    promoTexte: String(formData.get('promoTexte') ?? ''),
    promoTexteEn: String(formData.get('promoTexteEn') ?? ''),
  })
  if (!resultat.success) {
    return { champs: resultat.error.flatten().fieldErrors }
  }
  if (resultat.data.promoActive && resultat.data.promoPourcentage === 0) {
    return { champs: { promoPourcentage: ['Indique un pourcentage pour activer la promo.'] } }
  }

  await prisma.reglages.upsert({
    where: { id: 1 },
    create: { id: 1, ip: REGLAGES_PAR_DEFAUT.ip, discord: REGLAGES_PAR_DEFAUT.discord, ...resultat.data },
    update: resultat.data,
  })

  // La bulle est dans la barre de TOUTES les pages publiques.
  revalidatePath('/', 'layout')

  return {
    succes: resultat.data.promoActive
      ? 'Promo enregistrée et visible sur le site. Pense à créer la même réduction dans Tebex.'
      : 'Promo enregistrée (désactivée).',
  }
}
