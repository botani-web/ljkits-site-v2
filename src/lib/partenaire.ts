import { cleJourParis, joursDePeriode, joursDuGraphique, type Periode } from '@/lib/partenaire-commun'
import { prisma } from '@/lib/prisma'
import { debutDuJourParis } from '@/lib/temps'

/**
 * LE SUIVI DES PARTENAIRES / STREAMEURS (17/09/2026).
 *
 * Un partenaire a son propre hote — « sixela.ljkits.eu » — qui pointe sur le
 * serveur. A la connexion, le plugin ecrit l'adresse tapee par le joueur :
 * `joueur_source` pour sa toute premiere venue, `session_joueur` pour chacun
 * de ses passages. Tout ce que montre /partenaire/<slug> se calcule ici.
 *
 * ⚠ LECTURE SEULE. `joueur_source` et `session_joueur` appartiennent au
 * plugin Minecraft ; le site ne fait que des SELECT. Seule `partenaire` est
 * tenue depuis le site (script scripts/nouveau-partenaire.mjs).
 *
 * ── LA REGLE D'ATTRIBUTION ────────────────────────────────────────────────
 * PREMIER CONTACT. Un joueur appartient au partenaire dont l'hote figure
 * dans `joueur_source`, c'est-a-dire celui par lequel il est arrive la
 * PREMIERE fois. Ensuite, TOUTES ses sessions comptent pour ce partenaire,
 * meme celles ouvertes par l'adresse principale : ce qu'on mesure est « les
 * joueurs que tu as amenes », pas « les connexions passees par ton lien ».
 * La page le dit en une ligne au visiteur (cle i18n `part.attribution`).
 *
 * ── LES JOUEURS DE PASSAGE ────────────────────────────────────────────────
 * Un joueur deja connu — arrive avant le suivi (`hote = 'historique'`) ou
 * amene par un autre partenaire — peut tres bien se connecter par l'adresse
 * d'un partenaire. Il ne lui est PAS attribue et ne compte donc dans aucun
 * de ses chiffres. Il apparait a part, dans « joueurs revenus par ton IP »
 * (`lireVisiteursPartenaire`), pour information seulement : seuls les
 * NOUVEAUX joueurs sont remuneres.
 *
 * ── AUCUNE DONNEE PERSONNELLE ─────────────────────────────────────────────
 * Ni adresse IP, ni e-mail, ni UUID affiche : un pseudo, des dates, des
 * durees. C'est tout ce qui sort d'ici.
 */

export type Partenaire = {
  slug: string
  nom: string
  hote: string
  actif: boolean
  /** Ce qu'il touche par NOUVEAU joueur amene, en centimes (25 = 0,25 €). */
  tauxCentimes: number
  creeLe: Date
}

/** Le partenaire tel qu'affiche. Le hash du mot de passe ne sort JAMAIS d'ici. */
export async function lirePartenaire(slug: string): Promise<Partenaire | null> {
  const lignes = await prisma.$queryRawUnsafe<Partenaire[]>(
    `select slug, nom, hote, actif,
            taux_centimes as "tauxCentimes", cree_le as "creeLe"
       from partenaire where slug = $1`,
    slug,
  )
  return lignes[0] ?? null
}

/**
 * Le partenaire AVEC son hash, reserve a la verification du mot de passe.
 * Fonction a part et nommee sans ambiguite : c'est la seule qui a le droit de
 * faire remonter le hash, et un `grep motDePasseHash` doit la trouver seule.
 */
export async function lirePartenairePourConnexion(
  slug: string,
): Promise<(Partenaire & { motDePasseHash: string }) | null> {
  const lignes = await prisma.$queryRawUnsafe<(Partenaire & { motDePasseHash: string })[]>(
    `select slug, nom, hote, actif,
            taux_centimes as "tauxCentimes", cree_le as "creeLe",
            mot_de_passe_hash as "motDePasseHash"
       from partenaire where slug = $1`,
    slug,
  )
  return lignes[0] ?? null
}

/* ================================================================
 *  LES CHIFFRES
 * ================================================================ */

export type ChiffresPartenaire = {
  /** Joueurs attribues ayant joue au moins une session sur la periode. */
  joueurs: number
  /** Parmi eux, ceux dont la toute premiere connexion tombe dans la periode. */
  nouveaux: number
  /** Ceux qui sont revenus : des sessions sur au moins 2 jours differents. */
  revenus: number
  sessions: number
  secondes: number
  /** Temps de jeu moyen par joueur amene, en secondes. */
  secondesParJoueur: number
  /** Joueurs attribues depuis toujours, periode ou pas — pour la note du tableau. */
  joueursDepuisToujours: number
  /**
   * Joueurs NON attribues au partenaire, mais passes par son hote sur la
   * periode. Informatif : ils ne sont dans aucun des chiffres ci-dessus.
   */
  visiteurs: number
}

