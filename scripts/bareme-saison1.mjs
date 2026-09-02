import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Le barème de la saison 1, en coins. Les kits ne se vendent plus en
 * euros : seuls les coins et les grades sont en boutique.
 */
const BAREME = {
  'PvP': 0, 'Anti-Stomper': 0,
  'Fireman': 500, 'Camel': 500, 'Magma': 500, 'Archer': 500, 'Viper': 500,
  'Sponger': 2000, 'Anchor': 2000, 'Berserker': 2000, 'Monk': 2000,
  'Grand-Pa': 2000, 'Reaper': 2000,
  'Fisherman': 6000, 'Vampire': 6000, 'Spiderman': 6000, 'Thor': 6000,
  'Gladiator': 6000, 'Ninja': 6000,
  'Stomper': 12000, 'Kangaroo': 12000, 'Switcher': 12000, 'Phantom': 12000,
  'Sakura': 25000, 'Yumi': 25000, 'Tanuki': 25000, 'Kenshi': 25000,
  'Onryo': 25000, 'Kitsune': 25000,
}

const kits = await prisma.kit.findMany({ select: { id: true, nom: true, prixCoins: true } })
let modifies = 0, inconnus = []

for (const kit of kits) {
  const prix = BAREME[kit.nom]
  if (prix === undefined) { inconnus.push(kit.nom); continue }
  await prisma.kit.update({
    where: { id: kit.id },
    data: {
      prixCoins: prix,
      // PLUS AUCUN KIT EN VENTE. Tout passe par les coins, gagnes en
      // jeu ou achetes en boutique. On vide aussi le prix en euros :
      // le laisser afficherait un montant que plus rien n'honore.
      prixEurosCentimes: null,
      achetable: false,
    },
  })
  if (kit.prixCoins !== prix) modifies++
}

console.log(`${kits.length} kits traites, ${modifies} prix modifies, vente en euros retiree partout.`)
if (inconnus.length) console.log('Absents du bareme :', inconnus.join(', '))
await prisma.$disconnect()
