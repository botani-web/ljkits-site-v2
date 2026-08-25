/**
 * Qui a le droit d'envoyer une candidature, maintenant.
 *
 * Deux familles de règles, volontairement dans le même fichier parce qu'elles
 * répondent à la même question et produisent le même genre de refus :
 *
 *   — la LIMITATION DE DÉBIT, comptée dans `TentativeRecrutement` : elle vise
 *     les robots et les rechargements en boucle ;
 *   — l'ÉLIGIBILITÉ du pseudo, lue dans `Candidature` : délai de carence après
 *     un refus, candidature déjà en cours, candidature déjà acceptée.
 *
 * Toutes rendent un refus PROPRE, avec une phrase montrable au candidat. Un
 * formulaire de recrutement qui répond « erreur 500 » à quelqu'un qui a passé
 * vingt minutes à le remplir est une insulte.
 *
 * AUCUNE ADRESSE IP N'EST STOCKÉE EN CLAIR. Ce qui part en base est un
 * SHA-256 de l'adresse salée par AUTH_SECRET : suffisant pour reconnaître deux
 * envois de la même source, inutilisable pour retrouver la source.
 *
 * ⚠ CONSÉQUENCE ASSUMÉE : LES EMPREINTES DÉPENDENT D'AUTH_SECRET.
 *
 * Régénérer AUTH_SECRET (rotation, incident, nouveau projet Vercel) change le
 * sel, donc toutes les empreintes déjà en base. Elles ne correspondront plus à
 * rien : les compteurs PAR IP repartent à zéro, et les lignes anciennes
 * deviennent du bruit jusqu’à leur purge à 7 jours. Concrètement, quelqu’un
 * qui était bloqué pour la journée redevient libre d’envoyer.
 *
 * C'est le prix à payer pour ne conserver aucune adresse en clair, et c'est un
 * prix acceptable : ce compteur protège d’un flot de robots, pas d’un
 * adversaire déterminé. Ce n’est donc pas un bug, c’est un choix — écrit ici
 * pour que la remise à zéro des compteurs ne soit une surprise pour personne.
 *
 * LA CARENCE PAR PSEUDO N’EST PAS AFFECTÉE. Elle ne lit aucune empreinte :
 * elle interroge directement la table Candidature (cf. verifierEligibilite()
 * plus bas). Un candidat refusé reste sous ses 30 jours quoi qu’il arrive au
 * secret.
 */
import { createHash } from 'node:crypto'

import { prisma } from '@/lib/prisma'
import { CARENCE_JOURS } from '@/lib/recrutement'

/* -------------------------------------------------------------------------- */
/* Les valeurs                                                                */
/* -------------------------------------------------------------------------- */

/** Anti double-clic et anti-boucle serrée. */
const IP_FENETRE_COURTE_MS = 60_000
const IP_MAX_COURT = 1

/**
 * Par IP et par jour. Volontairement large : derrière un NAT scolaire ou un
 * partage de connexion mobile, plusieurs candidats légitimes sortent par la
 * même adresse. Serrer davantage refuserait de vraies candidatures.
 */
const IP_FENETRE_LONGUE_MS = 24 * 60 * 60 * 1_000
const IP_MAX_LONG = 5

/** Même garde courte pour le pseudo : le candidat en 4G change d'IP entre
 *  deux clics, l'anti double-clic par IP le manquerait. */
const PSEUDO_FENETRE_COURTE_MS = 60_000
const PSEUDO_MAX_COURT = 1

/**
 * Garde-fou global : un plafond de tentatives toutes sources confondues, pour
 * qu'une attaque distribuée (chaque requête d'une IP différente) ne puisse pas
 * remplir la base. Au-delà, le formulaire répond « réessaie plus tard » à tout
 * le monde — c'est brutal, mais c'est un plafond qu'un afflux normal n'atteint
 * jamais : une ouverture de recrutement, c'est quelques dizaines d'envois.
 */
const GLOBAL_FENETRE_MS = 60 * 60 * 1_000
const GLOBAL_MAX = 60

/** Au-delà, plus aucune fenêtre ne s'en sert : le cron purge. */
export const TENTATIVES_RETENTION_JOURS = 7

/* -------------------------------------------------------------------------- */
/* Empreintes                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * L'adresse de l'appelant, lue dans les en-têtes posés par Vercel.
 *
 * `x-forwarded-for` peut contenir une chaîne de relais : la PREMIÈRE entrée est
 * le client d'origine. Elle est falsifiable en théorie ; sur Vercel, la
 * plateforme réécrit l'en-tête, ce qui la rend fiable en pratique. Et de toute
 * façon, elle n'est ici qu'un compteur, jamais une autorisation.
 */
export function adresseDepuisEntetes(entetes: Headers): string {
  const transmise = entetes.get('x-forwarded-for')
  if (transmise) {
    const premiere = transmise.split(',')[0]?.trim()
    if (premiere) return premiere
  }

  return entetes.get('x-real-ip')?.trim() || 'inconnue'
}

/**
 * L'empreinte stockée. Salée par AUTH_SECRET pour qu'un vol de base ne
 * permette pas de retrouver les adresses par simple table arc-en-ciel — un
 * SHA-256 d'IPv4 non salé se casse en quelques secondes.
 */
function empreinteIp(adresse: string): string {
  const sel = process.env.AUTH_SECRET ?? ''
  return `ip:${createHash('sha256').update(`${adresse}${sel}`).digest('hex')}`
}

