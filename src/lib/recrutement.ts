/**
 * Le cœur SERVEUR du recrutement staff : lire le questionnaire en base, et en
 * déduire la validation du formulaire public.
 *
 * ⚠ CE FICHIER IMPORTE PRISMA ET ZOD. Il ne doit jamais être importé depuis un
 * composant client, sous peine d'expédier 114 kB de code serveur au navigateur.
 * Ce dont le formulaire a besoin (constantes, types, fonctions pures) vit dans
 * src/lib/recrutement-partage.ts, réexporté ci-dessous pour que le code serveur
 * n'ait qu'un seul point d'entrée.
 *
 * Deux idées gouvernent ce fichier.
 *
 * 1. LE NAVIGATEUR N'EST JAMAIS CRU SUR LA FORME DU FORMULAIRE. La liste des
 *    questions, leur obligation, leurs bornes et leurs options sont relues en
 *    base à CHAQUE soumission, et le schéma zod est construit à partir de cette
 *    lecture. Un champ envoyé qui ne correspond à aucune question active est
 *    ignoré ; une option de choix forgée est refusée.
 *
 * 2. LES RÉPONSES SONT DES PHOTOGRAPHIES. Ce qui part en base contient le
 *    libellé, le type, la section et le rang tels qu'ils étaient à l'instant de
 *    l'envoi (cf. `ReponseCandidature` dans prisma/schema.prisma). Modifier ou
 *    supprimer une question ensuite ne réécrit pas l'histoire.
 */
import { cache } from 'react'
import { z } from 'zod'
import type { TypeQuestion } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import {
  AGE_MAXIMUM,
  AGE_MINIMUM,
  champDeQuestion,
  plafondDe,
  type QuestionPubliee,
  type Reponses,
} from '@/lib/recrutement-partage'

export * from '@/lib/recrutement-partage'

/* -------------------------------------------------------------------------- */
/* Lecture du questionnaire                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Les questions actives, dans l'ordre d'affichage.
 *
 * Une question n'est retenue que si ELLE est active ET que sa section l'est :
 * désactiver une section retire tout son bloc du formulaire sans avoir à
 * décocher ses questions une par une.
 *
 * `cache()` déduplique l'appel dans un même rendu — la page et l'aperçu de
 * l'admin la demandent tous les deux.
 */
export const lireQuestionsActives = cache(async (): Promise<QuestionPubliee[]> => {
  const sections = await prisma.sectionRecrutement.findMany({
    where: { actif: true },
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    include: {
      questions: {
        where: { actif: true },
        orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
      },
    },
  })

  const publiees: QuestionPubliee[] = []

  for (const section of sections) {
    for (const question of section.questions) {
      publiees.push({
        id: question.id,
        libelle: question.libelle,
        aide: question.aide,
        type: question.type,
        options: question.options,
        obligatoire: question.obligatoire,
        minimum: question.minimum,
        maximum: question.maximum,
        section: section.nom,
        // Le rang est attribué ICI, à la lecture, et non stocké : il découle de
        // l'ordre des sections et des questions, qui bougent tous les deux.
        rang: publiees.length,
      })
    }
  }

  return publiees
})

/* -------------------------------------------------------------------------- */
/* Le schéma zod, construit depuis la base                                    */
/* -------------------------------------------------------------------------- */

/** Le validateur d'une question, adapté à son type et à ses bornes. */
function validateurDe(question: QuestionPubliee) {
  const plafond = plafondDe(question)

  return z.string().superRefine((brut, ctx) => {
    const valeur = brut.trim()

    // Le vide se traite d'abord, une fois, pour tous les types : une question
    // facultative laissée vide est valide et s'arrête là.
    if (valeur === '') {
      if (question.obligatoire) {
        ctx.addIssue({
          code: 'custom',
          message:
            question.type === 'OUI_NON' || question.type === 'CHOIX_UNIQUE'
              ? 'Choisis une réponse.'
              : 'Cette question est obligatoire.',
        })
      }
      return
    }

    switch (question.type) {
      case 'TEXTE_COURT':
      case 'TEXTE_LONG': {
        if (question.minimum !== null && valeur.length < question.minimum) {
          ctx.addIssue({
            code: 'custom',
            message: `Réponse trop courte : ${question.minimum} caractères minimum (tu en as écrit ${valeur.length}).`,
          })
        }
        if (valeur.length > plafond) {
          ctx.addIssue({
            code: 'custom',
            message: `Réponse trop longue : ${plafond} caractères maximum (tu en as écrit ${valeur.length}).`,
          })
        }
        return
      }

      case 'NOMBRE': {
        // Neuf chiffres au plus : au-delà on sort de l'entier confortable, et
        // aucune question légitime n'a besoin de davantage.
        if (!/^-?\d{1,9}$/.test(valeur)) {
          ctx.addIssue({ code: 'custom', message: 'Indique un nombre entier.' })
          return
        }

        const nombre = Number(valeur)

        if (question.minimum !== null && nombre < question.minimum) {
          ctx.addIssue({
            code: 'custom',
            message: `La valeur minimale est ${question.minimum}.`,
          })
        }
        if (question.maximum !== null && nombre > question.maximum) {
          ctx.addIssue({
            code: 'custom',
            message: `La valeur maximale est ${question.maximum}.`,
          })
        }
        return
      }

      case 'OUI_NON': {
        if (valeur !== 'oui' && valeur !== 'non') {
          ctx.addIssue({ code: 'custom', message: 'Réponds par oui ou par non.' })
        }
        return
      }

      case 'CHOIX_UNIQUE': {
        // La liste vient de la BASE, jamais du formulaire envoyé : une option
        // ajoutée à la main dans le HTML n'existe pas ici, donc est refusée.
        if (!question.options.includes(valeur)) {
          ctx.addIssue({ code: 'custom', message: 'Cette réponse n’est pas proposée.' })
        }
        return
      }
    }
  })
}

