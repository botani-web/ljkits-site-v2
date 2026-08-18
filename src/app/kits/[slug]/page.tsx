import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Badge, PrixKit } from '@/components/public/CarteKit'
import { PagePublique } from '@/components/public/PagePublique'
import { formaterEuros } from '@/lib/format'
import { markdownVersHtml } from '@/lib/markdown'
import { prisma } from '@/lib/prisma'
import { IMAGE_OG } from '@/lib/site'

export const revalidate = 3600 // une heure

/**
 * Pré-génère une page par kit visible au moment du build.
 * `dynamicParams` reste à sa valeur par défaut (true) : un kit créé depuis
 * l'admin après le déploiement sera rendu à la première visite.
 */
export async function generateStaticParams() {
  const kits = await prisma.kit.findMany({
    where: { visible: true },
    select: { slug: true },
  })

  return kits.map((kit) => ({ slug: kit.slug }))
}

/** Lecture partagée par generateMetadata() et le composant de page. */
async function lireKit(slug: string) {
  return prisma.kit.findFirst({
    where: { slug, visible: true },
    include: { caracteristiques: { orderBy: { ordre: 'asc' } } },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const kit = await lireKit(slug)

  if (!kit) return { title: 'Kit introuvable' }

  const titre = `${kit.nom} — ${kit.role}`

  return {
    title: kit.nom,
    description: kit.descriptionCourte,
    alternates: { canonical: `/kits/${kit.slug}` },
    openGraph: {
      type: 'article',
      title: `${titre} — LJKITS`,
      description: kit.descriptionCourte,
      url: `/kits/${kit.slug}`,
      images: IMAGE_OG,
    },
    twitter: {
      card: 'summary',
      title: `${titre} — LJKITS`,
      description: kit.descriptionCourte,
      images: IMAGE_OG,
    },
  }
}

export default async function PageKit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const kit = await lireKit(slug)

  // Kit inexistant ou masqué depuis l'admin : 404, pas de page vide.
  if (!kit) notFound()

  const exclusif = kit.type === 'EXCLUSIF'

  return (
    <PagePublique>
      <header className="halo-hero mx-auto max-w-lecture px-6 pt-[150px] text-center">
        <Link
          href="/kits"
          className="mb-5 inline-block font-mono text-[12.5px] tracking-wide text-gris uppercase transition-colors hover:text-creme"
        >
          ← Tous les kits
        </Link>

        <p
          className={`mb-3.5 font-mono text-xs font-bold tracking-[3px] uppercase ${
            exclusif
              ? 'text-violet'
              : 'text-oni [text-shadow:0_0_18px_rgba(233,40,19,.35)]'
          }`}
        >
          {kit.role}
          {exclusif && ' · Kit exclusif'}
        </p>

        <h1 className="font-titre text-[clamp(30px,5vw,54px)] leading-[1.06] uppercase">
          <span className={exclusif ? 'text-violet' : 'texte-accent'}>{kit.nom}</span>
          {/*
            Sur la carte de la grille, le kanji est un filigrane en couleur de
            bordure. Agrandi à la taille du titre il devenait illisible : ici on
            garde l'intention (discret) avec une couleur qui tient la route.
          */}
          {kit.kanji && (
            <span className="ml-4 font-mono text-[0.45em] text-violet/40" aria-hidden="true">
              {kit.kanji}
            </span>
          )}
        </h1>

        <p className="mx-auto mt-5 max-w-[560px] text-gris">{kit.descriptionCourte}</p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <PrixKit prixCoins={kit.prixCoins} taille="detail" />
          {kit.bientot && <Badge variante="bientot">Bientôt disponible</Badge>}
          {kit.kitDeDepart && <Badge variante="depart">Kit de départ</Badge>}
          {kit.prixEurosCentimes !== null && (
            <Badge variante="euro">ou {formaterEuros(kit.prixEurosCentimes)}</Badge>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-lecture gap-5 px-6 pt-14 pb-10 md:grid-cols-[1.5fr_1fr] md:items-start">
        {/* --- description longue, rédigée en Markdown depuis l'admin --- */}
        <article
          className="markdown rounded-2xl border border-bord bg-charbon px-7 py-7"
          dangerouslySetInnerHTML={{ __html: markdownVersHtml(kit.descriptionLongue) }}
        />

        {/* --- fiche technique --- */}
        {kit.caracteristiques.length > 0 && (
          <aside className="rounded-2xl border border-bord bg-charbon px-6 py-6">
            <h2 className="mb-4 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
              Fiche technique
            </h2>
            <dl className="flex flex-col gap-2.5">
              {kit.caracteristiques.map((carac) => (
                <div
                  key={carac.id}
                  className="flex justify-between gap-3 border-b border-bord pb-2.5 last:border-b-0 last:pb-0"
                >
                  <dt className="shrink-0 font-mono text-[10.5px] tracking-[1px] text-gris uppercase">
                    {carac.libelle}
                  </dt>
                  <dd className="text-right font-mono text-xs text-[#d8d2e2]">
                    {carac.valeur}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        )}
      </main>

      {/* --- rappel de la promesse « pas de pay-to-win » sur les exclusifs --- */}
      {exclusif && (
        <div className="mx-auto mb-20 max-w-lecture px-6">
          <p className="rounded-[10px] border border-[#3a2a55] border-l-[3px] border-l-violet bg-linear-[100deg] from-violet/6 to-transparent px-6 py-4 text-[14.5px] text-gris">
            <strong className="font-semibold text-white">Kit exclusif, pas kit supérieur.</strong>{' '}
            Il joue autrement, il ne frappe pas plus fort, et il s’obtient en coins comme
            tous les autres.
          </p>
        </div>
      )}
    </PagePublique>
  )
}
