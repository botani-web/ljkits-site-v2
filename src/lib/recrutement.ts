/**
 * Le cœur du recrutement staff : lire le questionnaire en base, et en déduire
 * la validation du formulaire public.
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
import { TypeQuestion } from '@prisma/client'

import { prisma } from '@/lib/prisma'

/* -------------------------------------------------------------------------- */
/* Constantes                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * URL canonique, avec www, écrite en dur ICI et nulle part ailleurs.
 *
 * TODO (après l'ouverture du serveur) : basculer NEXT_PUBLIC_SITE_URL sur
 * « https://www.ljkits.eu » et remplacer cette constante par SITE.url. Ce n'est
 * pas fait tout de suite parce que SITE.url alimente les métadonnées Open Graph
 * de TOUT le site, et que des liens sont partagés en ce moment même : on ne
 * touche pas aux OG cette semaine pour un lien de recrutement.
 */
const URL_CANONIQUE = 'https://www.ljkits.eu'

/** Le lien à partager quand le recrutement ouvre. Affiché dans l'admin. */
export const LIEN_FORMULAIRE = `${URL_CANONIQUE}/recrutement`

/** Lien direct vers la fiche d'une candidature, mis dans l'embed Discord. */
export function lienFicheAdmin(candidatureId: string): string {
  return `${URL_CANONIQUE}/admin/recrutement/${candidatureId}`
}

/** Âge minimum pour candidater. Règle métier, donc en dur côté serveur. */
export const AGE_MINIMUM = 16
/** Garde-fou de saisie : au-delà, c'est une faute de frappe ou une blague. */
export const AGE_MAXIMUM = 99

/** Délai de carence après un REFUS, en jours. */
export const CARENCE_JOURS = 30

/** Durée de conservation d'une candidature, en mois. Annoncée au candidat. */
export const CONSERVATION_MOIS = 6

/**
 * Le texte du consentement RGPD.
 *
 * Il est FIGÉ dans chaque candidature (`Candidature.consentementTexte`), pas
 * seulement daté : si cette phrase est reformulée un jour, on saura toujours à
 * quoi chacun a consenti. Le modifier ici n'a donc aucun effet rétroactif.
 */
export const TEXTE_CONSENTEMENT =
  `J'accepte que mes réponses soient enregistrées et lues par l'équipe de ` +
  `LJKITS pour l'examen de ma candidature. Elles sont conservées ` +
  `${CONSERVATION_MOIS} mois, puis supprimées automatiquement. Je peux ` +
  `demander leur suppression à tout moment sur le Discord du serveur.`

/**
 * Plafonds DURS appliqués par champ, quoi qu'ait réglé l'admin.
 *
 * `maximum` sur une question est un confort de mise en forme ; ceci est la
 * limite de sécurité. Une question sans `maximum` reste bornée, sinon un envoi
 * unique pourrait pousser plusieurs mégaoctets de texte en base.
 */
export const PLAFOND_TEXTE_COURT = 300
export const PLAFOND_TEXTE_LONG = 5_000

/**
 * Poids total toléré pour l'ensemble des réponses d'un envoi, en caractères.
 * Vérifié AVANT toute validation : inutile de faire travailler zod sur un corps
 * manifestement hostile.
 */
export const PLAFOND_ENVOI = 100_000

/** Le champ piège. Rempli = c'est un robot (cf. actions/candidature.ts). */
export const CHAMP_HONEYPOT = 'site_web'

/* -------------------------------------------------------------------------- */
/* Lecture du questionnaire                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Une question telle que le formulaire public la voit : aplatie, avec le nom
 * de sa section et son RANG ABSOLU dans le formulaire (0, 1, 2… toutes
 * sections confondues). C'est ce rang qui est figé dans les réponses.
 */
export type QuestionPubliee = {
  id: string
  libelle: string
  aide: string | null
  type: TypeQuestion
  options: string[]
  obligatoire: boolean
  minimum: number | null
  maximum: number | null
  section: string
  rang: number
}

/** Le nom du champ HTML d'une question. Le seul endroit qui décide de sa forme. */
export function champDeQuestion(questionId: string): string {
  return `q_${questionId}`
}

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
/* Bornes effectives                                                          */
/* -------------------------------------------------------------------------- */

/** Le plafond de caractères réellement appliqué à une question de texte. */
export function plafondDe(question: {
  type: TypeQuestion
  maximum: number | null
}): number {
  const dur =
    question.type === 'TEXTE_LONG' ? PLAFOND_TEXTE_LONG : PLAFOND_TEXTE_COURT

  // Le réglage de l'admin ne peut que RESSERRER le plafond dur, jamais l'ouvrir.
  return question.maximum === null ? dur : Math.min(question.maximum, dur)
}

/** Libellé du type, pour l'admin. Sert aussi à étiqueter minimum/maximum. */
export function libelleType(type: TypeQuestion): string {
  switch (type) {
    case 'TEXTE_COURT':
      return 'Texte court'
    case 'TEXTE_LONG':
      return 'Texte long'
    case 'NOMBRE':
      return 'Nombre'
    case 'OUI_NON':
      return 'Oui / Non'
    case 'CHOIX_UNIQUE':
      return 'Choix unique'
  }
}

/**
 * Ce que mesurent `minimum` et `maximum` pour un type donné.
 *
 * L'admin ne doit JAMAIS afficher ces deux champs nus : « Minimum » tout seul
 * ne dit pas si on parle de caractères ou de valeur. C'est cette fonction qui
 * fournit l'unité, et `null` signifie « ces bornes ne servent pas ici ».
 */
export function uniteDesBornes(type: TypeQuestion): 'caractères' | 'valeur' | null {
  switch (type) {
    case 'TEXTE_COURT':
    case 'TEXTE_LONG':
      return 'caractères'
    case 'NOMBRE':
      return 'valeur'
    case 'OUI_NON':
    case 'CHOIX_UNIQUE':
      return null
  }
}

/* -------------------------------------------------------------------------- */
/* Le schéma zod, construit depuis la base                                    */
/* -------------------------------------------------------------------------- */

/**
 * Toutes les réponses sortent du schéma sous forme de CHAÎNES, quel que soit le
 * type de la question : "oui" / "non", "17", le libellé de l'option choisie.
 * C'est exactement la forme canonique stockée dans `ReponseCandidature.valeur`,
 * et c'est `typeFige` qui commandera le rendu plus tard.
 */
export type Reponses = Record<string, string>

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

/* -------------------------------------------------------------------------- */
/* Affichage                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Met en forme une réponse figée pour la lecture, d'après son TYPE FIGÉ.
 *
 * On ne relit jamais la question d'origine : elle a pu être renommée, retypée
 * ou supprimée depuis. Tout ce dont l'affichage a besoin est dans la ligne.
 */
export function afficherValeur(valeur: string, type: TypeQuestion): string {
  if (valeur.trim() === '') return 'Non renseigné'

  if (type === 'OUI_NON') return valeur === 'oui' ? 'Oui' : 'Non'

  return valeur
}
