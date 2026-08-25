import { requeteCronAutorisee } from '@/lib/cron'
import { prisma } from '@/lib/prisma'
import { debutDuJourParis } from '@/lib/temps'

/**
 * Maintenance quotidienne de l'audience : agréger, puis purger.
 *
 * La table VuePage grossit indéfiniment et Neon a un quota. On procède en deux
 * temps, dans cet ordre :
 *
 *   1. AGRÉGER — chaque jour révolu est résumé dans StatistiqueJour (vues,
 *      visiteurs distincts, temps moyen). L'opération est idempotente
 *      (ON CONFLICT … DO UPDATE) : la relancer ne crée pas de doublon et
 *      rattrape une exécution manquée. Le jour en cours n'est pas agrégé tant
 *      qu'il n'est pas terminé.
 *
 *   2. PURGER — les VuePage de plus de 180 jours sont supprimées. Leur
 *      substance vit désormais dans StatistiqueJour : l'historique long reste
 *      lisible sans conserver des millions de lignes fines.
 *
 * Le découpage en jours se fait dans le fuseau Europe/Paris. VuePage.createdAt
 * est un timestamp sans fuseau stocké en UTC ; on le réinterprète en UTC puis
 * on le convertit à Paris avant d'en extraire la date — sinon un jour irait de
 * 2 h du matin à 2 h du matin.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const RETENTION_JOURS = 180

export async function GET(requete: Request) {
  if (!requeteCronAutorisee(requete)) {
    return Response.json({ erreur: 'Non autorisé.' }, { status: 401 })
  }

  try {
    const debutAujourdhui = debutDuJourParis()

    // 1. Agrégation des jours révolus.
    await prisma.$executeRaw`
      INSERT INTO "statistique_jour" ("jour", "vues", "visiteurs", "dureeMoyenneMs")
      SELECT
        (("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris')::date AS jour,
        COUNT(*)::int,
        COUNT(DISTINCT "visiteId")::int,
        AVG("dureeMs")::int
      FROM "VuePage"
      WHERE "createdAt" < ${debutAujourdhui}
      GROUP BY jour
      ON CONFLICT ("jour") DO UPDATE SET
        "vues" = EXCLUDED."vues",
        "visiteurs" = EXCLUDED."visiteurs",
        "dureeMoyenneMs" = EXCLUDED."dureeMoyenneMs"
    `

    // 2. Purge des vues fines au-delà de la rétention.
    //
    // Garde-fou explicite : on ne supprime QUE les lignes dont le jour (à
    // Paris) existe déjà dans statistique_jour. Même si le rollup ci-dessus
    // avait échoué à agréger un jour, la purge ne peut structurellement pas
    // détruire une donnée non encore résumée — la substance est toujours
    // sauvegardée avant que la source ne parte.
    const limite = debutDuJourParis(new Date(), RETENTION_JOURS)
    const vuesPurgees = await prisma.$executeRaw`
      DELETE FROM "VuePage" v
      WHERE v."createdAt" < ${limite}
        AND EXISTS (
          SELECT 1 FROM "statistique_jour" s
          WHERE s."jour" = ((v."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris')::date
        )
    `

    return Response.json({ vuesPurgees }, { status: 200 })
  } catch (erreur) {
    console.error('[cron:maintenance] échec :', erreur)
    return Response.json({ erreur: 'Maintenance impossible.' }, { status: 500 })
  }
}