/** Les pseudos Minecraft ne sont pas sensibles à la casse en pratique. */
function empreintePseudo(pseudo: string): string {
  return `pseudo:${pseudo.toLowerCase()}`
}

/* -------------------------------------------------------------------------- */
/* Comptage                                                                   */
/* -------------------------------------------------------------------------- */

function depuis(millisecondes: number): Date {
  return new Date(Date.now() - millisecondes)
}

async function compter(empreinte: string, fenetreMs: number): Promise<number> {
  return prisma.tentativeRecrutement.count({
    where: { empreinte, createdAt: { gte: depuis(fenetreMs) } },
  })
}

/**
 * Enregistre une tentative — ACCEPTÉE OU REFUSÉE.
 *
 * C'est le point important : une tentative rejetée compte aussi, sinon un
 * script refusé pourrait réessayer sans fin sans jamais faire monter le
 * compteur.
 */
export async function enregistrerTentative(adresse: string, pseudo: string): Promise<void> {
  try {
    await prisma.tentativeRecrutement.createMany({
      data: [{ empreinte: empreinteIp(adresse) }, { empreinte: empreintePseudo(pseudo) }],
    })
  } catch (erreur) {
    // Un compteur qui n'a pas pu s'incrémenter ne doit pas faire perdre une
    // candidature. On journalise et on continue.
    console.error('[limite] tentative non enregistrée :', erreur)
  }
}

/* -------------------------------------------------------------------------- */
/* Verdict                                                                    */
/* -------------------------------------------------------------------------- */

export type Verdict = { autorise: true } | { autorise: false; message: string }

const AUTORISE: Verdict = { autorise: true }

/**
 * La limitation de débit. Appelée AVANT toute écriture, et avant même de
 * valider le formulaire : inutile de faire travailler la base pour un robot.
 */
export async function verifierDebit(adresse: string, pseudo: string): Promise<Verdict> {
  const ip = empreinteIp(adresse)

  // Le compteur global se lit sur toutes les empreintes d'IP : une par
  // tentative, quelle que soit la source.
  const global = await prisma.tentativeRecrutement.count({
    where: {
      empreinte: { startsWith: 'ip:' },
      createdAt: { gte: depuis(GLOBAL_FENETRE_MS) },
    },
  })

  if (global >= GLOBAL_MAX) {
    return {
      autorise: false,
      message:
        'Le formulaire reçoit beaucoup d’envois en ce moment. Réessaie dans quelques minutes — ta candidature n’est pas perdue, rien n’a été envoyé.',
    }
  }

  if ((await compter(ip, IP_FENETRE_COURTE_MS)) >= IP_MAX_COURT) {
    return {
      autorise: false,
      message: 'Tu viens d’envoyer une candidature. Patiente une minute avant de réessayer.',
    }
  }

  if ((await compter(ip, IP_FENETRE_LONGUE_MS)) >= IP_MAX_LONG) {
    return {
      autorise: false,
      message: 'Trop d’envois depuis cette connexion aujourd’hui. Réessaie demain.',
    }
  }

  if ((await compter(empreintePseudo(pseudo), PSEUDO_FENETRE_COURTE_MS)) >= PSEUDO_MAX_COURT) {
    return {
      autorise: false,
      message: 'Une candidature vient d’être envoyée avec ce pseudo. Patiente une minute.',
    }
  }

  return AUTORISE
}

/**
 * L'éligibilité du pseudo : carence, candidature en cours, déjà acceptée.
 *
 * ⚠ CETTE REQUÊTE IGNORE VOLONTAIREMENT LA CORBEILLE (`supprimeeAt`).
 * Une candidature refusée puis mise à la corbeille par le staff doit continuer
 * à faire courir les 30 jours : sinon, ranger sa boîte de réception rouvrirait
 * silencieusement la porte au candidat refusé la veille. C'est la seule lecture
 * du projet qui regarde les candidatures supprimées — et c'est délibéré.
 */
export async function verifierEligibilite(pseudo: string): Promise<Verdict> {
  const derniere = await prisma.candidature.findFirst({
    where: { pseudoMinecraft: { equals: pseudo, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
    select: { statut: true, decideeAt: true, createdAt: true },
  })

  if (!derniere) return AUTORISE

  if (derniere.statut === 'EN_ATTENTE') {
    return {
      autorise: false,
      message:
        'Une candidature est déjà en cours d’examen pour ce pseudo. Laisse-nous le temps de la lire — inutile d’en renvoyer une.',
    }
  }

  if (derniere.statut === 'ACCEPTEE') {
    return {
      autorise: false,
      message:
        'Cette candidature a déjà été acceptée. Rapproche-toi du chef staff sur le Discord.',
    }
  }

  // REFUSEE : le délai court depuis la DÉCISION, pas depuis l'envoi.
  const decision = derniere.decideeAt ?? derniere.createdAt
  const finDeCarence = new Date(decision.getTime() + CARENCE_JOURS * 24 * 60 * 60 * 1_000)
  const restant = Math.ceil((finDeCarence.getTime() - Date.now()) / (24 * 60 * 60 * 1_000))

  if (restant > 0) {
    return {
      autorise: false,
      message:
        `Ta précédente candidature a été refusée. Tu pourras en renvoyer une dans ` +
        `${restant} jour${restant > 1 ? 's' : ''}. Profites-en pour jouer, ` +
        `ça compte plus que le formulaire.`,
    }
  }

  return AUTORISE
}
