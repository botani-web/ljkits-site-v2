import type { PlayerObject } from 'skinview3d'
import type * as Three from 'three'

/**
 * LES POSES DU SKIN 3D (16/09/2026).
 *
 * skinview3d anime un joueur en modifiant, à chaque image, les rotations de
 * ses membres. Les angles sont en radians, dans le repère du modèle :
 *   - bras.rotation.x négatif  → le bras part vers l'avant, puis vers le haut ;
 *   - bras droit .rotation.z négatif / bras gauche positif → vers l'extérieur ;
 *   - le joueur regarde vers +z (vers la caméra à rotation nulle).
 * L'angle de vue de trois quarts est porté par `playerWrapper` (fixé une fois),
 * pour que l'animation reste libre de tourner le joueur lui-même.
 */

export type Pose = 'combat' | 'victoire' | 'repos'

/** L'angle de vue initial de chaque pose. */
export const ANGLE_DEPART: Record<Pose, number> = {
  combat: -0.62,
  victoire: 0.18,
  repos: -0.35,
}

/** Démarrage et arrivée en douceur, sans rebond. */
function lisser(x: number): number {
  const k = Math.min(1, Math.max(0, x))
  return k * k * (3 - 2 * k)
}

/**
 * Une épée en diamant dans la main droite, en boîtes « pixel » comme l'item du
 * jeu. Elle est accrochée au bras : elle suit donc toutes ses rotations.
 * Le bras droit s'étend de y = +2 à y = -10 autour de son épaule, centré en x = -1.
 */
export function equiper(joueur: PlayerObject, three: typeof Three, pose: Pose): void {
  if (pose === 'repos') return
  const bras = joueur.skin.rightArm
  if (bras.getObjectByName('epee')) return

  const epee = new three.Group()
  epee.name = 'epee'
  const bloc = (l: number, h: number, p: number, couleur: number, x: number, y: number, z: number) => {
    const maille = new three.Mesh(new three.BoxGeometry(l, h, p), new three.MeshLambertMaterial({ color: couleur }))
    maille.position.set(x, y, z)
    epee.add(maille)
  }
  bloc(1, 1, 3, 0x6b4a2b, 0, 0, -1.5) // la poignée, derrière la main
  bloc(4, 1.2, 1, 0x1d6468, 0, 0, 0.6) // la garde
  bloc(1.2, 1, 9.5, 0x6ff2f2, 0, 0, 5.9) // la lame
  bloc(0.6, 0.6, 1, 0xc9fbfb, 0, 0.1, 11.1) // la pointe, plus claire
  epee.position.set(-1, -9.2, 0.4)
  bras.add(epee)
}

/** Une image de l'animation, `t` en secondes. */
export function animer(joueur: PlayerObject, t: number, pose: Pose): void {
  const s = joueur.skin

  if (pose === 'victoire') {
    // Les deux bras en V, un saut régulier, le regard vers le haut.
    const saut = Math.max(0, Math.sin(t * 3.2))
    const vague = Math.sin(t * 6.4) * 0.12
    joueur.position.y = saut * 1.6
    joueur.rotation.y = Math.sin(t * 0.8) * 0.22
    s.rightArm.rotation.set(0, 0, -2.72 - vague)
    s.leftArm.rotation.set(0, 0, 2.72 + vague)
    s.head.rotation.set(-0.2, 0, 0)
    s.leftLeg.rotation.set(saut * 0.25, 0, 0.04)
    s.rightLeg.rotation.set(-saut * 0.25, 0, -0.04)
    return
  }

  if (pose === 'repos') {
    const souffle = Math.sin(t * 1.6)
    joueur.position.y = 0
    joueur.rotation.y = 0
    s.rightArm.rotation.set(souffle * 0.04, 0, -0.07 - souffle * 0.03)
    s.leftArm.rotation.set(-souffle * 0.04, 0, 0.07 + souffle * 0.03)
    s.head.rotation.set(0.04, Math.sin(t * 0.7) * 0.28, 0)
    s.leftLeg.rotation.set(0, 0, 0)
    s.rightLeg.rotation.set(0, 0, 0)
    return
  }

  // COMBAT : sautillement de boxeur, garde du bras gauche, et un coup d'épée
  // complet (armer, frapper, revenir) toutes les 1,7 seconde.
  const pas = t * 4.2
  joueur.position.y = Math.abs(Math.sin(pas)) * 0.35
  s.leftLeg.rotation.set(0.28 + Math.sin(pas) * 0.12, 0, 0.05)
  s.rightLeg.rotation.set(-0.22 - Math.sin(pas) * 0.12, 0, -0.05)
  s.leftArm.rotation.set(-0.55 + Math.sin(pas) * 0.06, 0, 0.3)

  const cycle = (((t % 1.7) + 1.7) % 1.7) / 1.7
  let bras = -0.75
  let torsion = 0
  if (cycle > 0.55 && cycle <= 0.72) {
    const k = lisser((cycle - 0.55) / 0.17) // armer : l'épée monte au-dessus de la tête
    bras = -0.75 - 1.75 * k
    torsion = -0.25 * k
  } else if (cycle > 0.72 && cycle <= 0.8) {
    const k = lisser((cycle - 0.72) / 0.08) // frapper : très vite, le buste suit
    bras = -2.5 + 2.35 * k
    torsion = -0.25 + 0.55 * k
  } else if (cycle > 0.8) {
    const k = lisser((cycle - 0.8) / 0.2) // revenir en garde
    bras = -0.15 - 0.6 * k
    torsion = 0.3 - 0.3 * k
  }
  s.rightArm.rotation.set(bras, 0, -0.12)
  joueur.rotation.y = torsion
  s.head.rotation.set(0.06, -torsion * 0.6, 0)
}
