import { prisma } from '@/lib/prisma'

/**
 * L'HISTORIQUE DES SANCTIONS D'UN JOUEUR  (23/09/2026)
 *
 * ================================================================
 *  D'OÙ VIENNENT CES LIGNES
 * ================================================================
 * Les sanctions du serveur (ban, tempban, mute, kick, avertissement) vivent
 * dans le SQLite de LJAdmin, sur la machine du serveur. Le site tourne
 * ailleurs : le panel recopie donc ces lignes dans la table `sanction` de
 * Neon, en sens unique (panel/lib/sanctions-neon.js). Les exclusions du
 * classement, elles, arrivent par deux chemins — les définitives sont déjà
 * dans `elo_exclusion` (écrites par LJElo), les temporaires passent par le
 * même miroir sous le type RANKEDTEMPBAN.
 *
 * ⚠ LECTURE SEULE, comme tout ce que le site lit du jeu.
 *
 * ================================================================
 *  CE QU'ON MONTRE, ET CE QU'ON NE MONTRE PAS
 * ================================================================
 *   - Les notes internes du staff et les signalements ne quittent jamais le
 *     serveur : le miroir ne les copie même pas.
 *   - Le NOM DU STAFF n'est pas affiché. Une sanction engage le serveur, pas
 *     la personne qui l'a posée ; et un joueur sanctionné n'a pas à savoir
 *     qui aller harceler. La donnée est là, en base, pour l'administration.
 *   - Les levées (UNBAN, UNMUTE, UNWARN) ne sont pas des lignes à part : la
 *     sanction d'origine porte déjà « levée ».
 */

/** Les types affichés sur une fiche publique, dans cet ordre de gravité. */
export const TYPES_SANCTION = [
  'BAN',
  'RANKEDBAN',
  'TEMPBAN',
  'RANKEDTEMPBAN',
  'MUTE',
  'WARN',
  'KICK',
] as const

export type TypeSanction = (typeof TYPES_SANCTION)[number]

/**
 * `active`  : en cours — le joueur la subit maintenant
 * `levee`   : un membre du staff l'a retirée avant son terme
 * `expiree` : elle est allée à son terme (ou c'était un kick, instantané)
 */
export type EtatSanction = 'active' | 'levee' | 'expiree'

export type SanctionProfil = {
  type: TypeSanction
  raison: string | null
  creeLe: Date
  /** Fin prévue, ou null pour une sanction définitive ou instantanée. */
  expireLe: Date | null
  etat: EtatSanction
}

type BrutSanction = {
  type: string
  raison: string | null
  cree_le: Date
  expire_le: Date | null
  actif: boolean
  levee_le: Date | null
}

const AFFICHEES = ['BAN', 'TEMPBAN', 'MUTE', 'WARN', 'KICK', 'RANKEDTEMPBAN']

/** Un kick ne dure pas : il n'a ni fin ni état à suivre. */
function etatDe(l: BrutSanction, maintenant: Date): EtatSanction {
  if (l.type === 'KICK') return 'expiree'
  if (l.levee_le) return 'levee'
  if (l.actif && (!l.expire_le || l.expire_le > maintenant)) return 'active'
  return 'expiree'
}

/**
 * Tout l'historique d'un joueur, du plus récent au plus ancien.
 *
 * Les deux sources sont lues en parallèle puis fusionnées : `sanction` pour
 * le serveur et les exclusions temporaires, `elo_exclusion` pour les
 * exclusions définitives du classement. On ignore les exclusions d'origine
 * « serveur » : ce ne sont pas des sanctions de plus, seulement la
 * conséquence automatique d'un ban déjà présent dans la liste.
 */
export async function lireSanctions(uuid: string, limite = 30): Promise<SanctionProfil[]> {
  const maintenant = new Date()

  const [duServeur, duClassement] = await Promise.all([
    prisma.$queryRawUnsafe<BrutSanction[]>(
      `select type, raison, cree_le, expire_le, actif, levee_le
         from sanction
        where cible_uuid = $1 and type = any($2)
        order by cree_le desc
        limit $3`,
      uuid,
      AFFICHEES,
      limite,
    ),
    prisma.$queryRawUnsafe<{ raison: string | null; cree_le: Date; levee_le: Date | null; actif: boolean }[]>(
      `select raison, cree_le, levee_le, actif
         from elo_exclusion
        where uuid = $1 and origine = 'ranked'
        order by cree_le desc`,
      uuid,
    ),
  ])

  const lignes: SanctionProfil[] = duServeur.map((l) => ({
    type: l.type as TypeSanction,
    raison: l.raison,
    creeLe: l.cree_le,
    expireLe: l.expire_le,
    etat: etatDe(l, maintenant),
  }))

  for (const e of duClassement) {
    lignes.push({
      type: 'RANKEDBAN',
      raison: e.raison,
      creeLe: e.cree_le,
      expireLe: null,
      etat: e.levee_le ? 'levee' : e.actif ? 'active' : 'expiree',
    })
  }

  lignes.sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime())
  return lignes.slice(0, limite)
}

/** Combien de sanctions courent encore : c'est ce qu'on résume en tête. */
export function nombreActives(sanctions: SanctionProfil[]): number {
  return sanctions.filter((s) => s.etat === 'active').length
}
