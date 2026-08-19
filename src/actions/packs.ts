'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { EtatFormulaire } from '@/actions/etat'
import { exigerAdmin } from '@/actions/garde'
import { eurosVersCentimes } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { schemaPack } from '@/lib/validations'

function revaliderBoutique() {
  revalidatePath('/boutique')
}

/** Champ « ID Tebex » du formulaire : vide → null, sinon un entier. */
function lireTebexPackageId(formData: FormData): number | null {
  const brut = String(formData.get('tebexPackageId') ?? '').trim()
  if (brut === '') return null
  return Number(brut)
}

function lireFormulairePack(formData: FormData) {
  return schemaPack.safeParse({
    slug: String(formData.get('slug') ?? ''),
    nom: String(formData.get('nom') ?? ''),
    description: String(formData.get('description') ?? ''),
    prixEurosCentimes: eurosVersCentimes(String(formData.get('prixEuros') ?? '')) ?? Number.NaN,
    prixBarreCentimes: eurosVersCentimes(String(formData.get('prixBarre') ?? '')),
    visible: formData.get('visible') !== null,
    achetable: formData.get('achetable') !== null,
    commandeLivraison: String(formData.get('commandeLivraison') ?? ''),
    commandeRetrait: String(formData.get('commandeRetrait') ?? ''),
    tebexPackageId: lireTebexPackageId(formData),
    // Une case cochée par kit inclus.
    kitIds: formData.getAll('kitId').map(String),
  })
}

async function renumeroter(idsDansLOrdre: string[]) {
  await prisma.$transaction(
    idsDansLOrdre.map((id, index) =>
      prisma.pack.update({ where: { id }, data: { ordre: index } }),
    ),
  )
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

export async function creerPack(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = lireFormulairePack(formData)
  if (!resultat.success) {
    return { champs: resultat.error.flatten().fieldErrors }
  }

  const { kitIds, ...donnees } = resultat.data

  const dejaPris = await prisma.pack.findUnique({ where: { slug: donnees.slug } })
  if (dejaPris) {
    return { champs: { slug: ['Ce slug est déjà utilisé par un autre pack.'] } }
  }

  const dernier = await prisma.pack.findFirst({ orderBy: { ordre: 'desc' } })

  await prisma.pack.create({
    data: {
      ...donnees,
      ordre: dernier ? dernier.ordre + 1 : 0,
      kits: { connect: kitIds.map((kitId) => ({ id: kitId })) },
    },
  })

  revaliderBoutique()
  redirect('/admin/packs')
}

export async function modifierPack(
  id: string,
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = lireFormulairePack(formData)
  if (!resultat.success) {
    return { champs: resultat.error.flatten().fieldErrors }
  }

  const { kitIds, ...donnees } = resultat.data

  const existant = await prisma.pack.findUnique({ where: { id } })
  if (!existant) return { erreur: 'Ce pack n’existe plus.' }

  const conflit = await prisma.pack.findUnique({ where: { slug: donnees.slug } })
  if (conflit && conflit.id !== id) {
    return { champs: { slug: ['Ce slug est déjà utilisé par un autre pack.'] } }
  }

  await prisma.pack.update({
    where: { id },
    data: {
      ...donnees,
      // `set` remplace la liste entière : c'est le formulaire qui fait foi.
      kits: { set: kitIds.map((kitId) => ({ id: kitId })) },
    },
  })

  revaliderBoutique()
  redirect('/admin/packs')
}

export async function supprimerPack(id: string) {
  await exigerAdmin()

  const pack = await prisma.pack.findUnique({ where: { id } })
  if (!pack) return

  await prisma.pack.delete({ where: { id } })

  revalidatePath('/admin/packs')
  revaliderBoutique()
}

export async function deplacerPack(id: string, direction: 'haut' | 'bas') {
  await exigerAdmin()

  const packs = await prisma.pack.findMany({
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    select: { id: true },
  })

  const position = packs.findIndex((pack) => pack.id === id)
  if (position === -1) return

  const cible = direction === 'haut' ? position - 1 : position + 1
  if (cible < 0 || cible >= packs.length) return

  const permute = [...packs]
  ;[permute[position], permute[cible]] = [permute[cible], permute[position]]

  await renumeroter(permute.map((pack) => pack.id))

  revalidatePath('/admin/packs')
  revaliderBoutique()
}

export async function basculerPack(id: string, champ: 'visible' | 'achetable') {
  await exigerAdmin()

  const pack = await prisma.pack.findUnique({ where: { id } })
  if (!pack) return

  await prisma.pack.update({ where: { id }, data: { [champ]: !pack[champ] } })

  revalidatePath('/admin/packs')
  revaliderBoutique()
}
