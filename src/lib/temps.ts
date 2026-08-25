/**
 * Bornes de fenêtres temporelles, calculées en Europe/Paris.
 *
 * Vercel exécute le code en UTC. Si on laissait `new Date(annee, mois, jour)`
 * décider des bornes, « le début du mois » ou « le début du jour » tomberaient
 * à minuit UTC, soit 1 h ou 2 h du matin à Paris : les ventes du samedi soir
 * basculeraient dans le dimanche. On fixe donc explicitement le fuseau ici, et
 * toutes les fenêtres du tableau de bord passent par ces fonctions.
 *
 * Le principe, pour convertir une heure murale de Paris en instant UTC :
 *   instant_utc = heure_murale_traitée_comme_UTC − décalage_de_Paris
 * où le décalage vaut +1 h en hiver (CET) et +2 h en été (CEST). On lit ce
 * décalage à l'instant considéré via Intl, ce qui gère les changements d'heure
 * sans table en dur.
 */

const FUSEAU = 'Europe/Paris'

/** Décalage de Europe/Paris par rapport à UTC, en millisecondes, à cet instant. */
function decalageParisMs(instant: Date): number {
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSEAU,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const parties: Record<string, string> = {}
  for (const part of format.formatToParts(instant)) parties[part.type] = part.value

  // Certains moteurs rendent minuit « 24 » plutôt que « 00 ».
  const heure = parties.hour === '24' ? '00' : parties.hour

  const commeUTC = Date.UTC(
    Number(parties.year),
    Number(parties.month) - 1,
    Number(parties.day),
    Number(heure),
    Number(parties.minute),
    Number(parties.second),
  )

  return commeUTC - instant.getTime()
}

/** Les composantes calendaires (année, mois 1-12, jour) de l'instant, à Paris. */
function partiesParis(instant: Date): { annee: number; mois: number; jour: number } {
  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSEAU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const [annee, mois, jour] = format.format(instant).split('-').map(Number)
  return { annee, mois, jour }
}

/**
 * L'instant UTC correspondant à une heure murale de Paris.
 *
 * `Date.UTC` normalise les débordements : un mois à 0 renvoie décembre de
 * l'année précédente, un jour négatif recule sur le mois d'avant — ce qui rend
 * les décalages (« il y a 30 jours », « il y a 2 mois ») sûrs.
 */
function instantParis(
  annee: number,
  mois: number,
  jour: number,
  heure = 0,
  minute = 0,
  seconde = 0,
): Date {
  const estimation = Date.UTC(annee, mois - 1, jour, heure, minute, seconde)
  // Le décalage se lit à l'instant estimé : une seule correction suffit, les
  // deux heures de bascule d'heure d'été ne concernent jamais un minuit.
  const decalage = decalageParisMs(new Date(estimation))
  return new Date(estimation - decalage)
}

/** Minuit (Paris) du jour de `instant`, éventuellement reculé de `reculJours`. */
export function debutDuJourParis(instant: Date = new Date(), reculJours = 0): Date {
  const { annee, mois, jour } = partiesParis(instant)
  return instantParis(annee, mois, jour - reculJours)
}

/** Le 1er (Paris) du mois de `instant`, éventuellement reculé de `reculMois`. */
export function debutDuMoisParis(instant: Date = new Date(), reculMois = 0): Date {
  const { annee, mois } = partiesParis(instant)
  return instantParis(annee, mois - reculMois, 1)
}

/**
 * La clé « 2026-08 » du mois de `instant`, dans le fuseau de Paris.
 * Sert à ranger une commande dans le bon mois du graphique.
 */
export function cleMoisParis(instant: Date): string {
  const { annee, mois } = partiesParis(instant)
  return `${annee}-${String(mois).padStart(2, '0')}`
}

/** Le libellé court « août 26 » d'un mois, à partir de son début. */
export function libelleMois(debutDuMois: Date): string {
  return debutDuMois.toLocaleDateString('fr-FR', {
    month: 'short',
    year: '2-digit',
    timeZone: FUSEAU,
  })
}
