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
  /** Le formulaire /recrutement accepte-t-il des candidatures ? */
  recrutementOuvert: boolean
  /** Ce que lit un visiteur quand il est fermé. Jamais un 404. */
  recrutementMessageFerme: string
}

/**
 * Repli du message de fermeture. Ne sert que si la ligne de réglages n'existe
 * pas : sinon c'est la valeur par défaut de la colonne qui s'applique.
 */
const MESSAGE_FERME_PAR_DEFAUT =
  'Le recrutement est fermé pour le moment. Les ouvertures sont annoncées sur le Discord — passe y jeter un œil.'

/**
 * Valeurs de repli, utilisées tant que la ligne de réglages n'existe pas —
 * base fraîchement créée, seed pas encore lancé. Mieux vaut un site qui
 * affiche les valeurs d'origine qu'un site qui plante.
 */
export const REGLAGES_PAR_DEFAUT: Reglages = {
  ip: SITE.ip,
  discord: SITE.discord,
  sitesDeVote: SITE.sitesDeVote.map((site) => ({ ...site })),
  // Fermé par défaut : sans ligne de réglages en base, le recrutement ne
  // s'ouvre pas tout seul.
  recrutementOuvert: false,
  recrutementMessageFerme: MESSAGE_FERME_PAR_DEFAUT,
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
    recrutementOuvert: enBase.recrutementOuvert,
    recrutementMessageFerme: enBase.recrutementMessageFerme,
    sitesDeVote: SITE.sitesDeVote.map((site) => ({
      ...site,
      // Une URL vide en base signifie « pas encore inscrit », comme le '#'
      // d'origine : le bouton s'affiche mais reste inerte.
      url: urls[site.cle]?.trim() || '#',
    })),
  }
})
