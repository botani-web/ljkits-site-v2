/**
 * Crée les grades LJ+ et LJ++ de la saison 2 (16/10/2026) dans la table Grade,
 * avec leurs avantages tels qu'affichés en jeu (/ljplus, lang de LJBoutique).
 *
 * Idempotent : un grade déjà présent n'est pas recréé. Créés NON achetables et
 * sans package Tebex : ils deviennent payables quand l'admin renseigne le
 * package dans /admin/grades et coche « achetable ».
 *
 * Lancement : npx tsx --env-file=.env scripts/ajouter-grades-ljplus.mts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const GRADES = [
  {
    slug: 'ljplus',
    nom: 'LJ+',
    sousTitre: 'à vie',
    sousTitreEn: 'lifetime',
    prixEurosCentimes: 2500,
    ordre: 10,
    heriteDuPrecedent: false,
    avantages: [
      ['Grade LJ+ dans le chat et le tab', 'LJ+ rank in chat and tab'],
      ['Pseudo en jaune', 'Name in yellow'],
      ['Coins x1,5 à chaque kill en FFA', 'Coins x1.5 on every FFA kill'],
      ['3 anneaux de particules au lobby', '3 particle rings in the lobby'],
      ['/fly au lobby', '/fly in the lobby'],
      ['Rôle Discord et son salon', 'Discord role and its channel'],
    ],
  },
  {
    slug: 'ljplusplus',
    nom: 'LJ++',
    sousTitre: 'à vie · amélioration de LJ+',
    sousTitreEn: 'lifetime · LJ+ upgrade',
    prixEurosCentimes: 1000,
    ordre: 11,
    heriteDuPrecedent: true,
    avantages: [
      ['Tout ce que donne LJ+', 'Everything LJ+ gives'],
      ['Grade LJ++ partout (chat, tab, pseudo)', 'LJ++ rank everywhere (chat, tab, name)'],
      ['Pseudo doré', 'Name in gold'],
      ['Coins x2 à chaque kill en FFA', 'Coins x2 on every FFA kill'],
      ['Les 11 anneaux de particules', 'All 11 particle rings'],
      ['Le kit Hitsugi en FFA', 'The Hitsugi kit in FFA'],
      ['Particules et message de mort exclusifs', 'Exclusive death particles and message'],
    ],
  },
]

for (const g of GRADES) {
  const existe = await prisma.grade.findUnique({ where: { slug: g.slug } })
  if (existe) {
    console.log(`${g.slug} : déjà là, rien à faire`)
    continue
  }
  await prisma.grade.create({
    data: {
      slug: g.slug,
      nom: g.nom,
      sousTitre: g.sousTitre,
      sousTitreEn: g.sousTitreEn,
      prixEurosCentimes: g.prixEurosCentimes,
      ordre: g.ordre,
      visible: true,
      achetable: false,
      heriteDuPrecedent: g.heriteDuPrecedent,
      avantages: { create: g.avantages.map(([texte, texteEn], ordre) => ({ texte, texteEn, ordre })) },
    },
  })
  console.log(`${g.slug} : créé`)
}
await prisma.$disconnect()
