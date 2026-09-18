'use server'

import { compare } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { EtatFormulaire } from '@/actions/etat'
import { estLocale, LANGUE_DEFAUT, lien, type Locale } from '@/lib/i18n'
import { lirePartenaire, lirePartenairePourConnexion } from '@/lib/partenaire'
import { prisma } from '@/lib/prisma'
import { fermerSessionPartenaire, ouvrirSessionPartenaire, sessionOuvertePour } from '@/lib/partenaire-session'
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

/* -------------------------------------------------------------------------- */
/* « J'ai été payé cette semaine »                                            */
/* -------------------------------------------------------------------------- */

const PAIEMENT_OK: Record<Locale, string> = {
  fr: 'Versement enregistré. Le compteur repart de zéro — tes joueurs, eux, restent tous dans l’historique.',
  en: 'Payment recorded. The counter starts from zero again — all your players stay in the history.',
}

const PAIEMENT_RIEN: Record<Locale, string> = {
  fr: 'Rien à encaisser pour l’instant : aucun nouveau joueur depuis ton dernier versement.',
  en: 'Nothing to settle yet: no new player since your last payment.',
}

const PAIEMENT_REFUS: Record<Locale, string> = {
  fr: 'Impossible d’enregistrer ce versement. Réessaie, et préviens le staff si ça recommence.',
  en: 'Could not record that payment. Try again, and tell the staff if it happens twice.',
}

/**
 * LE PARTENAIRE CONFIRME AVOIR ETE PAYE.
 *
 * Ce que ca fait vraiment : une ligne de plus dans `paiement_partenaire`, qui
 * FIGE la periode reglee, le nombre de joueurs et le montant. Le compteur de
 * la page repart de zero parce qu'il ne regarde plus que les joueurs arrives
 * apres cette borne. AUCUN joueur n'est supprime, aucune statistique n'est
 * effacee : c'est un journal comptable, pas un bouton « remise a plat ».
 *
 * ── LE MONTANT NE VIENT JAMAIS DU NAVIGATEUR ──────────────────────────────
 * Le formulaire ne poste que le slug et la langue. Le nombre de joueurs et le
 * montant sont recomptes ICI, en une seule requete SQL : un partenaire ne
 * peut pas se payer en trafiquant un champ cache.
 *
 * ── UN SEUL VERSEMENT PAR CLIC ────────────────────────────────────────────
 * `where n > 0` arrete un second clic a vide, et l'index unique
 * (slug, debut) arrete deux clics vraiment simultanes. On ne se repose pas
 * sur un verrou applicatif, qui ne survivrait pas a deux instances Vercel.
 */
export async function confirmerPaiementPartenaire(
  _etatPrecedent: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const brut = String(formData.get('locale') ?? '')
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const slug = String(formData.get('slug') ?? '').toLowerCase()

  // La session, et rien d'autre : personne ne confirme un versement a la
  // place d'un partenaire, meme en connaissant son slug.
  if (!slug || !(await sessionOuvertePour(slug))) return { erreur: REFUS[locale] }

  const partenaire = await lirePartenaire(slug)
  if (!partenaire || !partenaire.actif) return { erreur: REFUS[locale] }

  let lignes: { joueurs: number; montantCentimes: number }[]
  try {
    lignes = await prisma.$queryRawUnsafe<{ joueurs: number; montantCentimes: number }[]>(
      `with p as (
         select slug, hote, taux_centimes, cree_le from partenaire where slug = $1 and actif
       ),
       borne as (
         select coalesce(
                  (select max(fin) from paiement_partenaire where slug = p.slug),
                  least(p.cree_le, (select min(premiere_connexion) from joueur_source where hote = p.hote))
                ) as debut
           from p
       ),
       compte as (
         select (select count(*)::int
                   from joueur_source j
                  where j.hote = p.hote
                    and j.premiere_connexion >= borne.debut
                    and j.premiere_connexion < now()) as n
           from p, borne
       )
       insert into paiement_partenaire (slug, debut, fin, joueurs, taux_centimes, montant_centimes)
       select p.slug, borne.debut, now(), compte.n, p.taux_centimes, compte.n * p.taux_centimes
         from p, borne, compte
        where compte.n > 0
       returning joueurs, montant_centimes as "montantCentimes"`,
      slug,
    )
  } catch {
    // Violation d'unicite (double clic) ou base injoignable : meme reponse,
    // et surtout aucun detail technique a l'ecran d'un partenaire.
    return { erreur: PAIEMENT_REFUS[locale] }
  }

  if (lignes.length === 0) return { erreur: PAIEMENT_RIEN[locale] }

  revalidatePath(lien(locale, `/partenaire/${slug}`))
  return { succes: PAIEMENT_OK[locale] }
}

/** Deconnexion. Appelee par le <form> du bandeau de la page. */
export async function sortirPartenaire(formData: FormData): Promise<void> {
  const brut = String(formData.get('locale') ?? '')
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const slug = String(formData.get('slug') ?? '')

  await fermerSessionPartenaire()
  redirect(lien(locale, `/partenaire/${slug}`))
}
