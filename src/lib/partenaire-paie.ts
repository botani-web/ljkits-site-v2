import type { Partenaire } from '@/lib/partenaire'
import { prisma } from '@/lib/prisma'

/**
 * CE QU'ON DOIT A UN PARTENAIRE (18/09/2026).
 *
 * ── LA REGLE, EN UNE PHRASE ───────────────────────────────────────────────
 * Un partenaire touche `taux_centimes` par NOUVEAU joueur amene — 0,25 € chez
 * Sixela. Ni les connexions, ni le temps de jeu, ni les habitues revenus par
 * son adresse n'entrent dans le calcul : seulement des joueurs dont la toute
 * premiere venue au serveur est passee par lui.
 *
 * ── « REMETTRE A ZERO » NE SUPPRIME RIEN ──────────────────────────────────
 * Quand le partenaire confirme avoir ete paye, on ecrit une ligne dans
 * `paiement_partenaire` : periode reglee, nombre de joueurs FIGE, taux,
 * montant. Le compteur repart de zero parce qu'il ne compte plus que les
 * joueurs arrives APRES cette borne. `joueur_source` n'est jamais touchee :
 * les joueurs restent tous la, et l'historique reste relisible des mois plus
 * tard. C'est un journal comptable, pas un solde qu'on remet a plat.
 *
 * ── TOUT EN CENTIMES ──────────────────────────────────────────────────────
 * Aucun flottant nulle part : 0,1 + 0,2 ne fait pas 0,3 en binaire, et une
 * paie n'a pas le droit a l'arrondi silencieux. Les euros n'apparaissent
 * qu'au dernier moment, a l'affichage.
 *
 * ── LE MONTANT VIENT TOUJOURS DE LA BASE ──────────────────────────────────
 * Le navigateur ne poste jamais un nombre de joueurs ni un montant : la
 * Server Action recompte elle-meme en SQL. Un partenaire ne peut donc pas se
 * payer en bidouillant un formulaire.
 */

/** Combien de semaines le tableau recapitulatif remonte. */
export const SEMAINES_AFFICHEES = 12

/** Au plus autant de versements dans l'historique affiche. */
export const PAIEMENTS_AFFICHES = 24

export type Paiement = {
  id: number
  debut: Date
  fin: Date
  joueurs: number
  tauxCentimes: number
  montantCentimes: number
  confirmeLe: Date
}

export type Remuneration = {
  /** Les joueurs amenes depuis la derniere borne : ce qui reste a encaisser. */
  joueurs: number
  /**
   * Les comptes ecartes sur la meme periode : une MEME personne revenue avec un
   * deuxieme ou un troisieme compte. Ils ne sont pas payes — on paie une
   * personne, pas un compte — mais ils sont affiches, parce qu'un compteur qui
   * baisse sans explication se lit comme une erreur.
   */
  doublons: number
  montantCentimes: number
  tauxCentimes: number
  /** Le debut de la periode en cours (fin du dernier versement, ou l'origine). */
  depuis: Date
  /** Le dernier versement confirme, s'il y en a un. */
  dernier: Paiement | null
  /** L'historique affiche, du plus recent au plus ancien. */
  paiements: Paiement[]
  /** Depuis toujours, versements confirmes uniquement. */
  totalJoueursRegles: number
  totalCentimesRegles: number
}

export type SemainePartenaire = {
  /** Le lundi de la semaine, « 2026-09-14 ». */
  debut: string
  /** Le dimanche, « 2026-09-20 ». */
  fin: string
  nouveaux: number
  montantCentimes: number
  /** « reglee » : entierement avant la derniere borne de paiement. */
  etat: 'reglee' | 'partielle' | 'en-cours'
}

/**
 * Le debut de la periode en cours, ecrit une seule fois.
 *
 * `max(fin)` des versements deja confirmes ; et pour le tout premier, la date
 * de creation du partenaire — ou la premiere venue d'un de ses joueurs si
 * elle est anterieure, ce qui ne devrait pas arriver mais ne doit surtout pas
 * faire disparaitre un joueur du decompte. `least` ignore les NULL.
 */
const DEPUIS = `coalesce(
      (select max(fin) from paiement_partenaire where slug = p.slug),
      least(p.cree_le, (select min(premiere_connexion) from joueur_source where hote = p.hote))
    )`

/** Ce qui reste du, plus le total deja verse. */
export async function lireRemuneration(partenaire: Partenaire): Promise<Remuneration> {
  const [enCours, paiements] = await Promise.all([
    prisma.$queryRawUnsafe<{ joueurs: number; doublons: number; depuis: Date }[]>(
      `select ${DEPUIS} as depuis,
              (select count(*)::int
                 from joueur_source j
                where j.hote = p.hote
                  and not j.doublon
                  and j.premiere_connexion >= ${DEPUIS})::int as joueurs,
              (select count(*)::int
                 from joueur_source j
                where j.hote = p.hote
                  and j.doublon
                  and j.premiere_connexion >= ${DEPUIS})::int as doublons
         from partenaire p
        where p.slug = $1`,
      partenaire.slug,
    ),
    lirePaiements(partenaire.slug),
  ])

  const joueurs = enCours[0]?.joueurs ?? 0
  const doublons = enCours[0]?.doublons ?? 0
  const regles = paiements.reduce(
    (total, paiement) => ({
      joueurs: total.joueurs + paiement.joueurs,
      centimes: total.centimes + paiement.montantCentimes,
    }),
    { joueurs: 0, centimes: 0 },
  )

  return {
    joueurs,
    doublons,
    montantCentimes: joueurs * partenaire.tauxCentimes,
    tauxCentimes: partenaire.tauxCentimes,
    depuis: enCours[0]?.depuis ?? partenaire.creeLe,
    dernier: paiements[0] ?? null,
    paiements,
    totalJoueursRegles: regles.joueurs,
    totalCentimesRegles: regles.centimes,
  }
}

