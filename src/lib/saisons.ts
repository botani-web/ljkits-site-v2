import { unstable_cache } from 'next/cache'

import { prisma } from '@/lib/prisma'
import { saisonParDefaut } from '@/lib/saison'

/**
 * LES SAISONS CONSULTABLES (12/10/2026, fin de la saison 1).
 *
 * Le classement et les profils se lisent saison par saison (`?saison=`). Une
 * saison existe dès que LJElo l'a ouverte (`elo_saison`) ou qu'un match y a été
 * joué (`practice_elo`) : la seconde source couvre le numéro calculé par date
 * avant que la ligne `elo_saison` ne soit écrite.
 *
 * Par défaut : la plus récente qui a des matchs. Pendant la maintenance entre
 * deux saisons, le site montre donc la saison terminée, pas une saison vide.
 *
 * ⚠ LECTURE SEULE, comme tout le ranked côté site.
 */

export type Saison = {
  id: number
  /** Close (date de fin passée ou statut « terminée »). */
  terminee: boolean
  /** Au moins un match ranked joué. */
  aDesMatchs: boolean
}

export async function lireSaisons(): Promise<Saison[]> {
  const lignes = await prisma.$queryRawUnsafe<{ id: number; terminee: boolean; matchs: number }[]>(
    `select s.id,
            coalesce(es.fin is not null and es.fin < now(), false) or coalesce(es.statut <> 'en_cours', false) as terminee,
            (select count(*)::int from practice_elo p where p.saison = s.id and p.matchs > 0) as matchs
       from (select id from elo_saison union select distinct saison from practice_elo) s
       left join elo_saison es on es.id = s.id
      order by s.id desc`,
  )
  return lignes.map((l) => ({ id: l.id, terminee: l.terminee, aDesMatchs: l.matchs > 0 }))
}

export const lireSaisonsCache = unstable_cache(lireSaisons, ['saisons'], { revalidate: 60 })

/**
 * La saison demandée par `?saison=` si elle existe ; sinon la plus récente qui a
 * des matchs ; sinon la plus récente tout court. null s'il n'y en a aucune.
 */
export function choisirSaison(saisons: Saison[], demande: string | undefined): Saison | null {
  const n = demande && /^\d{1,3}$/.test(demande) ? Number(demande) : null
  if (n != null) {
    const trouvee = saisons.find((s) => s.id === n)
    if (trouvee) return trouvee
  }
  return saisons.find((s) => s.aDesMatchs) ?? saisons[0] ?? null
}

/**
 * LA SAISON D'UNE PAGE DE LA REFONTE (16/10/2026).
 *
 * `parDefaut` : celle qu'on montre sans rien demander — la plus récente dont
 * l'ouverture PUBLIQUE est passée (saison.ts), pas la plus récente en base : la
 * saison 2 existe depuis le 12/10 mais n'ouvre aux joueurs que le 17/10.
 * `demandee` absente de la base → null (la page répond 404).
 */
export async function contexteSaison(demandee: number | null): Promise<{
  saisons: Saison[]
  saison: number
  parDefaut: number
  terminee: boolean
} | null> {
  const saisons = await lireSaisonsCache()
  const ouvertes = saisons.filter((s) => s.id <= saisonParDefaut())
  const parDefaut = ouvertes[0]?.id ?? saisonParDefaut()
  const saison = demandee ?? parDefaut
  if (demandee != null && !saisons.some((s) => s.id === demandee)) return null
  return {
    // Toutes les saisons en base, la prochaine comprise (marquée « bientôt ») : on peut la choisir.
    saisons,
    saison,
    parDefaut,
    terminee: saisons.find((s) => s.id === saison)?.terminee ?? false,
  }
}
