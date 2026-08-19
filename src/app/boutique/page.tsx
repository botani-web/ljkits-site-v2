import type { Metadata } from 'next'

import { Boutique } from '@/components/boutique/Boutique'
import type { GradeBoutique, KitBoutique, PackBoutique } from '@/components/boutique/types'
import { PagePublique } from '@/components/public/PagePublique'
import { prisma } from '@/lib/prisma'
import { IMAGE_OG } from '@/lib/site'

export const revalidate = 3600 // une heure

export const metadata: Metadata = {
  title: 'Boutique',
  description:
    'Soutiens LJKITS et débloque des kits maison et des cosmétiques. Tout le contenu reste obtenable en jeu, sans payer.',
  openGraph: {
    type: 'website',
    title: 'Boutique — LJKITS',
    description: 'Soutiens le serveur. Aucun avantage en combat, jamais.',
    url: '/boutique',
    images: IMAGE_OG,
  },
}

export default async function PageBoutique() {
  // Trois lectures indépendantes, lancées en parallèle.
  const [gradesEnBase, kitsEnBase, packsEnBase] = await Promise.all([
    prisma.grade.findMany({
      where: { visible: true },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
      include: { avantages: { orderBy: { ordre: 'asc' }, select: { texte: true } } },
    }),
    // Un kit n'est proposé ici que s'il est explicitement mis en vente ET
    // qu'il a un prix en euros. `bientot` ne l'exclut pas : il s'affiche,
    // mais son bouton est inerte.
    prisma.kit.findMany({
      where: { visible: true, achetable: true, prixEurosCentimes: { not: null } },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    }),
    prisma.pack.findMany({
      where: { visible: true },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    }),
  ])

  // « Tout le grade X » : X est le grade juste avant dans l'ordre. Le calcul
  // est fait ici plutôt que dans le composant client, qui n'a pas à connaître
  // la règle.
  const grades: GradeBoutique[] = gradesEnBase.map((grade, index) => ({
    slug: grade.slug,
    nom: grade.nom,
    kanji: grade.kanji,
    sousTitre: grade.sousTitre,
    etiquette: grade.etiquette,
    prixEurosCentimes: grade.prixEurosCentimes,
    achetable: grade.achetable,
    avantages: grade.avantages.map((avantage) => avantage.texte),
    heriteDe: grade.heriteDuPrecedent && index > 0 ? gradesEnBase[index - 1].nom : null,
  }))

  const kits: KitBoutique[] = kitsEnBase.map((kit) => ({
    slug: kit.slug,
    nom: kit.nom,
    kanji: kit.kanji,
    role: kit.role,
    descriptionCourte: kit.descriptionCourte,
    prixCoins: kit.prixCoins,
    // Le `where` ci-dessus garantit que ce n'est pas null ; TypeScript ne le
    // sait pas, d'où le `?? 0` défensif.
    prixEurosCentimes: kit.prixEurosCentimes ?? 0,
    bientot: kit.bientot,
    achetable: kit.achetable,
  }))

  const packs: PackBoutique[] = packsEnBase.map((pack) => ({
    slug: pack.slug,
    nom: pack.nom,
    description: pack.description,
    prixEurosCentimes: pack.prixEurosCentimes,
    prixBarreCentimes: pack.prixBarreCentimes,
    achetable: pack.achetable,
  }))

  return (
    <PagePublique>
      <header className="halo-hero overflow-hidden px-6 pt-[150px] pb-2">
        <div className="mx-auto max-w-contenu text-center">
          <p className="mb-3.5 font-mono text-xs font-bold tracking-[3px] text-oni uppercase [text-shadow:0_0_18px_rgba(233,40,19,.35)]">
            Soutenir le serveur
          </p>
          <h1 className="font-titre text-[clamp(30px,5vw,54px)] leading-[1.05] uppercase">
            La boutique <span className="texte-accent">LJKITS</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[17px] text-gris">
            Des cosmétiques et des kits maison. Rien qui ne se gagne aussi à la soupe et à
            l’épée.
          </p>

          <div className="mx-auto mt-9 flex max-w-[860px] items-start gap-4 rounded-[10px] border border-bord bg-charbon px-6 py-5 text-left">
            <div
              aria-hidden="true"
              className="pt-0.5 font-titre text-xl leading-none text-vert"
            >
              ✓
            </div>
            <div>
              <h2 className="mb-1.5 text-[15.5px] font-bold">
                Zéro pay-to-win, et c’est vérifiable
              </h2>
              <p className="text-[14.5px] text-gris">
                Chaque kit vendu ici s’obtient{' '}
                <strong className="font-semibold text-white">aussi en coins</strong>, gagnés en
                jouant — le prix en jeu est affiché sur chaque carte. Les grades ne donnent{' '}
                <strong className="font-semibold text-white">
                  aucun avantage en combat
                </strong>{' '}
                : que du cosmétique et du confort.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-contenu px-6">
        <Boutique grades={grades} kits={kits} packs={packs} />
      </main>
    </PagePublique>
  )
}
