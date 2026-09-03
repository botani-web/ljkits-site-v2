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
 * ═════════════════════════════════════════════════════════════════════
 *  CALÉS SUR CE QUE COÛTE LE CATALOGUE, PAS SUR DES CHIFFRES RONDS
 * ═════════════════════════════════════════════════════════════════════
 * Relevé du 03/09/2026 dans kits.yml :
 *
 *   498 500 coins   les trente-neuf kits, tout compris
 *   400 000         les seize exclusifs
 *    98 500         les vingt-trois classiques
 *    25 000         n'importe quel exclusif
 *    12 000         le plus cher des classiques
 *
 * Première version : 100 000 coins pour 50 €, soit quatre exclusifs — un
 * cinquième du catalogue pour le plus gros palier de la boutique. Cher
 * pour peu, et surtout illisible : personne ne sait ce que « 100 000
 * coins » lui donne.
 *
 * Chaque palier correspond maintenant à une phrase que le joueur peut se
 * dire : « un exclusif », « les trois quarts des classiques », « tout ».
 * Le prix aux 1 000 coins passe de 0,20 € à 0,073 € du plus petit au plus
 * gros — le dégressif est réel, et affiché sur chaque carte.
 */
const PACKS = [
  {
    slug: 'coins-poignee', nom: 'Une poignée', coins: 10000, prix: 200,
    description: 'Deux ou trois kits classiques, de quoi varier ton jeu.',
  },
  {
    slug: 'coins-bourse', nom: 'Une bourse', coins: 30000, prix: 500,
    description: "N'importe lequel des seize exclusifs, ou cinq kits classiques.",
  },
  {
    slug: 'coins-coffret', nom: 'Un coffret', coins: 75000, prix: 1000,
    description: 'Les trois quarts du catalogue classique, ou trois exclusifs.',
  },
  {
    slug: 'coins-coffre', nom: 'Un coffre', coins: 200000, prix: 2000,
    description: 'Huit exclusifs. La moitié de ce qui se débloque sur le serveur.',
  },
  {
    slug: 'coins-tresor', nom: 'Un trésor', coins: 550000, prix: 4000,
    description: 'Tout. Les trente-neuf kits, exclusifs compris, et il en reste.',
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
