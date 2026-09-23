'use server'

/**
 * L'ENVOI D'UN AVIS.
 *
 * ⚠ Comme la candidature et la commande, c'est une mutation SANS exigerAdmin() :
 * c'est un visiteur anonyme qui écrit, et c'est le but. Ce qui la protège, dans
 * l'ordre d'exécution :
 *
 *   1. le champ piège (honeypot) — rempli, on répond « merci » sans rien
 *      écrire : un robot à qui on renvoie une erreur s'adapte, un robot
 *      remercié repart satisfait ;
 *   2. la validation zod, qui n'accepte QUE les clés de réponse connues ;
 *   3. la limitation de débit par empreinte d'adresse, consultée avant
 *      l'écriture — un avis par minute, trois par jour.
 *
 * Aucune notification Discord ici : un avis n'a pas besoin d'être traité dans
 * la minute, et un webhook qui tombe ne doit pas faire perdre le texte de
 * quelqu'un. L'administration les relit dans /admin/avis.
 */
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import type { EtatFormulaire } from '@/actions/etat'
import { exigerAdmin } from '@/actions/garde'
import {
  CHAMP_PIEGE,
  FREINS,
  MESSAGE_MAX,
  empreinteAdresse,
  schemaAvis,
  verifierDebitAvis,
} from '@/lib/avis'
import { adresseDepuisEntetes } from '@/lib/limite'
import { prisma } from '@/lib/prisma'

/** Le même remerciement pour un envoi réel et pour un robot piégé. */
const MERCI = 'merci'

export type EtatAvis = EtatFormulaire & { envoye?: boolean }

export async function envoyerAvis(_precedent: EtatAvis, formData: FormData): Promise<EtatAvis> {
  /* --- 1. le champ piège ------------------------------------------------ */
  if (String(formData.get(CHAMP_PIEGE) ?? '').trim() !== '') {
    console.warn('[avis] champ piège rempli : envoi ignoré.')
    return { envoye: true, succes: MERCI }
  }

  /* --- 2. la validation -------------------------------------------------- */
  const freinsRecus = formData
    .getAll('freins')
    .map(String)
    .filter((f): f is (typeof FREINS)[number] => (FREINS as readonly string[]).includes(f))

  const message = String(formData.get('message') ?? '')
  // Contrôlé avant zod : inutile de faire travailler la validation sur un
  // corps manifestement hostile.
  if (message.length > MESSAGE_MAX * 2) {
    return { erreur: 'Ton message est trop long.' }
  }

  const valide = schemaAvis.safeParse({
    pseudo: String(formData.get('pseudo') ?? ''),
    note: String(formData.get('note') ?? ''),
    priorite: String(formData.get('priorite') ?? ''),
    freins: freinsRecus,
    cashprize: String(formData.get('cashprize') ?? ''),
    message,
    langue: String(formData.get('langue') ?? 'fr'),
  })

  if (!valide.success) {
    return {
      erreur: 'Vérifie les champs signalés.',
      champs: valide.error.flatten().fieldErrors,
    }
  }

  /* --- 3. la limitation de débit ---------------------------------------- */
  const adresse = adresseDepuisEntetes(await headers())
  const debit = await verifierDebitAvis(adresse)
  if (!debit.autorise) {
    return { erreur: debit.message }
  }

  /* --- 4. l'écriture ----------------------------------------------------- */
  try {
    await prisma.avis.create({
      data: { ...valide.data, empreinte: empreinteAdresse(adresse) },
    })
  } catch (erreur) {
    console.error('[avis] écriture impossible :', erreur)
    return {
      erreur: 'Impossible d’enregistrer ton avis pour le moment. Réessaie dans un instant.',
    }
  }

  revalidatePath('/admin/avis')
  return { envoye: true, succes: MERCI }
}

/* -------------------------------------------------------------------------- */
/* Côté administration                                                        */
/* -------------------------------------------------------------------------- */

/** Marque un avis comme traité, ou le remet à lire. */
export async function basculerTraite(id: string) {
  await exigerAdmin()
  const avis = await prisma.avis.findUnique({ where: { id }, select: { traiteAt: true } })
  if (!avis) return
  await prisma.avis.update({
    where: { id },
    data: { traiteAt: avis.traiteAt ? null : new Date() },
  })
  revalidatePath('/admin/avis')
}

/**
 * Supprime un avis. Pas de corbeille ici, contrairement aux candidatures :
 * un avis ne porte ni consentement figé ni décision de staff, et le seul
 * usage réel est de jeter un envoi de robot passé au travers.
 */
export async function supprimerAvis(id: string) {
  await exigerAdmin()
  await prisma.avis.delete({ where: { id } })
  revalidatePath('/admin/avis')
}
