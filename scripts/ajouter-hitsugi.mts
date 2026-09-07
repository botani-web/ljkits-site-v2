/**
 * Ajoute le kit Hitsugi en base, SANS relancer le seed complet.
 *
 * Le seed réécrit chaque kit qu'il connaît : le lancer en entier effacerait
 * toute retouche faite depuis l'admin. Ce script ne touche que Hitsugi et
 * l'avantage correspondant du grade Shogun. Il est idempotent.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CARACTERISTIQUES = [
  { libelle: 'Incantation', valeur: '1 s · esquivable' },
  { libelle: 'Étouffement', valeur: '5 s' },
  { libelle: 'Portée', valeur: '5 blocs' },
  { libelle: 'Recharge', valeur: '60 s' },
]

const AVANTAGE_SHOGUN = 'Le kit Hitsugi, réservé au grade'

const KIT = {
  slug: 'hitsugi',
  nom: 'Hitsugi',
  kanji: '棺',
  role: 'Enfermement',
  descriptionCourte:
    "Un cercueil d'obsidienne se referme sur ta cible. Elle étouffe, et tu continues de frapper.",
  descriptionLongue: `Vise un joueur, clic droit. Pendant **une seconde**, des braises tournent autour de lui : c'est le seul moment où il peut encore décrocher. S'il reste, le piège se referme.

Des murets montent au sol, l'eau et la lave se rencontrent, l'obsidienne prend. Le bloc qui se forme à hauteur de tête l'**étouffe** — la vraie suffocation du jeu, pas un effet maison.

Le sol reste en murets : ta cible ne peut plus avancer d'un pouce, mais toi tu vois ses jambes et tu frappes. **Cinq secondes** plus tard, tout se fissure et disparaît sans laisser une trace sur la map.

Une soupe rend plus de vie qu'une seconde d'étouffement n'en retire : ta cible peut s'en sortir. Elle y laissera son stack entier, sous tes coups. Ce kit ne tue pas tout seul — il ouvre la fenêtre.`,
  prixCoins: 0,
  prixEurosCentimes: null,
  type: 'EXCLUSIF' as const,
  achetable: false,
  kitDeDepart: false,
  visible: true,
  bientot: false,
}

async function main() {
  const existant = await prisma.kit.findUnique({ where: { slug: KIT.slug } })

  // Un kit déjà en base garde sa position : l'admin a pu le déplacer.
  const dernier = await prisma.kit.findFirst({ orderBy: { ordre: 'desc' } })
  const ordre = existant?.ordre ?? (dernier ? dernier.ordre + 1 : 0)

  const kit = await prisma.kit.upsert({
    where: { slug: KIT.slug },
    create: { ...KIT, ordre },
    update: { ...KIT, ordre },
  })
  await prisma.caracteristiqueKit.deleteMany({ where: { kitId: kit.id } })
  await prisma.caracteristiqueKit.createMany({
    data: CARACTERISTIQUES.map((c, position) => ({ kitId: kit.id, ...c, ordre: position })),
  })
  console.log(`${existant ? 'mis à jour' : 'créé'} : ${kit.nom} (ordre ${kit.ordre}, ${CARACTERISTIQUES.length} caractéristiques)`)

  const shogun = await prisma.grade.findUnique({
    where: { slug: 'shogun' },
    include: { avantages: { orderBy: { ordre: 'asc' } } },
  })
  if (!shogun) {
    console.log('grade shogun introuvable : avantage non ajouté')
  } else if (shogun.avantages.some((a) => a.texte === AVANTAGE_SHOGUN)) {
    console.log('avantage Shogun : déjà présent')
  } else {
    await prisma.avantageGrade.create({
      data: {
        gradeId: shogun.id,
        texte: AVANTAGE_SHOGUN,
        ordre: shogun.avantages.length,
      },
    })
    console.log(`avantage ajouté au grade Shogun : « ${AVANTAGE_SHOGUN} »`)
  }

  // Contrôle : le pack ne doit PAS avoir avalé le kit de grade.
  const packs = await prisma.pack.findMany({ include: { kits: { select: { slug: true } } } })
  for (const pack of packs) {
    const dedans = pack.kits.some((k) => k.slug === KIT.slug)
    console.log(`pack « ${pack.nom} » : ${pack.kits.length} kits, Hitsugi ${dedans ? '⚠ DEDANS' : 'absent ✔'}`)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
