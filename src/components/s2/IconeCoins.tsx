/**
 * LES ICÔNES DES PACKS DE COINS (16/10/2026) : des piles de pièces dorées en
 * pixel art, plus hautes à chaque palier. Calculées en SVG (rectangles nets,
 * aucun fichier), à la façon des textures d'items du jeu qui servent d'icônes
 * aux modes.
 */

const G = 28
const COULEURS = {
  contour: '#3a1a02',
  face: '#fdc003',
  eclat: '#fff1a8',
  creux: '#e8a300',
  tranche: '#fe9301',
  trancheSombre: '#c45f00',
  etincelle: '#fff6cf',
}

type Pile = { cx: number; base: number; pieces: number }

/** Les piles de chaque palier, du fond vers l'avant. `base` = ligne du bas de la pile. */
const PALIERS: Pile[][] = [
  [{ cx: 14, base: 21, pieces: 2 }],
  [{ cx: 14, base: 22, pieces: 4 }],
  [
    { cx: 17.5, base: 20, pieces: 5 },
    { cx: 10.5, base: 23, pieces: 3 },
  ],
  [
    { cx: 14, base: 19, pieces: 7 },
    { cx: 8.5, base: 23, pieces: 4 },
    { cx: 19.5, base: 24, pieces: 3 },
  ],
  [
    { cx: 14, base: 18, pieces: 8 },
    { cx: 8, base: 22, pieces: 6 },
    { cx: 20, base: 23, pieces: 5 },
    { cx: 14, base: 26, pieces: 2 },
  ],
]

const RX = 5.6
const RY = 2.1
const EPAISSEUR = 2

function dansEllipse(x: number, y: number, cx: number, cy: number) {
  const dx = (x + 0.5 - cx) / RX
  const dy = (y + 0.5 - cy) / RY
  return dx * dx + dy * dy <= 1
}

/** La grille de couleurs d'un palier (null = transparent). */
function grille(niveau: number): (string | null)[][] {
  const g: (string | null)[][] = Array.from({ length: G }, () => Array<string | null>(G).fill(null))
  for (const pile of PALIERS[Math.max(0, Math.min(PALIERS.length - 1, niveau - 1))]) {
    for (let p = 0; p < pile.pieces; p++) {
      // Le centre de la face du dessus de cette pièce.
      const cy = pile.base - EPAISSEUR - RY - p * EPAISSEUR
      for (let y = 0; y < G; y++) {
        for (let x = 0; x < G; x++) {
          const face = dansEllipse(x, y, pile.cx, cy)
          const dessus = pile.pieces - 1 === p
          if (face) {
            const dx = x + 0.5 - pile.cx
            const dy = y + 0.5 - cy
            // Le relief de la pièce du dessus : un anneau en creux et un éclat en haut à gauche.
            const interieur = (dx / (RX - 1.6)) ** 2 + (dy / (RY - 0.7)) ** 2 <= 1
            g[y][x] = dx < -1.5 && dy < 0 ? COULEURS.eclat : dessus && !interieur ? COULEURS.creux : COULEURS.face
          } else if (dansEllipse(x, y, pile.cx, cy + 1)) {
            g[y][x] = COULEURS.tranche
          } else if (dansEllipse(x, y, pile.cx, cy + 2)) {
            g[y][x] = COULEURS.trancheSombre
          }
        }
      }
    }
  }
  // Le contour : toute case vide qui touche une case pleine.
  const contour: [number, number][] = []
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++) {
      if (g[y][x]) continue
      const voisins = [g[y - 1]?.[x], g[y + 1]?.[x], g[y]?.[x - 1], g[y]?.[x + 1]]
      if (voisins.some((v) => v && v !== COULEURS.contour)) contour.push([x, y])
    }
  for (const [x, y] of contour) g[y][x] = COULEURS.contour
  // Le trésor brille.
  if (niveau >= 5) {
    for (const [x, y] of [
      [4, 4], [3, 4], [5, 4], [4, 3], [4, 5],
      [23, 7], [22, 7], [24, 7], [23, 6], [23, 8],
      [25, 2],
    ])
      if (!g[y][x]) g[y][x] = COULEURS.etincelle
  }
  return g
}

/** Les cases d'une même ligne et d'une même couleur, fusionnées : quelques dizaines de rectangles au lieu de centaines. */
function rectangles(niveau: number) {
  const g = grille(niveau)
  const r: { x: number; y: number; l: number; c: string }[] = []
  for (let y = 0; y < G; y++) {
    let x = 0
    while (x < G) {
      const c = g[y][x]
      if (!c) {
        x++
        continue
      }
      let l = 1
      while (x + l < G && g[y][x + l] === c) l++
      r.push({ x, y, l, c })
      x += l
    }
  }
  return r
}

export function IconeCoins({ niveau, taille = 64, className = '' }: { niveau: number; taille?: number; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      width={taille}
      height={taille}
      shapeRendering="crispEdges"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      {rectangles(niveau).map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.l} height={1} fill={p.c} />
      ))}
    </svg>
  )
}
