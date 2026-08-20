'use server'

import { revalidatePath } from 'next/cache'

import type { EtatFormulaire } from '@/actions/etat'
import { exigerAdmin } from '@/actions/garde'
import { prisma } from '@/lib/prisma'
import { schemaReglages } from '@/lib/validations'

/**
 * Enregistre les réglages du site.
 *
 * L'IP et le lien Discord apparaissent sur presque toutes les pages publiques,
 * qui sont en rendu statique : il faut donc revalider TOUT le site, pas
 * seulement une page. `revalidatePath('/', 'layout')` invalide la mise en page
 * racine et, avec elle, l'ensemble des pages qui en descendent.
 */
export async function enregistrerReglages(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = schemaReglages.safeParse({
    ip: String(formData.get('ip') ?? ''),
    discord: String(formData.get('discord') ?? ''),
    urlServeurPrive: String(formData.get('urlServeurPrive') ?? ''),
    urlTopServeurs: String(formData.get('urlTopServeurs') ?? ''),
    urlServeursMinecraft: String(formData.get('urlServeursMinecraft') ?? ''),
  })

  if (!resultat.success) {
    return { champs: resultat.error.flatten().fieldErrors }
  }

  // Table à une seule ligne : on upserte toujours sur l'id 1, jamais de
  // création d'une seconde ligne qui ne servirait à personne.
  await prisma.reglages.upsert({
    where: { id: 1 },
    create: { id: 1, ...resultat.data },
    update: resultat.data,
  })

  revalidatePath('/', 'layout')

  return { succes: 'Réglages enregistrés. Le site est à jour.' }
}
