import { MODES, type Vue } from '@/lib/practice-commun'

/**
 * LES ADRESSES DE LA REFONTE (16/10/2026) — sans accès base, importable partout.
 *
 * La saison et le mode passent dans le CHEMIN et plus dans `?saison=`/`?mode=` :
 * un paramètre de requête rend la page dynamique, un chemin se pré-rend et se
 * sert depuis le cache du CDN en quelques millisecondes. Les anciennes adresses
 * sont redirigées par le middleware.
 *
 *   /classement                     la saison par défaut, global
 *   /classement/hg                  la saison par défaut, un mode
 *   /classement/saison-1[/hg]       une saison précise
 *   …/page-2                        les 100 suivants
 *   /joueur/<pseudo>[/saison-1]     un profil
 *   /match/<id>                     le récap d'un match
 *   /matchs[/hg]                    le flux des derniers matchs
 */

export const PAR_PAGE = 100

/** `saison-2` → 2. */
export function lireSegmentSaison(segment: string | undefined): number | null {
  const m = segment ? /^saison-(\d{1,3})$/.exec(segment) : null
  return m ? Number(m[1]) : null
}

export function segmentSaison(saison: number): string {
  return `saison-${saison}`
}

/** Les segments du classement → saison (null = par défaut), vue et page ; null si l'adresse ne veut rien dire. */
export function lireSegmentsClassement(
  segments: string[] | undefined,
): { saison: number | null; vue: Vue; page: number } | null {
  const reste = [...(segments ?? [])]
  let saison: number | null = null
  let vue: Vue = 'global'
  let page = 1
  if (reste.length && lireSegmentSaison(reste[0]) != null) saison = lireSegmentSaison(reste.shift())
  if (reste.length && MODES.some((m) => m.id === reste[0])) vue = reste.shift() as Vue
  if (reste.length && /^page-\d{1,3}$/.test(reste[0])) page = Number(reste.shift()!.slice(5))
  if (reste.length || page < 1) return null
  return { saison, vue, page }
}

/** L'adresse d'un classement. `saisonParDefaut` : la saison qu'on peut omettre de l'adresse. */
export function cheminClassement(saison: number, vue: Vue, saisonParDefaut: number, page = 1): string {
  const morceaux = ['/classement']
  if (saison !== saisonParDefaut) morceaux.push(segmentSaison(saison))
  if (vue !== 'global') morceaux.push(vue)
  if (page > 1) morceaux.push(`page-${page}`)
  return morceaux.join('/')
}

export function cheminProfilSaison(pseudo: string, saison: number, saisonParDefaut: number): string {
  const base = `/joueur/${encodeURIComponent(pseudo)}`
  return saison === saisonParDefaut ? base : `${base}/${segmentSaison(saison)}`
}

export function cheminFlux(mode: string | null): string {
  return mode ? `/matchs/${mode}` : '/matchs'
}
