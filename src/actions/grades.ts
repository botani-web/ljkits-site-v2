'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { EtatFormulaire } from '@/actions/etat'
import { exigerAdmin } from '@/actions/garde'
import { eurosVersCentimes } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { schemaGrade } from '@/lib/validations'

/** Les grades n'apparaissent que sur la boutique. */
function revaliderBoutique() {
  revalidatePath('/boutique')
}

/** Champ « ID Tebex » du formulaire : vide → null, sinon un entier. */
function lireTebexPackageId(formData: FormData): number | null {
  const brut = String(formData.get('tebexPackageId') ?? '').trim()
  if (brut === '') return null
  return Number(brut)
}

function lireFormulaireGrade(formData: FormData) {
  // Les avantages arrivent comme une liste de champs de même nom.
  const avantages = formData
    .getAll('avantage')
    .map(String)
    .filter((texte) => texte.trim() !== '')

  return schemaGrade.safeParse({
    slug: String(formData.get('slug') ?? ''),
    nom: String(formData.get('nom') ?? ''),
    kanji: String(formData.get('kanji') ?? ''),
    sousTitre: String(formData.get('sousTitre') ?? ''),
    etiquette: String(formData.get('etiquette') ?? ''),
    prixEurosCentimes: eurosVersCentimes(String(formData.get('prixEuros') ?? '')) ?? Number.NaN,
    visible: formData.get('visible') !== null,
    achetable: formData.get('achetable') !== null,
    heriteDuPrecedent: formData.get('heriteDuPrecedent') !== null,
    commandeLivraison: String(formData.get('commandeLivraison') ?? ''),
    commandeRetrait: String(formData.get('commandeRetrait') ?? ''),
    tebexPackageId: lireTebexPackageId(formData),
    avantages,
  })
}

/** Renumérote tous les grades d'après l'ordre du tableau reçu. */
async function renumeroter(idsDansLOrdre: string[]) {
  await prisma.$transaction(
    idsDansLOrdre.map((id, index) =>
      prisma.grade.update({ where: { id }, data: { ordre: index } }),
    ),
  )
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

export async function creerGrade(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = lireFormulaireGrade(formData)
  if (!resultat.success) {
    return { champs: resultat.error.flatten().fieldErrors }
  }

  const { avantages, ...donnees } = resultat.data

  const dejaPris = await prisma.grade.findUnique({ where: { slug: donnees.slug } })
  if (dejaPris) {
    return { champs: { slug: ['Ce slug est déjà utilisé par un autre grade.'] } }
  }

  const dernier = await prisma.grade.findFirst({ orderBy: { ordre: 'desc' } })

  await prisma.grade.create({
    data: {
      ...donnees,
      ordre: dernier ? dernier.ordre + 1 : 0,
      avantages: {
        create: avantages.map((texte, index) => ({ texte, ordre: index })),
      },
    },
  })

  revaliderBoutique()
  redirect('/admin/grades')
}

export async function modifierGrade(
  id: string,
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = lireFormulaireGrade(formData)
  if (!resultat.success) {
    return { champs: resultat.error.flatten().fieldErrors }
  }

  const { avantages, ...donnees } = resultat.data

  const existant = await prisma.grade.findUnique({ where: { id } })
  if (!existant) return { erreur: 'Ce grade n’existe plus.' }

  const conflit = await prisma.grade.findUnique({ where: { slug: donnees.slug } })
  if (conflit && conflit.id !== id) {
    return { champs: { slug: ['Ce slug est déjà utilisé par un autre grade.'] } }
  }

  await prisma.$transaction([
    prisma.grade.update({ where: { id }, data: donnees }),
    // Les avantages sont remplacés en bloc, comme les caractéristiques de kit.
    prisma.avantageGrade.deleteMany({ where: { gradeId: id } }),
    prisma.avantageGrade.createMany({
      data: avantages.map((texte, index) => ({ gradeId: id, texte, ordre: index })),
    }),
  ])

  revaliderBoutique()
  redirect('/admin/grades')
}

export async function supprimerGrade(id: string) {
  await exigerAdmin()

  const grade = await prisma.grade.findUnique({ where: { id } })
  if (!grade) return

  // Les avantages partent en cascade ; les lignes de commande gardent leur
  // libellé et leur prix, seul gradeId passe à null (onDelete: SetNull).
  await prisma.grade.delete({ where: { id } })

  revalidatePath('/admin/grades')
  revaliderBoutique()
}

export async function deplacerGrade(id: string, direction: 'haut' | 'bas') {
  await exigerAdmin()

  const grades = await prisma.grade.findMany({
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    select: { id: true },
  })

  const position = grades.findIndex((grade) => grade.id === id)
  if (position === -1) return

  const cible = direction === 'haut' ? position - 1 : position + 1
  if (cible < 0 || cible >= grades.length) return

  const permute = [...grades]
  ;[permute[position], permute[cible]] = [permute[cible], permute[position]]

  await renumeroter(permute.map((grade) => grade.id))

  revalidatePath('/admin/grades')
  revaliderBoutique()
}

type ChampBascule = 'visible' | 'achetable' | 'heriteDuPrecedent'

export async function basculerGrade(id: string, champ: ChampBascule) {
  await exigerAdmin()

  const grade = await prisma.grade.findUnique({ where: { id } })
  if (!grade) return

  await prisma.grade.update({ where: { id }, data: { [champ]: !grade[champ] } })

  revalidatePath('/admin/grades')
  revaliderBoutique()
}