export type JourPartenaire = {
  /** « 2026-09-17 ». */
  jour: string
  nouveaux: number
  sessions: number
}

export type LigneJoueurPartenaire = {
  pseudo: string
  premiere: Date
  sessions: number
  secondes: number
  derniere: Date | null
}

/**
 * Une ligne de « joueurs revenus par ton IP ».
 *
 * Attention au sens des colonnes : elles ne parlent QUE des sessions ouvertes
 * par l'hote du partenaire. Le reste de la vie du joueur — ses autres
 * connexions, son temps de jeu ailleurs — ne regarde pas ce partenaire.
 */
export type LigneVisiteurPartenaire = {
  pseudo: string
  sessions: number
  secondes: number
  derniere: Date
}

export type StatsPartenaire = {
  chiffres: ChiffresPartenaire
  jours: JourPartenaire[]
  joueurs: LigneJoueurPartenaire[]
  visiteurs: LigneVisiteurPartenaire[]
}

/** Au plus autant de lignes dans le tableau des joueurs. */
export const JOUEURS_AFFICHES = 100

/** Au plus autant de lignes dans le tableau des joueurs de passage. */
export const VISITEURS_AFFICHES = 50

/** Le debut de la periode, minuit heure de Paris. `null` = depuis toujours. */
function borneDe(periode: Periode): Date | null {
  const jours = joursDePeriode(periode)
  // `jours - 1` : une periode de 7 jours contient aujourd'hui et les 6 d'avant.
  return jours === null ? null : debutDuJourParis(new Date(), jours - 1)
}

/**
 * LE FILTRE DES JOUEURS DE PASSAGE, ecrit une seule fois.
 *
 * Les sessions ouvertes PAR L'HOTE du partenaire (`session_joueur.hote`) par
 * des joueurs qui ne lui sont PAS attribues : ceux d'avant le suivi
 * (`joueur_source.hote = 'historique'`), ceux amenes par un autre partenaire,
 * et le cas de bord d'une session sans ligne dans `joueur_source`.
 *
 * Le compte et le tableau partagent ce texte pour ne pas pouvoir diverger.
 * `$1` = l'hote du partenaire, `$2` = le debut de la periode (ou null).
 */
const VISITEURS_DEPUIS = `from session_joueur s
         left join joueur_source j on j.uuid = s.uuid
        where s.hote = $1
          and (j.hote is null or j.hote <> $1)
          and ($2::timestamptz is null or s.debut >= $2)`

/**
 * Tout ce qu'affiche la page, en six requetes lancees ensemble.
 *
 * Les comptages sont castes en `int` et les sommes en `bigint` : sans cast,
 * Postgres rend des `numeric` que Prisma remonte en objets Decimal, et les
 * additions cote JavaScript deviennent des concatenations silencieuses.
 */
