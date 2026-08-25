'use server'

/**
 * Les Server Actions de /admin/recrutement.
 *
 * exigerAdmin() EN PREMIÈRE LIGNE DE CHACUNE, sans exception : une Server
 * Action est une route HTTP à part entière, le fait que le formulaire vive
 * sous /admin ne protège rien (cf. src/actions/garde.ts).
 *
 * LA RÈGLE QUI GOUVERNE CE FICHIER : on ne détruit jamais l'historique.
 * Une question à laquelle des candidats ont répondu ne se supprime pas, elle
 * se désactive. Une candidature ne se supprime pas d'un clic, elle va à la
 * corbeille. Le seul vrai DELETE demande de retaper le pseudo du candidat.
 */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Prisma, StatutCandidature } from '@prisma/client'

import { exigerAdmin } from '@/actions/garde'
import type { EtatFormulaire } from '@/actions/etat'
import { envoyerCandidature as posterSurDiscord } from '@/lib/discord'
import { prisma } from '@/lib/prisma'
import {
  schemaMessageFerme,
  schemaNoteAdmin,
  schemaQuestionRecrutement,
  schemaSectionRecrutement,
} from '@/lib/validations'

/** L'admin et la page publique changent ensemble. */
function revaliderRecrutement() {
  revalidatePath('/admin/recrutement')
  revalidatePath('/recrutement')
}

/* ========================================================================== */
/* L'interrupteur global                                                      */
/* ========================================================================== */

/**
 * Ouvre ou ferme le recrutement.
 *
 * L'état est dans `Reglages`, table à une seule ligne d'id 1. On upserte
 * plutôt qu'on update : sur une base sans ligne de réglages, un update
 * échouerait et l'interrupteur serait inerte sans qu'on comprenne pourquoi.
 * Les valeurs de création reprennent celles du seed.
 */
export async function basculerRecrutement() {
  await exigerAdmin()

  const reglages = await prisma.reglages.findUnique({
    where: { id: 1 },
    select: { recrutementOuvert: true },
  })

  await prisma.reglages.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      ip: 'mc.ljkits.eu',
      discord: 'https://discord.gg/ljkits',
      recrutementOuvert: true,
    },
    update: { recrutementOuvert: !reglages?.recrutementOuvert },
  })

  revaliderRecrutement()
}

export async function modifierMessageFerme(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = schemaMessageFerme.safeParse({
    recrutementMessageFerme: String(formData.get('recrutementMessageFerme') ?? ''),
  })

  if (!resultat.success) {
    return { champs: resultat.error.flatten().fieldErrors }
  }

  await prisma.reglages.update({ where: { id: 1 }, data: resultat.data })

  revaliderRecrutement()
  return { succes: 'Message enregistré.' }
}

/* ========================================================================== */
/* Sections                                                                   */
/* ========================================================================== */

function lireFormulaireSection(formData: FormData) {
  return schemaSectionRecrutement.safeParse({
    nom: String(formData.get('nom') ?? ''),
    actif: formData.get('actif') !== null,
  })
}

export async function creerSectionRecrutement(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = lireFormulaireSection(formData)
  if (!resultat.success) return { champs: resultat.error.flatten().fieldErrors }

  const derniere = await prisma.sectionRecrutement.findFirst({ orderBy: { ordre: 'desc' } })

  await prisma.sectionRecrutement.create({
    data: { ...resultat.data, ordre: derniere ? derniere.ordre + 1 : 0 },
  })

  revaliderRecrutement()
  return { succes: 'Section créée.' }
}

export async function renommerSection(
  id: string,
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = lireFormulaireSection(formData)
  if (!resultat.success) return { champs: resultat.error.flatten().fieldErrors }

  await prisma.sectionRecrutement.update({ where: { id }, data: resultat.data })

  revaliderRecrutement()
  return { succes: 'Section enregistrée.' }
}

export async function basculerSection(id: string) {
  await exigerAdmin()

  const section = await prisma.sectionRecrutement.findUnique({ where: { id } })
  if (!section) return

  await prisma.sectionRecrutement.update({
    where: { id },
    data: { actif: !section.actif },
  })

  revaliderRecrutement()
}

