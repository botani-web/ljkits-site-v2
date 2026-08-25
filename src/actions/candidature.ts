'use server'

/**
 * ⚠ AVEC creerCommande() ET connecter(), LA SEULE ACTION DE MUTATION DU PROJET
 * QUI N'APPELLE PAS exigerAdmin() : c'est un visiteur anonyme qui candidate.
 *
 * Ce qui la protège à la place, dans l'ordre où ça s'exécute :
 *
 *  1. L'interrupteur `recrutementOuvert`. Fermé, rien n'est lu ni écrit.
 *  2. Le champ piège (honeypot). Rempli, on répond « merci » sans rien
 *     enregistrer : un robot à qui on renvoie une erreur apprend et s'adapte,
 *     un robot à qui on dit merci repart satisfait.
 *  3. La validation zod de l'identité, puis celle des réponses — cette
 *     dernière CONSTRUITE À PARTIR DES QUESTIONS RELUES EN BASE. Le navigateur
 *     n'a aucune influence sur la liste des questions, leurs bornes ni leurs
 *     options.
 *  4. Un plafond de poids total avant toute écriture.
 *  5. La limitation de débit par IP et par pseudo.
 *  6. L'éligibilité du pseudo : carence de 30 jours, candidature déjà en
 *     cours, candidature déjà acceptée.
 *
 * L'ORDRE N'EST PAS ARBITRAIRE. La limitation de débit se CONSULTE tôt mais ne
 * s'INCRÉMENTE qu'une fois tout validé : sans ça, un candidat qui corrige cinq
 * fautes de frappe d'affilée épuiserait son quota de la journée et se
 * retrouverait bloqué par le formulaire qu'il essaie honnêtement de remplir.
 */
import { headers } from 'next/headers'

import type { EtatFormulaire } from '@/actions/etat'
import { envoyerCandidature as posterSurDiscord } from '@/lib/discord'
import { adresseDepuisEntetes, enregistrerTentative, verifierDebit, verifierEligibilite } from '@/lib/limite'
import { prisma } from '@/lib/prisma'
import { lireReglages } from '@/lib/reglages'
import {
  CHAMP_HONEYPOT,
  PLAFOND_ENVOI,
  TEXTE_CONSENTEMENT,
  construireSchemaReponses,
  extraireReponses,
  lireQuestionsActives,
  photographierReponses,
  poidsDesReponses,
  schemaIdentite,
} from '@/lib/recrutement'

/**
 * `numero` n'est renseigné qu'en cas de succès : c'est lui que le candidat
 * cite au staff, et sa présence fait basculer le formulaire sur son panneau
 * de confirmation.
 */
export type EtatCandidature = EtatFormulaire & { numero?: number }

/** Le remerciement, identique en cas de succès réel et de robot piégé. */
const MERCI = 'Candidature envoyée. Le staff la lira et te répondra sur Discord.'

export async function soumettreCandidature(
  _etatPrecedent: EtatCandidature,
  formData: FormData,
): Promise<EtatCandidature> {
  /* --- 1. le recrutement est-il ouvert ? --------------------------------- */
  const { recrutementOuvert } = await lireReglages()

  if (!recrutementOuvert) {
    return {
      erreur:
        'Le recrutement vient de fermer. Ta candidature n’a pas été enregistrée — surveille le Discord pour la prochaine ouverture.',
    }
  }

  /* --- 2. le champ piège ------------------------------------------------- */
  if (String(formData.get(CHAMP_HONEYPOT) ?? '').trim() !== '') {
    console.warn('[recrutement] champ piège rempli : envoi ignoré.')
    return { succes: MERCI }
  }

  /* --- 3. l'identité ----------------------------------------------------- */
  const identite = schemaIdentite.safeParse({
    pseudoMinecraft: String(formData.get('pseudoMinecraft') ?? ''),
    pseudoDiscord: String(formData.get('pseudoDiscord') ?? ''),
    age: String(formData.get('age') ?? ''),
    consentement: String(formData.get('consentement') ?? ''),
  })

  if (!identite.success) {
    return {
      erreur: 'Vérifie les champs signalés.',
      champs: identite.error.flatten().fieldErrors,
    }
  }

  const { pseudoMinecraft, pseudoDiscord, age } = identite.data

  /* --- 4. la limitation de débit, en LECTURE seule ----------------------- */
  const adresse = adresseDepuisEntetes(await headers())

  const debit = await verifierDebit(adresse, pseudoMinecraft)
  if (!debit.autorise) return { erreur: debit.message }

  /* --- 5. les réponses, validées d'après la BASE ------------------------- */
  const questions = await lireQuestionsActives()

  if (questions.length === 0) {
    return {
      erreur:
        'Le formulaire n’a aucune question active pour le moment. Préviens le staff sur Discord.',
    }
  }

  const reponses = extraireReponses(formData, questions)

  // Contrôlé avant zod : inutile de faire travailler la validation sur un
  // corps manifestement hostile.
  if (poidsDesReponses(reponses) > PLAFOND_ENVOI) {
    return { erreur: 'Ta candidature est trop longue. Raccourcis tes réponses.' }
  }

  const valide = construireSchemaReponses(questions).safeParse(reponses)

  if (!valide.success) {
    return {
      erreur: 'Vérifie les champs signalés.',
      champs: valide.error.flatten().fieldErrors,
    }
  }

  /* --- 6. à partir d'ici, la tentative compte ---------------------------- */
  await enregistrerTentative(adresse, pseudoMinecraft)

  const eligible = await verifierEligibilite(pseudoMinecraft)
  if (!eligible.autorise) return { erreur: eligible.message }

  /* --- 7. l'écriture ----------------------------------------------------- */
  const candidature = await prisma.candidature.create({
    data: {
      pseudoMinecraft,
      pseudoDiscord,
      age,
      consentementAt: new Date(),
      // Le texte est figé avec la candidature : le reformuler plus tard ne
      // réécrira pas ce à quoi ce candidat-ci a consenti.
      consentementTexte: TEXTE_CONSENTEMENT,
      reponses: { create: photographierReponses(questions, valide.data) },
    },
    select: { id: true, numero: true },
  })

  /* --- 8. Discord, APRÈS l'écriture et sans pouvoir la remettre en cause -- */
  await notifierDiscord(candidature.id)

  return { succes: MERCI, numero: candidature.numero }
}

/**
 * Poste la candidature sur Discord et note le résultat.
 *
 * Tout est avalé : la candidature est DÉJÀ en base quand cette fonction est
 * appelée, et rien de ce qui se passe ici ne doit pouvoir la remettre en
 * cause. Un échec laisse `webhookErreur` renseigné, l'admin l'affiche et
 * propose un renvoi.
 *
 * L'envoi est ATTENDU plutôt que lancé en arrière-plan : sur une fonction
 * serverless, une promesse non attendue peut être tuée à la fin de la requête
 * et le message ne partirait jamais.
 */
async function notifierDiscord(candidatureId: string): Promise<void> {
  try {
    const candidature = await prisma.candidature.findUnique({
      where: { id: candidatureId },
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
      where: { id: candidatureId },
      data: resultat.envoye
        ? { webhookEnvoyeAt: new Date(), webhookErreur: null }
        : { webhookErreur: resultat.erreur.slice(0, 500) },
    })
  } catch (erreur) {
    // Y compris si c'est la mise à jour du suivi qui échoue : la candidature
    // reste enregistrée, c'est tout ce qui compte.
    console.error('[recrutement] notification Discord impossible :', erreur)
  }
}
