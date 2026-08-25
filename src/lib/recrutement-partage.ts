/**
 * Ce que le NAVIGATEUR a le droit de voir du recrutement.
 *
 * Séparé de src/lib/recrutement.ts pour une raison mesurable : ce dernier
 * importe Prisma et zod. Un composant client qui y puiserait ne serait-ce
 * qu'une constante embarquerait les deux dans son bundle — 114 kB de code
 * serveur envoyés à chaque candidat, et un client Prisma instancié dans un
 * navigateur où il ne peut rien faire.
 *
 * RÈGLE DE CE FICHIER : aucun import de Prisma, de zod, ni de quoi que ce soit
 * qui touche la base. Des constantes, des types, et des fonctions pures.
 * `import type` uniquement pour les types Prisma — un import de valeur tirerait
 * tout le module généré avec lui.
 *
 * src/lib/recrutement.ts réexporte tout ce fichier : le code serveur n'a pas à
 * savoir que la séparation existe.
 */
import type { TypeQuestion } from '@prisma/client'

/* -------------------------------------------------------------------------- */
/* Liens                                                                      */
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

/* -------------------------------------------------------------------------- */
/* Règles métier                                                              */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Plafonds                                                                   */
/* -------------------------------------------------------------------------- */

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
/* Le questionnaire, tel que le formulaire le voit                            */
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

/**
 * Toutes les réponses circulent sous forme de CHAÎNES, quel que soit le type de
 * la question : "oui" / "non", "17", le libellé de l'option choisie. C'est
 * exactement la forme canonique stockée dans `ReponseCandidature.valeur`, et
 * c'est `typeFige` qui commandera le rendu plus tard.
 */
export type Reponses = Record<string, string>

/** Le nom du champ HTML d'une question. Le seul endroit qui décide de sa forme. */
export function champDeQuestion(questionId: string): string {
  return `q_${questionId}`
}

/** Le plafond de caractères réellement appliqué à une question de texte. */
export function plafondDe(question: { type: TypeQuestion; maximum: number | null }): number {
  const dur = question.type === 'TEXTE_LONG' ? PLAFOND_TEXTE_LONG : PLAFOND_TEXTE_COURT

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