export async function deplacerSection(id: string, direction: 'haut' | 'bas') {
  await exigerAdmin()

  const sections = await prisma.sectionRecrutement.findMany({
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    select: { id: true },
  })

  await permuter(sections, id, direction, (ids) =>
    ids.map((identifiant, index) =>
      prisma.sectionRecrutement.update({ where: { id: identifiant }, data: { ordre: index } }),
    ),
  )

  revaliderRecrutement()
}

/**
 * Supprime une section — SEULEMENT si elle est vide.
 *
 * Une section qui porte encore des questions est désactivée. Le `Restrict` du
 * schéma refuserait de toute façon le DELETE, mais mieux vaut un message clair
 * qu'une erreur de contrainte.
 */
export async function supprimerSection(id: string) {
  await exigerAdmin()

  const questions = await prisma.questionRecrutement.count({ where: { sectionId: id } })

  if (questions > 0) {
    await prisma.sectionRecrutement.update({ where: { id }, data: { actif: false } })
  } else {
    await prisma.sectionRecrutement.delete({ where: { id } })
  }

  revaliderRecrutement()
}

/* ========================================================================== */
/* Questions                                                                  */
/* ========================================================================== */

/**
 * Les bornes arrivent sous forme de chaînes : vide = « pas de borne », donc
 * null. `Number('')` vaut 0, ce qui poserait un minimum de zéro caractère au
 * lieu de n'en poser aucun — d'où la conversion explicite.
 */
function borne(valeur: FormDataEntryValue | null): number | null {
  const texte = String(valeur ?? '').trim()
  return texte === '' ? null : Number(texte)
}

function lireFormulaireQuestion(formData: FormData) {
  return schemaQuestionRecrutement.safeParse({
    sectionId: String(formData.get('sectionId') ?? ''),
    libelle: String(formData.get('libelle') ?? ''),
    aide: String(formData.get('aide') ?? ''),
    type: String(formData.get('type') ?? ''),
    // Une option par ligne : c'est la saisie la plus simple à taper, et la
    // plus simple à relire.
    options: String(formData.get('options') ?? '')
      .split('\n')
      .map((option) => option.trim())
      .filter((option) => option !== ''),
    obligatoire: formData.get('obligatoire') !== null,
    minimum: borne(formData.get('minimum')),
    maximum: borne(formData.get('maximum')),
    actif: formData.get('actif') !== null,
  })
}

/**
 * Les bornes n'ont de sens que pour certains types. Plutôt que de faire
 * confiance à l'admin pour vider les champs en changeant de type, on les
 * neutralise ici : un « Oui / Non » ne gardera jamais un minimum de 200
 * caractères hérité d'un ancien réglage.
 */
function nettoyerSelonLeType(donnees: {
  type: string
  options: string[]
  minimum: number | null
  maximum: number | null
}) {
  const bornesUtiles = ['TEXTE_COURT', 'TEXTE_LONG', 'NOMBRE'].includes(donnees.type)

  return {
    options: donnees.type === 'CHOIX_UNIQUE' ? donnees.options : [],
    minimum: bornesUtiles ? donnees.minimum : null,
    maximum: bornesUtiles ? donnees.maximum : null,
  }
}

export async function creerQuestion(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = lireFormulaireQuestion(formData)
  if (!resultat.success) return { champs: resultat.error.flatten().fieldErrors }

  const derniere = await prisma.questionRecrutement.findFirst({
    where: { sectionId: resultat.data.sectionId },
    orderBy: { ordre: 'desc' },
  })

  await prisma.questionRecrutement.create({
    data: {
      ...resultat.data,
      ...nettoyerSelonLeType(resultat.data),
      ordre: derniere ? derniere.ordre + 1 : 0,
    },
  })

  revaliderRecrutement()
  redirect('/admin/recrutement?onglet=questions')
}

