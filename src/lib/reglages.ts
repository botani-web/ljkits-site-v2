import { cache } from 'react'

import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/site'

/**
 * Les réglages du site, lus en base et modifiables depuis /admin/reglages.
 *
 * Ce qui est ici change au fil du temps sans mériter un déploiement : adresse
 * du serveur, lien Discord, URL de vote. Tout le reste (nom du site, URL des
 * API tierces, image Open Graph) demeure dans src/lib/site.ts, parce que le
 * modifier suppose de toucher au code de toute façon.
 */
export type Reglages = {
  ip: string
  discord: string
  sitesDeVote: { cle: string; sigle: string; nom: string; url: string }[]
}

/**
 * Valeurs de repli, utilisées tant que la ligne de réglages n'existe pas —
 * base fraîchement créée, seed pas encore lancé. Mieux vaut un site qui
 * affiche les valeurs d'origine qu'un site qui plante.
 */
export const REGLAGES_PAR_DEFAUT: Reglages = {
  ip: SITE.ip,
  discord: SITE.discord,
  sitesDeVote: SITE.sitesDeVote.map((site) => ({ ...site })),
}

/**
 * Lit les réglages.
 *
 * `cache()` de React déduplique l'appel à l'intérieur d'un même rendu : la mise
 * en page les demande, la page aussi, et une seule requête part réellement.
 */
export const lireReglages = cache(async (): Promise<Reglages> => {
  const enBase = await prisma.reglages.findUnique({ where: { id: 1 } })

  if (!enBase) return REGLAGES_PAR_DEFAUT

  // Les noms et sigles des sites de vote restent dans le code : seules leurs
  // URL changent, et c'est tout ce que l'admin a besoin de modifier.
  const urls: Record<string, string> = {
    serveurPrive: enBase.urlServeurPrive,
    topServeurs: enBase.urlTopServeurs,
    serveursMinecraft: enBase.urlServeursMinecraft,
  }

  return {
    ip: enBase.ip,
    discord: enBase.discord,
    sitesDeVote: SITE.sitesDeVote.map((site) => ({
      ...site,
      // Une URL vide en base signifie « pas encore inscrit », comme le '#'
      // d'origine : le bouton s'affiche mais reste inerte.
      url: urls[site.cle]?.trim() || '#',
    })),
  }
})
