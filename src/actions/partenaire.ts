'use server'

import { compare } from 'bcryptjs'
import { redirect } from 'next/navigation'

import type { EtatFormulaire } from '@/actions/etat'
import { estLocale, LANGUE_DEFAUT, lien, type Locale } from '@/lib/i18n'
import { lirePartenairePourConnexion } from '@/lib/partenaire'
import { fermerSessionPartenaire, ouvrirSessionPartenaire } from '@/lib/partenaire-session'
import { schemaAccesPartenaire } from '@/lib/validations'

/**
 * L'entree et la sortie d'un espace partenaire.
 *
 * ── AUCUNE ENUMERATION ────────────────────────────────────────────────────
 * Slug inconnu, partenaire desactive, mot de passe faux : UNE SEULE reponse,
 * la meme phrase. Et la page /partenaire/<slug> affiche le formulaire meme
 * pour un slug qui n'existe pas — repondre 404 reviendrait a publier la liste
 * des partenaires a qui saurait tester des adresses.
 *
 * Pour la meme raison, un slug inconnu passe quand meme par un `compare`
 * bcrypt sur un hash bidon : sans lui, la reponse reviendrait instantanement
 * et le temps de reponse trahirait l'existence du partenaire.
 */

/** Hash bidon (« aucun-partenaire », cout 10) : sert uniquement a perdre le meme temps. */
const HASH_LEURRE = '$2b$10$.oJyJO4ayZTXrtZLDthyq.jjK1yZ.It2VVnz1H9m4EJCrQl8ODQaK'

/* -------------------------------------------------------------------------- */
/* Garde-fou contre le bourrage de mots de passe                              */
/* -------------------------------------------------------------------------- */

/**
 * Un compteur EN MEMOIRE, par slug. Il ne survit ni a un redemarrage ni au
 * passage sur une autre instance serverless : ce n'est pas une protection
 * contre un adversaire determine, mais ca suffit a arreter un script qui
 * essaie mille mots de passe a la suite. Le prix a payer serait, sinon, une
 * table de plus en base pour trois lignes.
 */
const TENTATIVES_MAX = 10
const FENETRE_MS = 5 * 60 * 1_000
const tentatives = new Map<string, { nombre: number; depuis: number }>()

function tropDeTentatives(slug: string): boolean {
  const suivi = tentatives.get(slug)
  if (!suivi) return false
  if (Date.now() - suivi.depuis > FENETRE_MS) {
    tentatives.delete(slug)
    return false
  }
  return suivi.nombre >= TENTATIVES_MAX
}

function noterTentative(slug: string): void {
  const suivi = tentatives.get(slug)
  if (!suivi || Date.now() - suivi.depuis > FENETRE_MS) {
    tentatives.set(slug, { nombre: 1, depuis: Date.now() })
    return
  }
  suivi.nombre += 1
}

/* -------------------------------------------------------------------------- */

const REFUS: Record<Locale, string> = {
  fr: 'Identifiant ou mot de passe incorrect.',
  en: 'Wrong name or password.',
}

const ATTENDRE: Record<Locale, string> = {
  fr: 'Trop de tentatives. Réessaie dans quelques minutes.',
  en: 'Too many attempts. Try again in a few minutes.',
}

export async function entrerPartenaire(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const brut = String(formData.get('locale') ?? '')
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT

  const resultat = schemaAccesPartenaire.safeParse({
    slug: String(formData.get('slug') ?? '').toLowerCase(),
    motDePasse: String(formData.get('motDePasse') ?? ''),
  })

  // Meme un slug mal forme recoit la phrase generique : lui repondre « slug
  // invalide » apprendrait deja la forme des identifiants valides.
  if (!resultat.success) return { erreur: REFUS[locale] }

  const { slug, motDePasse } = resultat.data
  if (tropDeTentatives(slug)) return { erreur: ATTENDRE[locale] }

  const partenaire = await lirePartenairePourConnexion(slug)
  const valide = await compare(motDePasse, partenaire?.motDePasseHash ?? HASH_LEURRE)

  if (!partenaire || !partenaire.actif || !valide) {
    noterTentative(slug)
    return { erreur: REFUS[locale] }
  }

  tentatives.delete(slug)
  await ouvrirSessionPartenaire(slug)

  // redirect() leve une exception de navigation : rien ne doit la rattraper.
  redirect(lien(locale, `/partenaire/${slug}`))
}

/** Deconnexion. Appelee par le <form> du bandeau de la page. */
export async function sortirPartenaire(formData: FormData): Promise<void> {
  const brut = String(formData.get('locale') ?? '')
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const slug = String(formData.get('slug') ?? '')

  await fermerSessionPartenaire()
  redirect(lien(locale, `/partenaire/${slug}`))
}