export async function modifierQuestion(
  id: string,
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = lireFormulaireQuestion(formData)
  if (!resultat.success) return { champs: resultat.error.flatten().fieldErrors }

  const existante = await prisma.questionRecrutement.findUnique({ where: { id } })
  if (!existante) return { erreur: 'Cette question n’existe plus.' }

  // Changer une question de section la met en fin de sa nouvelle section :
  // conserver son ancien rang la placerait au hasard au milieu.
  const ordre =
    existante.sectionId === resultat.data.sectionId
      ? existante.ordre
      : ((
          await prisma.questionRecrutement.findFirst({
            where: { sectionId: resultat.data.sectionId },
            orderBy: { ordre: 'desc' },
          })
        )?.ordre ?? -1) + 1

  await prisma.questionRecrutement.update({
    where: { id },
    data: { ...resultat.data, ...nettoyerSelonLeType(resultat.data), ordre },
  })

  revaliderRecrutement()
  redirect('/admin/recrutement?onglet=questions')
}

export async function basculerQuestion(id: string) {
  await exigerAdmin()

  const question = await prisma.questionRecrutement.findUnique({ where: { id } })
  if (!question) return

  await prisma.questionRecrutement.update({
    where: { id },
    data: { actif: !question.actif },
  })

  revaliderRecrutement()
}

export async function deplacerQuestion(id: string, direction: 'haut' | 'bas') {
  await exigerAdmin()

  const question = await prisma.questionRecrutement.findUnique({
    where: { id },
    select: { sectionId: true },
  })
  if (!question) return

  // Le déplacement se fait DANS la section : c'est la flèche qui range, pas
  // celle qui déménage. Pour changer de section, on édite la question.
  const questions = await prisma.questionRecrutement.findMany({
    where: { sectionId: question.sectionId },
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    select: { id: true },
  })

  await permuter(questions, id, direction, (ids) =>
    ids.map((identifiant, index) =>
      prisma.questionRecrutement.update({ where: { id: identifiant }, data: { ordre: index } }),
    ),
  )

  revaliderRecrutement()
}

/**
 * « Supprime » une question.
 *
 * ⚠ SI DES RÉPONSES Y SONT RATTACHÉES, ON DÉSACTIVE AU LIEU DE SUPPRIMER.
 *
 * Le `SET NULL` du schéma protégerait déjà les réponses d'un vrai DELETE : la
 * fiche resterait lisible grâce au libellé figé. Mais on perdrait le lien qui
 * permet de regrouper les réponses d'une même question d'un candidat à
 * l'autre, et ce lien ne se reconstitue pas. Une question qui a servi ne
 * disparaît donc jamais : elle sort du formulaire, c'est tout.
 *
 * Sans aucune réponse, le DELETE est autorisé : rien à préserver.
 */
export async function supprimerQuestion(id: string) {
  await exigerAdmin()

  const reponses = await prisma.reponseCandidature.count({ where: { questionId: id } })

  if (reponses > 0) {
    await prisma.questionRecrutement.update({ where: { id }, data: { actif: false } })
  } else {
    await prisma.questionRecrutement.delete({ where: { id } })
  }

  revaliderRecrutement()
}

/* ========================================================================== */
/* Candidatures                                                               */
/* ========================================================================== */

export async function changerStatutCandidature(id: string, statut: StatutCandidature) {
  await exigerAdmin()

  await prisma.candidature.update({
    where: { id },
    data: {
      statut,
      // `decideeAt` fait courir le délai de carence de 30 jours après un refus.
      // Il est reposé à chaque décision, et effacé si on remet en attente :
      // une candidature en attente n'a pas de décision.
      decideeAt: statut === 'EN_ATTENTE' ? null : new Date(),
    },
  })

  revalidatePath('/admin/recrutement')
  revalidatePath(`/admin/recrutement/${id}`)
}

export async function enregistrerNote(
  id: string,
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const resultat = schemaNoteAdmin.safeParse({
    noteAdmin: String(formData.get('noteAdmin') ?? ''),
  })

  if (!resultat.success) return { champs: resultat.error.flatten().fieldErrors }

  await prisma.candidature.update({ where: { id }, data: resultat.data })

  revalidatePath(`/admin/recrutement/${id}`)
  return { succes: 'Note enregistrée.' }
}