/** Les versements confirmes, du plus recent au plus ancien. */
export async function lirePaiements(slug: string): Promise<Paiement[]> {
  return prisma.$queryRawUnsafe<Paiement[]>(
    `select id, debut, fin, joueurs,
            taux_centimes as "tauxCentimes",
            montant_centimes as "montantCentimes",
            confirme_le as "confirmeLe"
       from paiement_partenaire
      where slug = $1
      order by fin desc
      limit $2`,
    slug,
    PAIEMENTS_AFFICHES,
  )
}

/**
 * Semaine par semaine — le recapitulatif que le partenaire relit pour
 * verifier un virement.
 *
 * La semaine commence le LUNDI, heure de Paris : `date_trunc('week', ...)` le
 * fait deja, et c'est la semaine que tout le monde a en tete quand on dit
 * « paye toutes les semaines ».
 *
 * ⚠ Le montant d'une ligne est INDICATIF. Les versements, eux, courent d'un
 * clic au suivant et peuvent tomber au milieu d'une semaine : c'est le
 * tableau des paiements qui fait foi, pas celui-ci. La page le dit.
 */
export async function lireSemaines(
  hote: string,
  tauxCentimes: number,
  borneReglee: Date | null,
): Promise<SemainePartenaire[]> {
  const lignes = await prisma.$queryRawUnsafe<{ debut: string; n: number }[]>(
    `select to_char(date_trunc('week', premiere_connexion at time zone 'Europe/Paris'), 'YYYY-MM-DD') as debut,
            count(*)::int as n
       from joueur_source
      where hote = $1
        and premiere_connexion >= (date_trunc('week', (now() at time zone 'Europe/Paris'))
                                   - make_interval(weeks => $2::int - 1)) at time zone 'Europe/Paris'
      group by 1`,
    hote,
    SEMAINES_AFFICHEES,
  )

  const parSemaine = new Map(lignes.map((l) => [l.debut, l.n]))
  const lundiCourant = lundiDeLaSemaine(new Date())

  // De la plus recente a la plus ancienne : un partenaire ouvre la page pour
  // savoir ou il en est cette semaine, pas il y a trois mois.
  return Array.from({ length: SEMAINES_AFFICHEES }, (_, index) => {
    const debut = new Date(lundiCourant)
    debut.setUTCDate(debut.getUTCDate() - 7 * index)
    const fin = new Date(debut)
    fin.setUTCDate(fin.getUTCDate() + 6)

    const cleDebut = cleDuJour(debut)
    const nouveaux = parSemaine.get(cleDebut) ?? 0

    return {
      debut: cleDebut,
      fin: cleDuJour(fin),
      nouveaux,
      montantCentimes: nouveaux * tauxCentimes,
      etat: etatSemaine(debut, fin, borneReglee),
    }
  })
}

/* ---------------------------------------------------------------------- *
 *  Les dates de semaine, sans bibliotheque.
 *
 *  Tout se passe en UTC sur des dates « nues » (minuit UTC) : ce ne sont pas
 *  des instants mais des ETIQUETTES de jour, comparees a la borne de paiement
 *  une seule fois, plus bas. Faire autrement obligerait a traiter les
 *  changements d'heure pour un tableau qui n'affiche que des dates.
 * ---------------------------------------------------------------------- */

/** « 2026-09-14 » a partir d'une date nue. */
function cleDuJour(jour: Date): string {
  return jour.toISOString().slice(0, 10)
}

/** Le lundi de la semaine d'un instant, heure de Paris, en date nue UTC. */
function lundiDeLaSemaine(instant: Date): Date {
  // en-CA rend « 2026-09-18 » : la date telle qu'elle est a Paris.
  const jourParis = instant.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
  const nu = new Date(`${jourParis}T00:00:00Z`)
  // getUTCDay : 0 = dimanche. Le lundi est donc a -6 ce jour-la.
  const decalage = (nu.getUTCDay() + 6) % 7
  nu.setUTCDate(nu.getUTCDate() - decalage)
  return nu
}

/**
 * Une semaine est-elle deja reglee ?
 *
 * On compare la FIN de la semaine (dimanche minuit, cote Paris) a la borne du
 * dernier versement. Une semaine a cheval sur la borne est dite « partielle »
 * plutot que reglee : mieux vaut un mot honnete qu'une case verte qui laisse
 * croire que tout a ete paye.
 */
function etatSemaine(debut: Date, fin: Date, borne: Date | null): SemainePartenaire['etat'] {
  if (!borne) return 'en-cours'
  const finDeSemaine = new Date(`${cleDuJour(fin)}T23:59:59Z`)
  if (finDeSemaine <= borne) return 'reglee'
  if (new Date(`${cleDuJour(debut)}T00:00:00Z`) < borne) return 'partielle'
  return 'en-cours'
}
