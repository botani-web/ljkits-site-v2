'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { exigerAdmin } from '@/actions/garde'
import type { EtatFormulaire } from '@/actions/etat'
import { prisma } from '@/lib/prisma'
import { schemaSection } from '@/lib/validations'

/** Le règlement n'a qu'une seule page publique à rafraîchir. */
function revaliderReglement() {
  revalidatePath('/reglement')
}

function lireFormulaireSection(formData: FormData) {
  return schemaSection.safeParse({
    titre: String(formData.get('titre') ?? ''),
    contenu: String(formData.get('contenu') ?? ''),
    publie: formData.get('publie') !== null,
  })
}

/** Renumérote toutes les sections d'après l'ordre du tableau reçu. */
async function renumeroter(idsDansLOrdre: string[]) {
  await prisma.$transaction(
    idsDansLOrdre.map((id, index) =>
      prisma.sectionReglement.update({ where: { id }, data: { ordre: index } }),
    ),
  )
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

export async function creerSection(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = lireFormulaireSection(formData)
  if (!resultat.success) {
    return { champs: resultat.error.flatten().fieldErrors }
  }

  const derniere = await prisma.sectionReglement.findFirst({ orderBy: { ordre: 'desc' } })

  await prisma.sectionReglement.create({
    data: { ...resultat.data, ordre: derniere ? derniere.ordre + 1 : 0 },
  })

  revaliderReglement()
  redirect('/admin/reglement')
}

export async function modifierSection(
  id: string,
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = lireFormulaireSection(formData)
  if (!resultat.success) {
    return { champs: resultat.error.flatten().fieldErrors }
  }

  const existante = await prisma.sectionReglement.findUnique({ where: { id } })
  if (!existante) {
    return { erreur: 'Cette section n’existe plus.' }
  }

  await prisma.sectionReglement.update({ where: { id }, data: resultat.data })

  revaliderReglement()
  redirect('/admin/reglement')
}

export async function supprimerSection(id: string) {
  await exigerAdmin()

  const existante = await prisma.sectionReglement.findUnique({ where: { id } })
  if (!existante) return

  await prisma.sectionReglement.delete({ where: { id } })

  revalidatePath('/admin/reglement')
  revaliderReglement()
}

/** Déplace une section d'un cran vers le haut ou vers le bas. */
export async function deplacerSection(id: string, direction: 'haut' | 'bas') {
  await exigerAdmin()

  const sections = await prisma.sectionReglement.findMany({
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    select: { id: true },
  })

  const position = sections.findIndex((section) => section.id === id)
  if (position === -1) return

  const cible = direction === 'haut' ? position - 1 : position + 1
  if (cible < 0 || cible >= sections.length) return

  const permute = [...sections]
  ;[permute[position], permute[cible]] = [permute[cible], permute[position]]

  await renumeroter(permute.map((section) => section.id))

  revalidatePath('/admin/reglement')
  revaliderReglement()
}

/** Bascule une section entre brouillon et publié. */
export async function basculerPublicationSection(id: string) {
  await exigerAdmin()

  const section = await prisma.sectionReglement.findUnique({ where: { id } })
  if (!section) return

  await prisma.sectionReglement.update({
    where: { id },
    data: { publie: !section.publie },
  })

  revalidatePath('/admin/reglement')
  revaliderReglement()
}
