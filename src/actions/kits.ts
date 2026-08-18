'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { exigerAdmin } from '@/actions/garde'
import type { EtatFormulaire } from '@/actions/etat'
import { eurosVersCentimes } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { schemaKit } from '@/lib/validations'

/* -------------------------------------------------------------------------- */
/* Outils internes                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Rafraîchit le cache des pages publiques touchées par une modification de kit.
 *
 * `slugs` contient TOUS les slugs concernés. Au renommage d'un kit il en faut
 * deux : l'ancien (pour que /kits/ancien-slug cesse d'être servi depuis le
 * cache) et le nouveau. C'est pour ça que les actions relisent le slug en base
 * AVANT d'écrire.
 */
function revaliderPagesKits(slugs: string[]) {
  revalidatePath('/') // le compteur de kits de l'accueil
  revalidatePath('/kits')
  for (const slug of new Set(slugs)) {
    revalidatePath(`/kits/${slug}`)
  }
}

/**
 * Reconstruit l'objet « kit » à partir du formulaire, puis le valide.
 * Les cases à cocher sont absentes du FormData quand elles ne sont pas
 * cochées : `!== null` suffit à les lire.
 */
function lireFormulaireKit(formData: FormData) {
  // Les caractéristiques arrivent en deux tableaux parallèles, appariés par index.
  const libelles = formData.getAll('caracLibelle').map(String)
  const valeurs = formData.getAll('caracValeur').map(String)

  const caracteristiques = libelles
    .map((libelle, index) => ({ libelle, valeur: valeurs[index] ?? '' }))
    // On ignore les lignes entièrement vides : ce sont des champs jamais remplis.
    .filter((ligne) => ligne.libelle.trim() !== '' || ligne.valeur.trim() !== '')

  return schemaKit.safeParse({
    slug: String(formData.get('slug') ?? ''),
    nom: String(formData.get('nom') ?? ''),
    kanji: String(formData.get('kanji') ?? ''),
    role: String(formData.get('role') ?? ''),
    descriptionCourte: String(formData.get('descriptionCourte') ?? ''),
    descriptionLongue: String(formData.get('descriptionLongue') ?? ''),
    prixCoins: Number(String(formData.get('prixCoins') ?? '').trim() || Number.NaN),
    prixEurosCentimes: eurosVersCentimes(String(formData.get('prixEuros') ?? '')),
    type: String(formData.get('type') ?? ''),
    visible: formData.get('visible') !== null,
    achetable: formData.get('achetable') !== null,
    bientot: formData.get('bientot') !== null,
    kitDeDepart: formData.get('kitDeDepart') !== null,
    caracteristiques,
  })
}

/**
 * Réécrit le champ `ordre` de tous les kits d'après l'ordre du tableau reçu.
 * Renuméroter intégralement plutôt qu'échanger deux valeurs évite les trous et
 * les doublons, et répare une liste déjà incohérente.
 */
async function renumeroter(idsDansLOrdre: string[]) {
  await prisma.$transaction(
    idsDansLOrdre.map((id, index) =>
      prisma.kit.update({ where: { id }, data: { ordre: index } }),
    ),
  )
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

export async function creerKit(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = lireFormulaireKit(formData)
  if (!resultat.success) {
    return { champs: resultat.error.flatten().fieldErrors }
  }

  const { caracteristiques, ...donnees } = resultat.data

  // Le slug est unique : on le vérifie avant, pour renvoyer un message clair
  // plutôt que de laisser remonter une erreur Prisma.
  const dejaPris = await prisma.kit.findUnique({ where: { slug: donnees.slug } })
  if (dejaPris) {
    return { champs: { slug: ['Ce slug est déjà utilisé par un autre kit.'] } }
  }

  // Le nouveau kit se place à la fin de la liste.
  const dernier = await prisma.kit.findFirst({ orderBy: { ordre: 'desc' } })

  await prisma.kit.create({
    data: {
      ...donnees,
      ordre: dernier ? dernier.ordre + 1 : 0,
      caracteristiques: {
        create: caracteristiques.map((carac, index) => ({ ...carac, ordre: index })),
      },
    },
  })

  revaliderPagesKits([donnees.slug])
  redirect('/admin/kits')
}

export async function modifierKit(
  id: string,
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = lireFormulaireKit(formData)
  if (!resultat.success) {
    return { champs: resultat.error.flatten().fieldErrors }
  }

  const { caracteristiques, ...donnees } = resultat.data

  // ⚠ Lecture de l'ANCIEN slug avant toute écriture : c'est lui qu'il faudra
  // revalider en plus du nouveau si le kit a été renommé.
  const kitExistant = await prisma.kit.findUnique({ where: { id } })
  if (!kitExistant) {
    return { erreur: 'Ce kit n’existe plus.' }
  }

  const conflit = await prisma.kit.findUnique({ where: { slug: donnees.slug } })
  if (conflit && conflit.id !== id) {
    return { champs: { slug: ['Ce slug est déjà utilisé par un autre kit.'] } }
  }

  await prisma.$transaction([
    prisma.kit.update({ where: { id }, data: donnees }),
    // Les caractéristiques sont remplacées en bloc : plus simple, et sans
    // risque de désynchronisation entre les lignes du formulaire et la base.
    prisma.caracteristiqueKit.deleteMany({ where: { kitId: id } }),
    prisma.caracteristiqueKit.createMany({
      data: caracteristiques.map((carac, index) => ({ ...carac, kitId: id, ordre: index })),
    }),
  ])

  revaliderPagesKits([kitExistant.slug, donnees.slug])
  redirect('/admin/kits')
}

export async function supprimerKit(id: string) {
  await exigerAdmin()

  // Le slug est relu avant la suppression, sinon il n'y a plus rien à revalider.
  const kit = await prisma.kit.findUnique({ where: { id } })
  if (!kit) return

  // Les caractéristiques partent avec le kit (onDelete: Cascade au schéma).
  await prisma.kit.delete({ where: { id } })

  revalidatePath('/admin/kits')
  revaliderPagesKits([kit.slug])
}

/** Déplace un kit d'un cran vers le haut ou vers le bas dans la grille. */
export async function deplacerKit(id: string, direction: 'haut' | 'bas') {
  await exigerAdmin()

  // L'id départage les kits qui partagent le même `ordre`, pour que la liste
  // affichée et la liste manipulée ici soient toujours dans le même ordre.
  const kits = await prisma.kit.findMany({
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    select: { id: true, slug: true },
  })

  const position = kits.findIndex((kit) => kit.id === id)
  if (position === -1) return

  const cible = direction === 'haut' ? position - 1 : position + 1
  // Déjà en haut ou déjà en bas : rien à faire.
  if (cible < 0 || cible >= kits.length) return

  const permute = [...kits]
  ;[permute[position], permute[cible]] = [permute[cible], permute[position]]

  await renumeroter(permute.map((kit) => kit.id))

  revalidatePath('/admin/kits')
  revaliderPagesKits([kits[position].slug, kits[cible].slug])
}

/** Champs booléens qu'on peut basculer directement depuis le tableau de bord. */
type ChampBascule = 'visible' | 'achetable' | 'bientot' | 'kitDeDepart'

export async function basculerKit(id: string, champ: ChampBascule) {
  await exigerAdmin()

  const kit = await prisma.kit.findUnique({ where: { id } })
  if (!kit) return

  await prisma.kit.update({ where: { id }, data: { [champ]: !kit[champ] } })

  revalidatePath('/admin/kits')
  revaliderPagesKits([kit.slug])
}
