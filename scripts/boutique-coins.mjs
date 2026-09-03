/**
 * La boutique après le 03/09/2026 : plus aucun kit en vente.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  CE QUE LE SCRIPT FAIT
 * ═══════════════════════════════════════════════════════════════════════
 *   1. Retire de la vente le pack de kits exclusifs (16 €). Les seize
 *      exclusifs s'obtiennent en jouant, comme les vingt-trois autres.
 *   2. Crée cinq packs de coins, au prix unitaire dégressif.
 *
 * On ne SUPPRIME pas le pack de kits : des commandes passées le
 * référencent peut-être (LigneCommande). On le rend invisible et non
 * achetable — l'historique reste lisible, la vitrine est propre.
 *
 * IDEMPOTENT : `upsert` sur le slug, relançable sans effet de bord.
 * Les tebexPackageId ne sont JAMAIS touchés : ils viennent de ton
 * panneau Tebex, pas d'ici.
 *
 *   node scripts/boutique-coins.mjs           # aperçu
 *   node scripts/boutique-coins.mjs --ecrire  # applique
 */
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()
const ECRIRE = process.argv.includes('--ecrire')

/*
 * LES CINQ PALIERS.
 *
 * Le prix aux 1 000 coins baisse à chaque palier : 0,80 € pour le plus
 * petit, 0,50 € pour le plus gros. C'est ce que « plus on en prend, moins
 * c'est cher » veut dire concrètement, et le site l'affiche noir sur
 * blanc plutôt que de le laisser deviner.
 *
 * Repères de l'économie en jeu, pour situer les montants :
 *   500 coins    offerts à l'arrivée
 *   1 000        offerts en liant son Discord
 *   500 à 2 000  les kits d'entrée
 *   12 000       les kits de haut de tableau
 *   25 000       n'importe lequel des seize exclusifs
 *
 * Le palier « Coffret » à 10 € couvre donc un peu plus d'un exclusif, et
 * le « Coffre » à 20 € en couvre deux. C'est volontaire : les paliers
 * doivent correspondre à quelque chose que le joueur veut, pas à des
 * chiffres ronds arbitraires.
 */
const PACKS = [
  {
    slug: 'coins-poignee', nom: 'Une poignée', coins: 2500, prix: 200,
    description: "De quoi débloquer un premier kit d'entrée et voir si le serveur te plaît.",
  },
  {
    slug: 'coins-bourse', nom: 'Une bourse', coins: 7000, prix: 500,
    description: 'Trois ou quatre kits classiques, ou un bon kit de milieu de tableau.',
  },
  {
    slug: 'coins-coffret', nom: 'Un coffret', coins: 15000, prix: 1000,
    description: 'Un kit exclusif à portée, ou la moitié du catalogue classique.',
  },
  {
    slug: 'coins-coffre', nom: 'Un coffre', coins: 35000, prix: 2000,
    description: 'Deux exclusifs, ou un exclusif et tout ce qui te manque en dessous.',
  },
  {
    slug: 'coins-tresor', nom: 'Un trésor', coins: 100000, prix: 5000,
    description: 'Quatre exclusifs. Le meilleur prix aux 1 000 coins de la boutique.',
  },
]

async function main() {
  console.log(ECRIRE ? '── ÉCRITURE ──\n' : "── APERÇU (rien n'est écrit) ──\n")

  // ---- 1. le pack de kits sort de la vitrine ----
  const ancien = await prisma.pack.findMany({ where: { kits: { some: {} } } })
  for (const p of ancien) {
    console.log(`RETIRÉ  ${p.slug.padEnd(22)} ${(p.prixEurosCentimes / 100).toFixed(2)} €  (contenait des kits)`)
    if (ECRIRE) {
      await prisma.pack.update({
        where: { id: p.id },
        data: { visible: false, achetable: false },
      })
    }
  }

  // ---- 2. les cinq paliers de coins ----
  console.log('\nPACKS DE COINS')
  console.log('  slug                    coins      prix    €/1000')
  console.log('  ' + '─'.repeat(52))
  let ordre = 1
  for (const p of PACKS) {
    const parMille = (p.prix / 100 / (p.coins / 1000)).toFixed(2)
    console.log(`  ${p.slug.padEnd(22)} ${String(p.coins).padStart(7)} ${(p.prix / 100).toFixed(2).padStart(8)} € ${parMille.padStart(8)} €`)
    if (!ECRIRE) { ordre++; continue }

    const base = {
      nom: p.nom,
      description: p.description,
      coins: p.coins,
      prixEurosCentimes: p.prix,
    }
    await prisma.pack.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...base, ordre: ordre, visible: true, achetable: true },
      // À la mise à jour : ni l'ordre ni les drapeaux, ils t'appartiennent.
      update: base,
    })
    ordre++
  }

  const visibles = await prisma.pack.count({ where: { visible: true } })
  const kitsVendus = await prisma.kit.count({ where: { achetable: true } })
  console.log(`\nPacks visibles : ${visibles} · Kits vendus en euros : ${kitsVendus}`)
}

main()
  .catch((e) => { console.error('ÉCHEC :', e.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