export async function lireStatsPartenaire(hote: string, periode: Periode): Promise<StatsPartenaire> {
  const borne = borneDe(periode)
  const nombreDeJours = joursDuGraphique(periode)
  const borneGraphique = debutDuJourParis(new Date(), nombreDeJours - 1)

  const [brut, sessionsParJour, nouveauxParJour, joueurs, visiteursCompte, visiteurs] = await Promise.all([
    prisma.$queryRawUnsafe<
      { joueurs: number; nouveaux: number; revenus: number; sessions: number; secondes: bigint; total: number }[]
    >(
      `with attribues as (
         select uuid, premiere_connexion from joueur_source where hote = $1
       ),
       passages as (
         -- coalesce(secondes, 0) : une session encore OUVERTE — le joueur
         -- est en ligne, ou le serveur a planté avant de la fermer — compte
         -- pour une venue mais pour zéro seconde. Choix assumé : mieux vaut
         -- sous-estimer le temps de jeu que d'inventer une durée à partir
         -- d'un debut qui traîne depuis trois jours.
         select s.uuid, s.debut, coalesce(s.secondes, 0) as secondes
           from session_joueur s
           join attribues a on a.uuid = s.uuid
          where $2::timestamptz is null or s.debut >= $2
       )
       select (select count(distinct uuid) from passages)::int as joueurs,
              (select count(*) from attribues
                where $2::timestamptz is null or premiere_connexion >= $2)::int as nouveaux,
              (select count(*) from (
                 select uuid from passages
                  group by uuid
                 having count(distinct (debut at time zone 'Europe/Paris')::date) >= 2
               ) fideles)::int as revenus,
              (select count(*) from passages)::int as sessions,
              (select coalesce(sum(secondes), 0) from passages)::bigint as secondes,
              (select count(*) from attribues)::int as total`,
      hote,
      borne,
    ),

    prisma.$queryRawUnsafe<{ jour: string; n: number }[]>(
      `select to_char((s.debut at time zone 'Europe/Paris')::date, 'YYYY-MM-DD') as jour,
              count(*)::int as n
         from session_joueur s
         join joueur_source j on j.uuid = s.uuid
        where j.hote = $1 and s.debut >= $2
        group by 1`,
      hote,
      borneGraphique,
    ),

    prisma.$queryRawUnsafe<{ jour: string; n: number }[]>(
      `select to_char((premiere_connexion at time zone 'Europe/Paris')::date, 'YYYY-MM-DD') as jour,
              count(*)::int as n
         from joueur_source
        where hote = $1 and premiere_connexion >= $2
        group by 1`,
      hote,
      borneGraphique,
    ),

    prisma.$queryRawUnsafe<
      { pseudo: string; premiere: Date; sessions: number; secondes: bigint; derniere: Date | null }[]
    >(
      `select j.pseudo,
              j.premiere_connexion as premiere,
              count(s.id)::int as sessions,
              coalesce(sum(coalesce(s.secondes, 0)), 0)::bigint as secondes,
              max(s.debut) as derniere
         from joueur_source j
         left join session_joueur s
           on s.uuid = j.uuid
          and ($2::timestamptz is null or s.debut >= $2)
        where j.hote = $1
        group by j.uuid, j.pseudo, j.premiere_connexion
       having count(s.id) > 0
        order by secondes desc, sessions desc, j.pseudo asc
        limit $3`,
      hote,
      borne,
      JOUEURS_AFFICHES,
    ),

    // Le compte total des joueurs de passage : il doit rester juste meme
    // quand le tableau, lui, s'arrete a VISITEURS_AFFICHES lignes.
    prisma.$queryRawUnsafe<{ joueurs: number }[]>(
      `select count(distinct s.uuid)::int as joueurs
         ${VISITEURS_DEPUIS}`,
      hote,
      borne,
    ),

    prisma.$queryRawUnsafe<{ pseudo: string; sessions: number; secondes: bigint; derniere: Date }[]>(
      // coalesce(j.pseudo, max(s.pseudo)) : le pseudo connu du joueur, ou a
      // defaut celui de sa derniere session s'il n'a aucune ligne de source.
      `select coalesce(j.pseudo, max(s.pseudo)) as pseudo,
              count(*)::int as sessions,
              coalesce(sum(coalesce(s.secondes, 0)), 0)::bigint as secondes,
              max(s.debut) as derniere
         ${VISITEURS_DEPUIS}
        group by s.uuid, j.pseudo
        order by sessions desc, secondes desc, pseudo asc
        limit $3`,
      hote,
      borne,
      VISITEURS_AFFICHES,
    ),
  ])

  const compte = brut[0] ?? {
    joueurs: 0,
    nouveaux: 0,
    revenus: 0,
    sessions: 0,
    secondes: 0n,
    total: 0,
  }
  const secondes = Number(compte.secondes)

  return {
    chiffres: {
      joueurs: compte.joueurs,
      nouveaux: compte.nouveaux,
      revenus: compte.revenus,
      sessions: compte.sessions,
      secondes,
      secondesParJoueur: compte.joueurs > 0 ? Math.round(secondes / compte.joueurs) : 0,
      joueursDepuisToujours: compte.total,
      visiteurs: visiteursCompte[0]?.joueurs ?? 0,
    },
    jours: assemblerJours(nombreDeJours, sessionsParJour, nouveauxParJour),
    joueurs: joueurs.map((l) => ({
      pseudo: l.pseudo,
      premiere: l.premiere,
      sessions: l.sessions,
      secondes: Number(l.secondes),
      derniere: l.derniere,
    })),
    visiteurs: visiteurs.map((l) => ({
      pseudo: l.pseudo,
      sessions: l.sessions,
      secondes: Number(l.secondes),
      derniere: l.derniere,
    })),
  }
}

/**
 * La frise complete du graphique.
 *
 * Postgres ne rend que les jours ou il s'est passe quelque chose ; un jour
 * sans connexion doit apparaitre comme une barre a zero, pas disparaitre —
 * sinon la courbe mentirait en resserrant les jours actifs.
 */
function assemblerJours(
  nombreDeJours: number,
  sessions: { jour: string; n: number }[],
  nouveaux: { jour: string; n: number }[],
): JourPartenaire[] {
  const parJourSessions = new Map(sessions.map((l) => [l.jour, l.n]))
  const parJourNouveaux = new Map(nouveaux.map((l) => [l.jour, l.n]))

  return Array.from({ length: nombreDeJours }, (_, index) => {
    const jour = cleJourParis(debutDuJourParis(new Date(), nombreDeJours - 1 - index))
    return {
      jour,
      sessions: parJourSessions.get(jour) ?? 0,
      nouveaux: parJourNouveaux.get(jour) ?? 0,
    }
  })
}
