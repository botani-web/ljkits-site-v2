import type { Metadata } from 'next'
import Image from 'next/image'

import { PagePublique } from '@/components/public/PagePublique'
import { formaterDate } from '@/lib/format'
import { markdownVersHtml } from '@/lib/markdown'
import { prisma } from '@/lib/prisma'
import { lireReglages } from '@/lib/reglages'
import { IMAGE_OG } from '@/lib/site'

export const revalidate = 3600 // une heure

export const metadata: Metadata = {
  title: 'Règlement',
  description:
    'Le règlement du serveur Minecraft PvP Soup LJKITS : triche, respect, stats, bugs, chat, sanctions.',
  openGraph: {
    type: 'article',
    title: 'Règlement — LJKITS',
    description:
      'Le règlement du serveur Minecraft PvP Soup LJKITS : triche, respect, stats, bugs, chat, sanctions.',
    url: '/reglement',
    images: IMAGE_OG,
  },
}

export default async function PageReglement() {
  // Seules les sections publiées sont lues : les brouillons restent en admin.
  const { discord } = await lireReglages()

  const sections = await prisma.sectionReglement.findMany({
    where: { publie: true },
    orderBy: { ordre: 'asc' },
  })

  // Date de dernière mise à jour = la plus récente des sections publiées.
  // Pas besoin de la stocker : elle se déduit.
  const derniereMaj = sections.reduce<Date | null>(
    (plusRecente, section) =>
      plusRecente === null || section.updatedAt > plusRecente ? section.updatedAt : plusRecente,
    null,
  )

  return (
    <PagePublique>
      <header className="halo-hero mx-auto max-w-lecture px-6 pt-14 text-center">
        <div className="mb-3.5 text-xs font-bold tracking-[3px] text-oni uppercase [text-shadow:0_0_18px_rgba(233,40,19,.35)]">
          Les règles du serveur
        </div>
        <h1 className="font-titre text-[clamp(30px,5vw,54px)] leading-[1.06] uppercase">
          Règlement <span className="texte-accent">LJKITS</span>
        </h1>
        <p className="mx-auto mt-5.5 max-w-[560px] text-gris">
          En jouant sur LJKITS, tu acceptes ces règles. Elles existent pour une seule raison :
          que le serveur reste agréable pour tout le monde.
        </p>
        {derniereMaj && (
          <p className="mt-5 font-mono text-[12.5px] text-gris">
            Dernière mise à jour :{' '}
            <time dateTime={derniereMaj.toISOString()}>{formaterDate(derniereMaj)}</time>
          </p>
        )}
      </header>

      <main className="mx-auto flex max-w-lecture flex-col gap-5.5 px-6 pt-14 pb-10">
        {sections.length === 0 ? (
          <p className="rounded-2xl border border-bord bg-charbon px-7 py-10 text-center text-gris">
            Le règlement est en cours de rédaction. Reviens d’ici peu.
          </p>
        ) : (
          sections.map((section, index) => (
            <section
              key={section.id}
              className="rounded-2xl border border-bord bg-charbon px-7.5 py-8 transition-colors hover:border-[#43305E]"
            >
              <div className="mb-4.5 flex items-center gap-4">
                <div
                  aria-hidden="true"
                  className="flex size-9.5 shrink-0 items-center justify-center rounded-[10px] bg-linear-[135deg] from-soupe to-or font-titre text-[15px] text-nuit"
                >
                  {index + 1}
                </div>
                <h2 className="font-titre text-[clamp(19px,2.6vw,25px)] leading-[1.15] uppercase">
                  {section.titre}
                </h2>
              </div>

              <div
                className="markdown"
                dangerouslySetInnerHTML={{ __html: markdownVersHtml(section.contenu, { discord }) }}
              />
            </section>
          ))
        )}
      </main>

      {/* --------------------- L'ESPRIT DU RÈGLEMENT --------------------- */}
      <div className="mx-auto mb-24 max-w-lecture px-6">
        <div className="relative flex items-center gap-6.5 overflow-hidden rounded-[18px] border border-bord bg-linear-[155deg] from-[#47101F] via-[#260921] to-[#150726] px-8.5 py-7.5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-15 -bottom-20 size-[280px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(233,40,19,.26), transparent 65%)',
            }}
          />
          <div className="relative">
            <div className="mb-2.5 text-xs font-bold tracking-[3px] text-oni uppercase [text-shadow:0_0_18px_rgba(233,40,19,.35)]">
              L’esprit du règlement en une phrase
            </div>
            <p className="text-[19px] font-semibold">
              Joue au soup comme en <span className="text-or">2014</span>, sans pourrir le jeu
              des autres.
            </p>
          </div>
          <Image
            src="/soupe.png"
            alt=""
            width={76}
            height={76}
            aria-hidden="true"
            className="relative ml-auto hidden size-19 shrink-0 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,.5)] sm:block"
          />
        </div>
      </div>
    </PagePublique>
  )
}
