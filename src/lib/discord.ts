/**
 * Notification des candidatures dans un salon Discord privé, par webhook.
 *
 * Pas de SDK : src/lib/tebex.ts et src/lib/email.ts parlent déjà à leurs
 * services en HTTP direct, on garde la même façon de faire.
 *
 * RÈGLE ABSOLUE, la même que pour l'e-mail : un webhook qui échoue ne doit
 * JAMAIS faire échouer ce qui l'a déclenché. La candidature est écrite en base
 * AVANT que ce module soit appelé ; ici, tout est avalé et rendu sous forme de
 * résultat, jamais levé. Une candidature ne se perd pas parce que Discord
 * tousse.
 *
 * LE PROBLÈME PARTICULIER DE CE FICHIER : les questions sont administrables,
 * donc leur nombre et leur longueur sont inconnus au moment d'écrire ce code,
 * alors que Discord impose des limites fermes. D'où `repartirBudget()`, qui
 * décide quoi garder.
 *
 * L'admin appelle la MÊME fonction, sur deux simulations (cf. estimerBudget) :
 * au minimum configuré — un débordement là est une faute de configuration — et
 * à la somme des maximums, où un débordement est la normale dès qu'on a
 * quelques textes longs. Une seule implémentation : ces chiffres ne peuvent pas
 * mentir sur ce que fera l'envoi.
 */
import type { TypeQuestion } from '@prisma/client'

import { afficherValeur, lienFicheAdmin, type QuestionPubliee, plafondDe } from '@/lib/recrutement'

/* -------------------------------------------------------------------------- */
/* Les limites de Discord                                                     */
/* -------------------------------------------------------------------------- */

/** Champs par embed. */
const MAX_CHAMPS = 25
/** Caractères par nom de champ. */
const MAX_NOM = 256
/** Caractères par valeur de champ. Discord tolère 1024 ; on garde 24 de marge
 *  pour le marqueur de troncature « […] ». */
const MAX_VALEUR = 1_000

/**
 * Caractères pour TOUT le message (titres, champs, pied de page cumulés).
 *
 * Discord refuse à 6000. On travaille à 5500 : la marge couvre le titre, le
 * pied de page et les quatre champs d'en-tête, et surtout elle évite qu'un
 * calcul à un caractère près fasse échouer l'envoi d'une vraie candidature.
 *
 * À noter : répartir sur plusieurs embeds n'aiderait pas. La limite de 6000
 * porte sur le message entier, pas sur chaque embed — on gagnerait des
 * emplacements de champ, pas des caractères. La contrainte qui mord est
 * celle-ci.
 */
const BUDGET_TOTAL = 5_500

/** Les quatre champs d'en-tête (pseudo MC, Discord, âge, numéro). */
const CHAMPS_ENTETE = 4

/** L'orange de la marque, pour le liseré de l'embed. */
const COULEUR = 0xfe9301

/* -------------------------------------------------------------------------- */
/* Répartition du budget                                                      */
/* -------------------------------------------------------------------------- */

export type ChampEmbed = { name: string; value: string; inline?: boolean }

/** Une entrée candidate à l'embed, avant arbitrage. */
export type EntreeEmbed = { nom: string; valeur: string }

export type Repartition = {
  champs: ChampEmbed[]
  /** Entrées qui n'ont pas pu entrer du tout. */
  omises: string[]
  /** Entrées entrées, mais coupées. */
  tronquees: string[]
  /** Caractères consommés au total. */
  caracteres: number
}

/**
 * Décide ce qui entre dans l'embed et ce qui n'y entre pas.
 *
 * Premier arrivé, premier servi, dans l'ordre du formulaire — donc une question
 * en fin de questionnaire est la première sacrifiée, ce qui est le comportement
 * attendu : l'admin a rangé les questions par importance décroissante, ou peut
 * le faire avec les flèches ↑ ↓.
 *
 * Ne lève jamais. Quel que soit le nombre de questions, la sortie tient dans
 * les limites de Discord.
 *
 * @param deja Caractères déjà consommés par le titre, l'en-tête et le pied.
 */
