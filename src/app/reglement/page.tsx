import type { Metadata } from 'next'

import { PagePublique } from '@/components/public/PagePublique'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { Etiquette } from '@/components/ui/TeteSection'
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
      {/* ═══════════════════════════ EN-TÊTE ═══════════════════════════ */}
      <header className="halo-hero pt-[clamp(48px,6vw,80px)] pb-[clamp(30px,4vw,42px)] text-center">
        <Enveloppe>
          <div className="mx-auto max-w-lecture">
            <Etiquette>Les règles du serveur</Etiquette>

            <h1 className="text-h1 mt-4 font-titre">
              Règlement <span className="text-or">LJKITS</span>
            </h1>

            <p className="mx-auto mt-4.5 max-w-[52ch] text-gris">
              En jouant sur LJKITS, tu acceptes ces règles. Elles existent pour une seule
              raison : que le serveur reste agréable pour tout le monde.
            </p>

            {derniereMaj && (
              <p className="mt-5 font-mono text-[11px] tracking-[.06em] text-gris">
                Dernière mise à jour :{' '}
                <time dateTime={derniereMaj.toISOString()}>{formaterDate(derniereMaj)}</time>
              </p>
            )}
          </div>
        </Enveloppe>
      </header>

      {/* ═══════════════════════════ LES SECTIONS ═══════════════════════════ */}
      <main className="pb-section">
        <Enveloppe>
          <div className="mx-auto flex max-w-lecture flex-col gap-3.5">
            {sections.length === 0 ? (
              <p className="rounded-carte border border-dashed border-bord px-6 py-12 text-center font-mono text-[13px] text-gris">
                Le règlement est en cours de rédaction. Reviens d’ici peu.
              </p>
            ) : (
              sections.map((section, index) => (
                <section
                  key={section.id}
                  className="overflow-hidden rounded-carte border border-bord bg-charbon transition-colors duration-[.18s] hover:border-soupe"
                >
                  <div className="flex items-center gap-3.5 border-b border-bord bg-braise px-5.5 py-4">
                    <span
                      aria-hidden="true"
                      className="shrink-0 font-mono text-[11px] font-bold tracking-[.18em] text-soupe"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h2 className="font-titre text-[clamp(17px,2.2vw,21px)] leading-tight tracking-[-.01em]">
                      {section.titre}
                    </h2>
                  </div>

                  {/*
                    Le contenu vient de la base et n'est PAS retouché : les
                    textes du règlement ne changent pas. Seul le style du HTML
                    produit a bougé, dans la feuille .markdown de globals.css.
                  */}
                  <div
                    className="markdown px-5.5 py-5"
                    dangerouslySetInnerHTML={{
                      __html: markdownVersHtml(section.contenu, { discord }),
                    }}
                  />
                </section>
              ))
            )}
          </div>
        </Enveloppe>
      </main>

      {/* ══════════════════ L'ESPRIT DU RÈGLEMENT ══════════════════ */}
      <section className="pb-section">
        <Enveloppe>
          <div className="hachures mx-auto max-w-lecture rounded-bloc border border-oni/40 p-[clamp(26px,4vw,40px)] text-center">
            <Etiquette className="text-oni">L’esprit du règlement en une phrase</Etiquette>
            <p className="mt-4 font-titre text-[clamp(19px,2.8vw,28px)] leading-tight">
              Joue au soup comme en <span className="text-or">2014</span>, sans pourrir le jeu
              des autres.
            </p>
          </div>
        </Enveloppe>
      </section>
    </PagePublique>
  )
}