/** Mise à la corbeille : réversible, sans cérémonie. */
export async function mettreALaCorbeille(id: string) {
  await exigerAdmin()

  await prisma.candidature.update({ where: { id }, data: { supprimeeAt: new Date() } })

  revalidatePath('/admin/recrutement')
  redirect('/admin/recrutement')
}

export async function restaurerCandidature(id: string) {
  await exigerAdmin()

  await prisma.candidature.update({ where: { id }, data: { supprimeeAt: null } })

  revalidatePath('/admin/recrutement')
  revalidatePath(`/admin/recrutement/${id}`)
}

/**
 * LE SEUL VRAI DELETE du recrutement.
 *
 * Irréversible : le CASCADE emporte toutes les réponses, écrites par une
 * personne réelle sous un consentement figé. D'où la confirmation en deux
 * temps — il faut retaper le pseudo Minecraft du candidat, et c'est vérifié
 * ICI et pas seulement dans le navigateur.
 *
 * Cette porte doit rester ouverte : un candidat qui demande l'effacement de
 * ses données a droit à une vraie suppression, pas à un drapeau en base.
 */
export async function supprimerDefinitivement(
  id: string,
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin()

  const candidature = await prisma.candidature.findUnique({
    where: { id },
    select: { pseudoMinecraft: true },
  })

  if (!candidature) return { erreur: 'Cette candidature n’existe plus.' }

  const saisie = String(formData.get('confirmation') ?? '').trim()

  if (saisie.toLowerCase() !== candidature.pseudoMinecraft.toLowerCase()) {
    return {
      erreur: `Pour supprimer définitivement, retape exactement « ${candidature.pseudoMinecraft} ».`,
    }
  }

  await prisma.candidature.delete({ where: { id } })

  revalidatePath('/admin/recrutement')
  redirect('/admin/recrutement?onglet=candidatures&filtre=corbeille')
}

/** Renvoie une candidature sur Discord après un échec du webhook. */
export async function renvoyerSurDiscord(id: string) {
  await exigerAdmin()

  const candidature = await prisma.candidature.findUnique({
    where: { id },
    select: {
      id: true,
      numero: true,
      pseudoMinecraft: true,
      pseudoDiscord: true,
      age: true,
      reponses: {
        select: { libelleFige: true, typeFige: true, valeur: true, ordreFige: true },
        orderBy: { ordreFige: 'asc' },
      },
    },
  })

  if (!candidature) return

  const resultat = await posterSurDiscord(candidature)

  await prisma.candidature.update({
    where: { id },
    data: resultat.envoye
      ? { webhookEnvoyeAt: new Date(), webhookErreur: null }
      : { webhookErreur: resultat.erreur.slice(0, 500) },
  })

  revalidatePath('/admin/recrutement')
  revalidatePath(`/admin/recrutement/${id}`)
}

/* ========================================================================== */
/* Outillage                                                                  */
/* ========================================================================== */

/**
 * Permute un élément avec son voisin et renumérote tout.
 *
 * Renuméroter la liste entière plutôt qu'échanger deux valeurs évite d'avoir
 * besoin d'une position temporaire, et répare au passage les ordres devenus
 * incohérents (deux éléments au même rang après un changement de section).
 */
async function permuter(
  elements: { id: string }[],
  id: string,
  direction: 'haut' | 'bas',
  renumeroter: (ids: string[]) => Prisma.PrismaPromise<unknown>[],
) {
  const position = elements.findIndex((element) => element.id === id)
  if (position === -1) return

  const cible = direction === 'haut' ? position - 1 : position + 1
  if (cible < 0 || cible >= elements.length) return

  const permute = [...elements]
  ;[permute[position], permute[cible]] = [permute[cible], permute[position]]

  await prisma.$transaction(renumeroter(permute.map((element) => element.id)))
}