export function repartirBudget(entrees: EntreeEmbed[], deja: number): Repartition {
  const champs: ChampEmbed[] = []
  const omises: string[] = []
  const tronquees: string[] = []

  let caracteres = deja
  let emplacements = MAX_CHAMPS - CHAMPS_ENTETE

  for (const entree of entrees) {
    const nom = couper(entree.nom, MAX_NOM)
    const valeurPleine = entree.valeur.trim() === '' ? '—' : entree.valeur

    // Plus de place, ou plus assez de budget pour un champ utile : tout ce qui
    // reste part dans la liste des omis.
    const restant = BUDGET_TOTAL - caracteres - nom.length
    if (emplacements <= 1 || restant < 40) {
      omises.push(entree.nom)
      continue
    }

    const permis = Math.min(MAX_VALEUR, restant)
    const valeur = couper(valeurPleine, permis)
    if (valeur.length < valeurPleine.length) tronquees.push(entree.nom)

    champs.push({ name: nom, value: valeur })
    caracteres += nom.length + valeur.length
    emplacements -= 1
  }

  // Le dernier emplacement est réservé à l'aveu : ce qui manque doit se voir.
  if (omises.length > 0) {
    champs.push({
      name: '⚠ Réponses non affichées',
      value:
        `${omises.length} réponse${omises.length > 1 ? 's' : ''} ne ` +
        `ten${omises.length > 1 ? 'aient' : 'ait'} pas dans ce message. ` +
        `La fiche complète est dans l’admin.`,
    })
  }

  return { champs, omises, tronquees, caracteres }
}

/** Coupe une chaîne en signalant la coupe. Jamais silencieuse. */
function couper(texte: string, limite: number): string {
  if (texte.length <= limite) return texte
  return `${texte.slice(0, Math.max(0, limite - 4)).trimEnd()} […]`
}

/* -------------------------------------------------------------------------- */
/* Les deux repères de l'admin                                                */
/* -------------------------------------------------------------------------- */

/**
 * LE PLANCHER : ce qu'une candidature pèse au MINIMUM, d'après les minimums
 * configurés sur chaque question.
 *
 * Rien n'est deviné ici — c'est le plus petit envoi qu'un candidat puisse
 * matériellement produire sans que le formulaire le refuse. Si même ce
 * plancher déborde, la configuration est en cause et l'alerte est justifiée.
 */
function longueurPlancher(question: QuestionPubliee): number {
  switch (question.type) {
    case 'TEXTE_COURT':
    case 'TEXTE_LONG':
      // Sans minimum : une question obligatoire vaut au moins un caractère,
      // une question facultative peut rester vide — le tiret qui s'affiche
      // alors en compte un aussi.
      return question.minimum ?? (question.obligatoire ? 1 : 0)
    case 'NOMBRE':
      return String(question.minimum ?? 0).length
    case 'OUI_NON':
      return 3
    case 'CHOIX_UNIQUE':
      // L'option la plus courte : c'est le plancher réel d'un choix.
      return question.options.reduce(
        (min, option) => Math.min(min, option.length),
        question.options[0]?.length ?? 1,
      )
  }
}

/**
 * LE PLAFOND : la somme des maximums réellement applicables.
 *
 * Pas de longueur « réaliste » inventée : on prend le plafond que le serveur
 * fera respecter, c'est-à-dire le maximum réglé, resserré par le plafond dur.
 */
function longueurPlafond(question: QuestionPubliee): number {
  switch (question.type) {
    case 'TEXTE_COURT':
    case 'TEXTE_LONG':
      return plafondDe(question)
    case 'NOMBRE':
      return String(question.maximum ?? 999_999_999).length
    case 'OUI_NON':
      return 3
    case 'CHOIX_UNIQUE':
      return question.options.reduce((max, option) => Math.max(max, option.length), 1)
  }
}

/** Un repère : ce que donnerait l'embed pour un poids de réponses donné. */
export type Repere = {
  caracteres: number
  /** Libellés qui n'entreraient pas du tout. */
  omises: string[]
  /** Libellés qui entreraient coupés. */
  tronquees: string[]
  /** Quelque chose ne passe pas. */
  deborde: boolean
}

