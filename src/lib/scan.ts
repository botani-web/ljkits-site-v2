/**
 * CE QUE LE SITE SAIT DE L'OUTIL DE SCREENSHARE (LJScan).
 *
 * ── LE FICHIER VIT AILLEURS ───────────────────────────────────────────────
 * L'exécutable pèse 67 Mo et change à chaque compilation : il n'a rien à faire
 * dans ce dépôt, où il gonflerait l'historique Git et le déploiement pour rien.
 * C'est le panel qui le sert (il est sur la même machine que le compilateur),
 * et le site ne fait que pointer dessus.
 *
 * ── POURQUOI ON INTERROGE LE PANEL ────────────────────────────────────────
 * Pour afficher la version, la taille et l'empreinte SANS redéployer le site à
 * chaque nouvelle version de l'outil. La page est revalidée toutes les cinq
 * minutes (`revalidate`), donc au pire l'information a cinq minutes de retard.
 *
 * ── SI LE PANEL NE RÉPOND PAS ─────────────────────────────────────────────
 * La page s'affiche quand même, avec le bouton de téléchargement et sans les
 * chiffres. Un panel en maintenance ne doit pas casser une page publique —
 * et le lien, lui, reste valable.
 */

const PANEL = process.env.PANEL_URL ?? 'https://panel.ljkits.eu'

export type OutilScan = {
  present: boolean
  /** L'adresse de téléchargement, toujours renseignée. */
  lien: string
  /** Le nom du fichier tel qu'il arrive sur le disque ("LJScan-1.3.0.exe"). */
  nom: string
  version: string | null
  /** En octets, 0 si inconnu. */
  taille: number
  sha256: string | null
}

export async function lireOutilScan(): Promise<OutilScan> {
  const lien = `${PANEL}/telechargement/ljscan`
  const repli: OutilScan = {
    present: false,
    lien,
    nom: 'LJScan.exe',
    version: null,
    taille: 0,
    sha256: null,
  }

  try {
    const reponse = await fetch(`${PANEL}/api/ss/public`, {
      next: { revalidate: 300 },
      // Le panel est sur la même machine : s'il tarde, c'est qu'il est occupé.
      signal: AbortSignal.timeout(4000),
    })
    if (!reponse.ok) return repli

    const données = (await reponse.json()) as Partial<OutilScan> & { nom?: string }
    return {
      present: données.present === true,
      lien,
      nom: typeof données.nom === 'string' ? données.nom : repli.nom,
      version: typeof données.version === 'string' ? données.version : null,
      taille: typeof données.taille === 'number' ? données.taille : 0,
      sha256: typeof données.sha256 === 'string' ? données.sha256 : null,
    }
  } catch {
    return repli
  }
}