/**
 * Construit le schéma du formulaire à partir des questions actives.
 *
 * Chaque question devient une clé `q_<id>`. Les clés absentes deviennent des
 * chaînes vides (le navigateur n'envoie rien pour une case décochée), ce qui
 * fait retomber une question obligatoire non remplie sur le bon message.
 */
export function construireSchemaReponses(questions: QuestionPubliee[]) {
  const formes: Record<string, z.ZodType<string>> = {}

  for (const question of questions) {
    formes[champDeQuestion(question.id)] = validateurDe(question)
  }

  return z.object(formes)
}

/**
 * Extrait du FormData les seules clés attendues.
 *
 * Tout ce que le navigateur envoie d'autre est ignoré sans un mot : c'est ce
 * qui garantit qu'un champ ajouté à la main dans le HTML ne peut rien écrire.
 */
export function extraireReponses(
  formData: FormData,
  questions: QuestionPubliee[],
): Reponses {
  const reponses: Reponses = {}

  for (const question of questions) {
    const champ = champDeQuestion(question.id)
    reponses[champ] = String(formData.get(champ) ?? '')
  }

  return reponses
}

/** Poids total des réponses, comparé à PLAFOND_ENVOI avant toute validation. */
export function poidsDesReponses(reponses: Reponses): number {
  return Object.values(reponses).reduce((total, valeur) => total + valeur.length, 0)
}

/* -------------------------------------------------------------------------- */
/* La photographie                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Les lignes à écrire dans `ReponseCandidature`, prêtes pour createMany.
 *
 * UNE LIGNE PAR QUESTION ACTIVE, MÊME SANS RÉPONSE. Une question facultative
 * laissée vide donne une ligne à `valeur: ''` — c'est ce qui permettra plus
 * tard de distinguer « on lui a posé la question, il n'a pas répondu » de « la
 * question n'existait pas encore », et c'est pour ça que rendre une question
 * obligatoire après coup n'a aucun effet sur les candidatures déjà reçues.
 */
export function photographierReponses(
  questions: QuestionPubliee[],
  reponses: Reponses,
): {
  questionId: string
  libelleFige: string
  typeFige: TypeQuestion
  sectionFigee: string
  ordreFige: number
  valeur: string
}[] {
  return questions.map((question) => ({
    questionId: question.id,
    libelleFige: question.libelle,
    typeFige: question.type,
    sectionFigee: question.section,
    ordreFige: question.rang,
    valeur: (reponses[champDeQuestion(question.id)] ?? '').trim(),
  }))
}

/* -------------------------------------------------------------------------- */
/* Identité du candidat — champs système                                      */
/* -------------------------------------------------------------------------- */

/**
 * Les trois champs d'identité ne sont pas des questions administrables : ils
 * portent des règles métier (carence, limitation de débit, âge minimum,
 * affichage, embed Discord) qu'un clic dans l'admin ne doit pas pouvoir
 * casser. Leur validation est donc écrite ici, en dur, et non déduite de la
 * base.
 */
export const schemaIdentite = z.object({
  /** Le même regex que la boutique : cohérent, et déjà éprouvé en production. */
  pseudoMinecraft: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9_]{3,16}$/,
      'Pseudo Minecraft invalide : 3 à 16 caractères, lettres, chiffres et _ uniquement.',
    ),

  /**
   * Discord accepte aujourd'hui des identifiants de 2 à 32 caractères, et
   * traîne encore l'ancienne forme « Nom#1234 ». On tolère les deux plutôt que
   * de refuser un candidat sur une règle de nommage qui n'est pas la nôtre.
   */
  pseudoDiscord: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9._-]{2,32}(#\d{4})?$/,
      'Pseudo Discord invalide : 2 à 32 caractères, sans espace.',
    ),

  age: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, 'Indique ton âge en chiffres.')
    .transform(Number)
    .refine((age) => age >= AGE_MINIMUM, {
      message: `Il faut avoir ${AGE_MINIMUM} ans ou plus pour rejoindre le staff.`,
    })
    .refine((age) => age <= AGE_MAXIMUM, { message: 'Cet âge ne semble pas sérieux.' }),

  /**
   * La case RGPD. Une case non cochée n'est pas envoyée par le navigateur : on
   * exige donc explicitement sa présence plutôt qu'une valeur particulière.
   */
  consentement: z.literal('on', {
    error: 'Tu dois accepter la conservation de tes réponses pour candidater.',
  }),
})

export type DonneesIdentite = z.infer<typeof schemaIdentite>