export type EtatBudget = {
  questions: number
  /** Emplacements de champ disponibles pour les réponses. */
  emplacements: number
  /** Le plafond de caractères auquel les deux repères se comparent. */
  budget: number

  /**
   * Au minimum configuré. Un débordement ICI est un vrai problème de
   * configuration : l'admin doit le voir en rouge.
   */
  plancher: Repere

  /**
   * À la somme des maximums. Un débordement ici est la normale dès qu'on a
   * quelques questions de texte long — c'est un CONSTAT, pas un
   * avertissement, et jamais rouge : la troncature est prévue pour ça, et la
   * fiche admin reste complète.
   */
  plafond: Repere
}

/**
 * Les deux repères de /admin/recrutement.
 *
 * Passent tous les deux par `repartirBudget()`, la fonction que l'envoi réel
 * utilise : ces chiffres ne peuvent pas dériver du comportement effectif.
 */
export function estimerBudget(questions: QuestionPubliee[]): EtatBudget {
  // Un en-tête simulé au maximum de sa taille, pour qu'il ne soit jamais plus
  // léger que le vrai.
  const deja = poidsEntete('X'.repeat(16), 'X'.repeat(32), 99, 999_999)

  const mesurer = (longueur: (q: QuestionPubliee) => number): Repere => {
    const repartition = repartirBudget(
      questions.map((question) => ({
        nom: question.libelle,
        // Une valeur factice de la bonne LONGUEUR : seul son poids compte.
        valeur: 'x'.repeat(Math.max(1, longueur(question))),
      })),
      deja,
    )

    return {
      caracteres: repartition.caracteres,
      omises: repartition.omises,
      tronquees: repartition.tronquees,
      deborde: repartition.omises.length > 0 || repartition.tronquees.length > 0,
    }
  }

  return {
    questions: questions.length,
    emplacements: MAX_CHAMPS - CHAMPS_ENTETE,
    budget: BUDGET_TOTAL,
    plancher: mesurer(longueurPlancher),
    plafond: mesurer(longueurPlafond),
  }
}

/* -------------------------------------------------------------------------- */
/* Construction du message                                                    */
/* -------------------------------------------------------------------------- */

export type CandidaturePourDiscord = {
  id: string
  numero: number
  pseudoMinecraft: string
  pseudoDiscord: string
  age: number
  reponses: { libelleFige: string; typeFige: TypeQuestion; valeur: string; ordreFige: number }[]
}

/** Numéro lisible, comme les commandes : #000042. */
function numeroLisible(numero: number): string {
  return `#${String(numero).padStart(6, '0')}`
}

/** Le poids de tout ce qui n'est pas une réponse : titre, en-tête, pied. */
function poidsEntete(
  pseudoMinecraft: string,
  pseudoDiscord: string,
  age: number,
  numero: number,
): number {
  const titre = titreDe(pseudoMinecraft, numero)
  const entete = champsEntete(pseudoMinecraft, pseudoDiscord, age, numero)

  return (
    titre.length +
    PIED.length +
    entete.reduce((total, champ) => total + champ.name.length + champ.value.length, 0)
  )
}

const PIED = 'LJKITS — fiche complète et changement de statut dans l’admin'

function titreDe(pseudoMinecraft: string, numero: number): string {
  return couper(`Candidature ${numeroLisible(numero)} — ${pseudoMinecraft}`, MAX_NOM)
}

/**
 * Les quatre champs mis en évidence, toujours présents et toujours en premier.
 * Ce sont eux qui permettent au chef staff de prendre le relais sans ouvrir
 * l'admin : le pseudo à qui parler, sur quel Discord, et l'âge.
 */
function champsEntete(
  pseudoMinecraft: string,
  pseudoDiscord: string,
  age: number,
  numero: number,
): ChampEmbed[] {
  return [
    { name: 'Pseudo Minecraft', value: pseudoMinecraft, inline: true },
    { name: 'Pseudo Discord', value: pseudoDiscord, inline: true },
    { name: 'Âge', value: `${age} ans`, inline: true },
    { name: 'Candidature', value: numeroLisible(numero), inline: true },
  ]
}

