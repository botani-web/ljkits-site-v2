import type { Metadata } from 'next'

import { BandeauPositionnement } from '@/components/boutique/BandeauPositionnement'
import { Boutique } from '@/components/boutique/Boutique'
import type { GradeBoutique, KitBoutique, PackBoutique } from '@/components/boutique/types'
import { PagePublique } from '@/components/public/PagePublique'
import { prisma } from '@/lib/prisma'
import { IMAGE_OG } from '@/lib/site'

export const revalidate = 3600 // une heure

export const metadata: Metadata = {
  title: 'Boutique',
  description:
    'Soutiens LJKITS et débloque des kits et des cosmétiques. Tout le contenu reste obtenable en jeu, sans payer.',
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
    // qu'il a un prix en euros. Le filtre ne distingue pas les classiques des
    // exclusifs : c'est `type` qui les range ensuite dans l'un ou l'autre
    // rayon, côté client. `bientot` n'exclut pas non plus : le kit s'affiche,
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
    paiementPret: grade.tebexPackageId !== null,
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
    type: kit.type,
    bientot: kit.bientot,
    achetable: kit.achetable,
    paiementPret: kit.tebexPackageId !== null,
  }))

  const packs: PackBoutique[] = packsEnBase.map((pack) => ({
    slug: pack.slug,
    nom: pack.nom,
    description: pack.description,
    prixEurosCentimes: pack.prixEurosCentimes,
    prixBarreCentimes: pack.prixBarreCentimes,
    achetable: pack.achetable,
    paiementPret: pack.tebexPackageId !== null,
  }))

  return (
    <PagePublique>
      {/*
        Le bandeau passe AVANT le hero, et pas dans un encart sous le titre :
        c'est l'argument central du serveur, il se lit avant le mot
        « boutique ». Le pt- dégage la barre de navigation flottante.
      */}
      <div className="px-6 pt-10">
        <BandeauPositionnement />
      </div>

      <header className="halo-hero overflow-hidden px-6 pt-8 pb-2">
        <div className="mx-auto max-w-contenu text-center">
          <p className="mb-3.5 font-mono text-xs font-bold tracking-[3px] text-oni uppercase [text-shadow:0_0_18px_rgba(233,40,19,.35)]">
            Soutenir le serveur
          </p>
          <h1 className="font-titre text-[clamp(28px,5vw,54px)] leading-[1.05] uppercase">
            La boutique <span className="texte-accent">LJKITS</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[16px] text-gris sm:text-[17px]">
            Des cosmétiques et des kits. Rien qui ne se gagne aussi à la soupe et à l’épée.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-contenu px-6">
        <Boutique grades={grades} kits={kits} packs={packs} />
      </main>
    </PagePublique>
  )
}
