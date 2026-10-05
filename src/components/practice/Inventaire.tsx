import { SPRITES } from '@/lib/items-sprites'
import { t, type Locale } from '@/lib/i18n'
import type { InventaireFin, ObjetInventaire } from '@/lib/practice'

/**
 * L'INVENTAIRE DE FIN D'UN JOUEUR, EN GRILLE D'ITEMS (05/10/2026).
 *
 * Les icônes sont les textures du client 1.8.9, une petite image par item dans
 * /public/items (voir outils/generer-items.py) : jamais d'image en base64 dans
 * la page. Un item sans icône connue s'affiche en abrégé.
 */

const ENCHANTS: Record<string, string> = {
  DAMAGE_ALL: 'Sharpness', DAMAGE_UNDEAD: 'Smite', DAMAGE_ARTHROPODS: 'Bane of Arthropods', KNOCKBACK: 'Knockback',
  FIRE_ASPECT: 'Fire Aspect', LOOT_BONUS_MOBS: 'Looting', PROTECTION_ENVIRONMENTAL: 'Protection',
  PROTECTION_FIRE: 'Fire Protection', PROTECTION_FALL: 'Feather Falling', PROTECTION_EXPLOSIONS: 'Blast Protection',
  PROTECTION_PROJECTILE: 'Projectile Protection', THORNS: 'Thorns', DEPTH_STRIDER: 'Depth Strider',
  OXYGEN: 'Respiration', WATER_WORKER: 'Aqua Affinity', DIG_SPEED: 'Efficiency', SILK_TOUCH: 'Silk Touch',
  DURABILITY: 'Unbreaking', LOOT_BONUS_BLOCKS: 'Fortune', ARROW_DAMAGE: 'Power', ARROW_KNOCKBACK: 'Punch',
  ARROW_FIRE: 'Flame', ARROW_INFINITE: 'Infinity', LUCK: 'Luck of the Sea', LURE: 'Lure',
}
const ROMAINS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

/** « MUSHROOM_SOUP » -> « Mushroom Soup ». */
function nomLisible(type: string): string {
  return type
    .toLowerCase()
    .split('_')
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
    .join(' ')
}

function sprite(o: ObjetInventaire): string | undefined {
  const d = o.d ?? 0
  if (o.t === 'POTION' && (d & 16384) !== 0) return SPRITES['POTION:splash']
  return SPRITES[`${o.t}:${d}`] ?? SPRITES[o.t]
}

function infobulle(o: ObjetInventaire): string {
  const lignes = [o.nm || nomLisible(o.t)]
  for (const [e, niveau] of Object.entries(o.e ?? {})) lignes.push(`${ENCHANTS[e] ?? nomLisible(e)} ${ROMAINS[niveau] ?? niveau}`)
  if (o.n > 1) lignes.push(`× ${o.n}`)
  return lignes.join('\n')
}

function Case({ o }: { o: ObjetInventaire | null | undefined }) {
  if (!o) return <span className="aspect-square rounded-micro border border-bord/70 bg-nuit/70" />
  const image = sprite(o)
  const enchante = o.e && Object.keys(o.e).length > 0
  return (
    <span
      title={infobulle(o)}
      className={`relative grid aspect-square place-items-center rounded-micro border bg-nuit/70 ${
        enchante ? 'border-[#a46bff]/70 shadow-[inset_0_0_10px_rgba(164,107,255,.45)]' : 'border-bord/70'
      }`}
    >
      {image ? (
        <span
          aria-hidden
          className="block size-[72%] bg-top bg-no-repeat [background-size:100%_auto] [image-rendering:pixelated]"
          style={{ backgroundImage: `url(/items/${image}.png)` }}
        />
      ) : (
        <span className="px-0.5 text-center font-mono text-[8px] leading-tight text-gris">{nomLisible(o.t).slice(0, 10)}</span>
      )}
      {o.n > 1 && (
        <span className="absolute right-0.5 bottom-0 font-mono text-[9px] font-bold sm:text-[11px] text-creme [text-shadow:1px_1px_0_#000]">
          {o.n}
        </span>
      )}
    </span>
  )
}

export function Inventaire({ inventaire, locale }: { inventaire: InventaireFin | null; locale: Locale }) {
  if (!inventaire) {
    return (
      <p className="rounded-carte border border-dashed border-bord px-5 py-10 text-center font-mono text-[12px] text-gris">
        {t(locale, 'pr.match-inventaire-absent')}
      </p>
    )
  }
  const casesDe = (debut: number, fin: number) => Array.from({ length: fin - debut }, (_, k) => inventaire.i[debut + k])
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,9fr)] gap-3">
      <div>
        <p className="mb-1.5 font-mono text-[9.5px] tracking-[.14em] text-gris uppercase">{t(locale, 'pr.match-armure')}</p>
        <div className="grid gap-1">
          {[0, 1, 2, 3].map((k) => (
            <Case key={k} o={inventaire.a[k]} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 font-mono text-[9.5px] tracking-[.14em] text-gris uppercase">&nbsp;</p>
        <div className="grid grid-cols-9 gap-1">
          {casesDe(9, 36).map((o, k) => (
            <Case key={k} o={o} />
          ))}
        </div>
        <p className="mt-2.5 mb-1.5 font-mono text-[9.5px] tracking-[.14em] text-gris uppercase">{t(locale, 'pr.match-barre')}</p>
        <div className="grid grid-cols-9 gap-1">
          {casesDe(0, 9).map((o, k) => (
            <Case key={k} o={o} />
          ))}
        </div>
      </div>
    </div>
  )
}