/** Construit le corps JSON envoyé au webhook. Fonction pure, testable. */
export function construireMessage(candidature: CandidaturePourDiscord) {
  const { pseudoMinecraft, pseudoDiscord, age, numero } = candidature

  const entrees: EntreeEmbed[] = [...candidature.reponses]
    .sort((a, b) => a.ordreFige - b.ordreFige)
    .map((reponse) => ({
      nom: reponse.libelleFige,
      valeur: afficherValeur(reponse.valeur, reponse.typeFige),
    }))

  const { champs } = repartirBudget(
    entrees,
    poidsEntete(pseudoMinecraft, pseudoDiscord, age, numero),
  )

  return {
    embeds: [
      {
        title: titreDe(pseudoMinecraft, numero),
        // Le titre devient cliquable et mène droit à la fiche.
        url: lienFicheAdmin(candidature.id),
        color: COULEUR,
        fields: [
          ...champsEntete(pseudoMinecraft, pseudoDiscord, age, numero),
          ...champs,
        ],
        footer: { text: PIED },
        timestamp: new Date().toISOString(),
      },
    ],
    /**
     * SANS CECI, un candidat qui écrit « @everyone » dans sa motivation ping
     * tout le staff. Une liste vide neutralise toutes les mentions, quel que
     * soit le contenu des réponses.
     */
    allowed_mentions: { parse: [] as string[] },
  }
}

/* -------------------------------------------------------------------------- */
/* Envoi                                                                      */
/* -------------------------------------------------------------------------- */

export type ResultatEnvoi = { envoye: true } | { envoye: false; erreur: string }

/**
 * Poste la candidature dans le salon Discord.
 *
 * N'échoue jamais bruyamment : renvoie toujours un résultat, que l'appelant
 * enregistre sur la candidature (`webhookEnvoyeAt` / `webhookErreur`) pour que
 * l'admin puisse proposer un renvoi.
 */
/**
 * ⚠ PIÈGE À CONNAÎTRE AVANT DE TESTER CE MODULE.
 *
 * Neutraliser la variable en tête d'un script de test NE SUFFIT PAS :
 *
 *   delete process.env.DISCORD_WEBHOOK_RECRUTEMENT   // ne protège de rien
 *   const prisma = new PrismaClient()                // recharge .env
 *
 * `new PrismaClient()` charge le fichier .env de lui-même, ce qui REPOSE la
 * variable qu’on venait de supprimer. Le webhook part alors pour de bon —
 * c’est arrivé le 25 août 2026, une candidature de test a atterri dans le
 * vrai salon staff.
 *
 * Le même piège vaut pour toute variable d'environnement et tout module qui
 * charge .env à l’import : dotenv, Prisma, next/env.
 *
 * LA SEULE GARANTIE FIABLE EST DE NE PAS IMPORTER LE MODULE DU TOUT. Un test
 * qui ne doit rien envoyer n’importe pas src/lib/discord.ts, point. Pour
 * éprouver la mise en forme sans rien émettre, `construireMessage()` est pure
 * et se teste seule.
 */
export async function envoyerCandidature(
  candidature: CandidaturePourDiscord,
): Promise<ResultatEnvoi> {
  const url = process.env.DISCORD_WEBHOOK_RECRUTEMENT?.trim()

  if (!url) {
    console.warn('[discord] DISCORD_WEBHOOK_RECRUTEMENT absente : envoi ignoré.')
    return { envoye: false, erreur: 'Webhook Discord non configuré.' }
  }

  try {
    const reponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(construireMessage(candidature)),
      // Discord lent ne doit pas faire patienter le candidat devant sa page.
      signal: AbortSignal.timeout(5_000),
    })

    if (!reponse.ok) {
      // Le corps de la réponse dit précisément ce que Discord a refusé
      // (limite dépassée, webhook supprimé…) : on le garde pour l'admin.
      const corps = await reponse.text().catch(() => '')
      const erreur = `Discord a répondu ${reponse.status}. ${corps.slice(0, 300)}`.trim()
      console.error(`[discord] ${erreur}`)
      return { envoye: false, erreur }
    }

    return { envoye: true }
  } catch (erreur) {
    const message =
      erreur instanceof Error ? erreur.message : 'Erreur inconnue à l’appel du webhook.'
    console.error('[discord] envoi impossible :', erreur)
    return { envoye: false, erreur: message }
  }
}
