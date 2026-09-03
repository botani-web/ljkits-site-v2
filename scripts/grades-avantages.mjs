/**
 * Remet les avantages des grades en accord avec le serveur.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  CE QUE LE SITE ANNONÇAIT ET QUI ÉTAIT FAUX
 * ═══════════════════════════════════════════════════════════════════════
 * Relevé du 03/09/2026, en lisant le code plutôt que l'ancienne fiche :
 *
 *   « Effet de particules à la mort — 7 chorégraphies »   (Samouraï)
 *   « Message de mort personnalisé — 7 styles »           (Samouraï)
 *      → FAUX. Les deux sont passés en boutique coins et sont
 *        achetables PAR TOUT LE MONDE (11 chorégraphies, 9 styles).
 *        LJBoutique ne teste aucune permission de grade.
 *
 *   « /stats <joueur> »                                    (Ronin)
 *      → FAUX. Cette commande n'existe pas. /profil et /history
 *        appartiennent à LJAdmin et sont réservées au staff.
 *
 *   « /duel — défie qui tu veux »                          (Shogun)
 *      → RETIRÉ le 03/09/2026 : le duel est ouvert à tous. Un 1v1
 *        consenti n'est pas un avantage, c'est une façon de jouer.
 *
 *   « Historique de tes 10 derniers combats »              (Shogun)
 *      → Le menu /elo l'affiche pour tout le monde.
 *
 * J'ai failli écrire « priorité de connexion quand le serveur est plein »
 * pour étoffer le Shogun. Vérification faite, aucun PlayerLoginEvent ne
 * traite les grades : ça n'existe pas. Ne rien inventer, même pour
 * remplir une carte — c'est exactement l'erreur qu'on corrige ici.
 *
 * Vendre un avantage qui n'existe pas est le pire défaut qu'une boutique
 * puisse avoir. Ne restent que des choses vérifiables dans le code.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  CE QUI RESTE, ET CE QU'ON MET EN AVANT
 * ═══════════════════════════════════════════════════════════════════════
 * Le multiplicateur de coins est le seul avantage MESURABLE, et de loin
 * le plus utile — il est codé dans Economie.java :
 *
 *   Ronin     ×1,15      Samouraï  ×1,30      Shogun  ×1,50
 *
 * Il passe donc en premier, avec ce qu'il donne concrètement plutôt
 * qu'un coefficient abstrait.
 *
 *   node scripts/grades-avantages.mjs --ecrire
 */
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()
const ECRIRE = process.argv.includes('--ecrire')

const GRADES = [
  {
    slug: 'ronin',
    etiquette: '+15 % de coins',
    avantages: [
      '+15 % de coins sur chaque kill, à vie',
      'Ton pseudo en blanc avec le symbole ❀ dans le chat et le tab',
      'Rôle et salon réservés sur le Discord',
      'Ton nom sur l’hologramme des soutiens, au spawn',
    ],
  },
  {
    slug: 'samourai',
    etiquette: '+30 % de coins',
    avantages: [
      '+30 % de coins sur chaque kill, à vie',
      'Ton pseudo en or : la couleur la plus visible du chat',
      'Tout ce que donne le Ronin',
    ],
  },
  {
    slug: 'shogun',
    etiquette: '+50 % de coins',
    avantages: [
      '+50 % de coins sur chaque kill, à vie',
      'Ton pseudo en violet, réservé au grade le plus haut',
      'Le multiplicateur le plus élevé du serveur',
      'Tout ce que donne le Samouraï',
    ],
  },
]

async function main() {
  console.log(ECRIRE ? '── ÉCRITURE ──\n' : "── APERÇU ──\n")
  for (const g of GRADES) {
    const grade = await prisma.grade.findUnique({
      where: { slug: g.slug },
      include: { avantages: true },
    })
    if (!grade) {
      console.log(`  ${g.slug} ABSENT`)
      continue
    }
    console.log(`${grade.nom} — ${(grade.prixEurosCentimes / 100).toFixed(2)} €  ·  étiquette « ${g.etiquette} »`)
    for (const a of g.avantages) console.log(`   ✓ ${a}`)
    const retires = grade.avantages.filter((a) => !g.avantages.includes(a.texte))
    for (const a of retires) console.log(`   ✗ ${a.texte}`)
    console.log()

    if (!ECRIRE) continue
    await prisma.grade.update({ where: { id: grade.id }, data: { etiquette: g.etiquette } })
    await prisma.avantageGrade.deleteMany({ where: { gradeId: grade.id } })
    await prisma.avantageGrade.createMany({
      data: g.avantages.map((texte, ordre) => ({ gradeId: grade.id, texte, ordre })),
    })
  }
}

main()
  .catch((e) => { console.error('ÉCHEC :', e.message); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
