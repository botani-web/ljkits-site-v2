'use server'

/**
 * L'ENVOI D'UNE SUGGESTION (saison 2).
 *
 * Mutation SANS exigerAdmin(), comme l'avis : c'est un visiteur qui écrit.
 * Mêmes protections, dans le même ordre : champ piège, validation zod sur des
 * clés connues, limitation de débit par empreinte d'adresse.
 *
 * Pas de webhook ici : c'est le bot Discord qui relit la table et poste les
 * nouvelles suggestions dans le salon staff (botljk/suggestions.js). Une
 * suggestion n'est donc jamais perdue parce que Discord tousse.
 */
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import type { EtatFormulaire } from '@/actions/etat'
import { exigerAdmin } from '@/actions/garde'
import { adresseDepuisEntetes } from '@/lib/limite'
import { prisma } from '@/lib/prisma'
import {
  CHAMP_PIEGE_SUGGESTION,
  RAISONS_SUGGESTION,
  SUGGESTION_MAX,
  empreinteAdresse,
  schemaSuggestion,
  verifierDebitSuggestion,
} from '@/lib/suggestions'

const MERCI = 'merci'

export type EtatSuggestion = EtatFormulaire & { envoye?: boolean }

export async function envoyerSuggestion(
  _precedent: EtatSuggestion,
  formData: FormData,
): Promise<EtatSuggestion> {
  const langue = formData.get('langue') === 'en' ? 'en' : 'fr'

  /* --- 1. le champ piège ------------------------------------------------ */
  if (String(formData.get(CHAMP_PIEGE_SUGGESTION) ?? '').trim() !== '') {
    console.warn('[suggestion] champ piège rempli : envoi ignoré.')
    return { envoye: true, succes: MERCI }
  }

  /* --- 2. la validation -------------------------------------------------- */
  const message = String(formData.get('message') ?? '')
  if (message.length > SUGGESTION_MAX * 2) {
    return { erreur: langue === 'en' ? 'Your message is too long.' : 'Ton message est trop long.' }
  }

  const raisons = formData
    .getAll('raisons')
    .map(String)
    .filter((r): r is (typeof RAISONS_SUGGESTION)[number] =>
      (RAISONS_SUGGESTION as readonly string[]).includes(r),
    )

  const valide = schemaSuggestion.safeParse({
    categorie: String(formData.get('categorie') ?? ''),
    message,
    raisons,
    pseudo: String(formData.get('pseudo') ?? ''),
    discord: String(formData.get('discord') ?? ''),
    langue,
  })

  if (!valide.success) {
    return {
      erreur: langue === 'en' ? 'Check the highlighted fields.' : 'Vérifie les champs signalés.',
      champs: valide.error.flatten().fieldErrors,
    }
  }

  /* --- 3. la limitation de débit ---------------------------------------- */
  const adresse = adresseDepuisEntetes(await headers())
  const debit = await verifierDebitSuggestion(adresse, langue)
  if (!debit.autorise) {
    return { erreur: debit.message }
  }

  /* --- 4. l'écriture ----------------------------------------------------- */
  try {
    await prisma.suggestion.create({
      data: { ...valide.data, empreinte: empreinteAdresse(adresse) },
    })
  } catch (erreur) {
    console.error('[suggestion] écriture impossible :', erreur)
    return {
      erreur:
        langue === 'en'
          ? 'Couldn’t save your suggestion right now. Try again in a moment.'
          : 'Impossible d’enregistrer ta suggestion pour le moment. Réessaie dans un instant.',
    }
  }

  revalidatePath('/admin/suggestions')
  return { envoye: true, succes: MERCI }
}

/* -------------------------------------------------------------------------- */
/* Côté administration                                                        */
/* -------------------------------------------------------------------------- */

export async function basculerSuggestionTraitee(id: string) {
  await exigerAdmin()
  const s = await prisma.suggestion.findUnique({ where: { id }, select: { traiteAt: true } })
  if (!s) return
  await prisma.suggestion.update({
    where: { id },
    data: { traiteAt: s.traiteAt ? null : new Date() },
  })
  revalidatePath('/admin/suggestions')
}

export async function enregistrerNoteSuggestion(id: string, formData: FormData) {
  await exigerAdmin()
  const note = String(formData.get('note') ?? '').trim().slice(0, 2000)
  await prisma.suggestion.update({ where: { id }, data: { noteAdmin: note === '' ? null : note } })
  revalidatePath('/admin/suggestions')
}

/** Pour jeter un envoi de robot passé au travers. */
export async function supprimerSuggestion(id: string) {
  await exigerAdmin()
  await prisma.suggestion.delete({ where: { id } })
  revalidatePath('/admin/suggestions')
}
