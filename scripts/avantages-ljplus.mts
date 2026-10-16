/**
 * Les avantages COMPLETS de LJ+ et LJ++ (16/10/2026), relevés dans le code des
 * plugins et pas seulement dans le menu /ljplus :
 *   LJRank Economie (coins x1,5 / x2), LJHGLien RunsPerso (parties privées de
 *   HG Run), LJPractice Parties (party de 12, annonce de party LJ++), LJBoutique
 *   (anneaux /disguise, kit Hitsugi, cosmétiques exclusifs), /fly au lobby, LJTab
 *   et LJChat (grade et couleur), rôle Discord.
 * Remplace la liste d'avantages des grades `ljplus` et `ljplusplus`.
 *
 * Lancement : npx tsx --env-file=.env scripts/avantages-ljplus.mts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const AVANTAGES: Record<string, [string, string][]> = {
  ljplus: [
    ['Grade LJ+ dans le chat et le tab, pseudo en jaune', 'LJ+ rank in chat and tab, name in yellow'],
    ['Coins x1,5 à chaque kill en FFA', 'Coins x1.5 on every FFA kill'],
    ['Parties privées de HG Run : crée ta partie, invite tes amis, choisis le format', 'Private HG Run games: create your game, invite your friends, pick the format'],
    ['Party jusqu’à 12 joueurs (au lieu de 8)', 'Parties of up to 12 players (instead of 8)'],
    ['/fly au lobby', '/fly in the lobby'],
    ['3 anneaux de particules au lobby (/disguise)', '3 particle rings in the lobby (/disguise)'],
    ['Rôle Discord et son salon', 'Discord role and its channel'],
  ],
  ljplusplus: [
    ['Tout ce que donne LJ+ (HG Run privé, party de 12, /fly…)', 'Everything LJ+ gives (private HG Run, 12-player party, /fly…)'],
    ['Grade LJ++ partout, pseudo doré', 'LJ++ rank everywhere, name in gold'],
    ['Coins x2 à chaque kill en FFA (au lieu de x1,5)', 'Coins x2 on every FFA kill (instead of x1.5)'],
    ['Les 11 anneaux de particules au lobby', 'All 11 particle rings in the lobby'],
    ['Annonce ta party à tout le serveur pour la remplir', 'Announce your party to the whole server to fill it'],
    ['Le kit Hitsugi en FFA', 'The Hitsugi kit in FFA'],
    ['Particules « Renard à neuf queues » et message de mort « Seigneur » en FFA', '“Nine-tailed fox” particles and “Warlord” death message in FFA'],
  ],
}

for (const [slug, liste] of Object.entries(AVANTAGES)) {
  const grade = await prisma.grade.findUnique({ where: { slug } })
  if (!grade) {
    console.log(`${slug} : introuvable`)
    continue
  }
  await prisma.$transaction([
    prisma.avantageGrade.deleteMany({ where: { gradeId: grade.id } }),
    prisma.avantageGrade.createMany({
      data: liste.map(([texte, texteEn], ordre) => ({ gradeId: grade.id, texte, texteEn, ordre })),
    }),
  ])
  console.log(`${slug} : ${liste.length} avantages`)
}
await prisma.$disconnect()
