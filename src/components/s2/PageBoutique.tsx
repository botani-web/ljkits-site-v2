import type { Metadata } from 'next'

import { PagePublique } from '@/components/public/PagePublique'
import { Conteneur } from '@/components/s2/Briques'
import { BoutiqueS2, type ProduitBoutique } from '@/components/s2/BoutiqueS2'
import { OngletsBoutique } from '@/components/s2/OngletsBoutique'
import { champ, estLocale, LANGUE_DEFAUT, lien, type Locale } from '@/lib/i18n'
import { type CleS2, ts } from '@/lib/i18n-s2'
import { prisma } from '@/lib/prisma'
import { IMAGE_OG } from '@/lib/site'

/**
 * LA BOUTIQUE (refonte S2, 16/10/2026) : deux rayons, coins et grades, présentés
 * comme les modes du classement (/boutique et /boutique/grades). Plus de grand
 * bandeau : le titre, une ligne de réassurance, le pseudo, les articles.
 */

export type Rayon = 'coins' | 'grades'

const GRADES_VENDUS = ['ljplus', 'ljplusplus']
const STYLE_GRADES: Record<string, { icone: string; couleur: string }> = {
  ljplus: { icone: 'items-gold_ingot', couleur: '#fdc003' },
  ljplusplus: { icone: 'items-nether_star', couleur: '#fe9301' },
}

export async function metadataBoutique(brut: string, rayon: Rayon): Promise<Metadata> {
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const titre = `${ts(locale, 'b.meta-titre')} · ${ts(locale, rayon === 'coins' ? 'b.onglet-coins' : 'b.onglet-grades')}`
  const description = ts(locale, 'b.meta-desc')
  return {
    title: titre,
    description,
    alternates: { canonical: lien(locale, rayon === 'coins' ? '/boutique' : '/boutique/grades') },
    openGraph: { title: titre, description, images: IMAGE_OG },
  }
}

async function lireProduits(locale: Locale, rayon: Rayon): Promise<ProduitBoutique[]> {
  if (rayon === 'coins') {
    const packs = await prisma.pack.findMany({
      where: { visible: true, coins: { gt: 0 } },
      orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    })
    // Le taux de base : celui du plus petit pack. Le « bonus » d'un pack, c'est ce qu'il donne en plus.
    const tauxBase = Math.min(...packs.map((p) => (p.coins ?? 0) / p.prixEurosCentimes))
    const taux = (p: (typeof packs)[number]) => (p.coins ?? 0) / p.prixEurosCentimes
    const meilleur = packs.reduce<(typeof packs)[number] | null>((m, p) => (!m || taux(p) > taux(m) ? p : m), null)
    return packs.map((p, i) => ({
      type: 'PACK',
      slug: p.slug,
      nom: champ(locale, p.nom, p.nomEn),
      prixCentimes: p.prixEurosCentimes,
      payable: p.achetable && p.tebexPackageId != null,
      coins: p.coins ?? 0,
      niveau: Math.min(5, i + 1),
      bonus: Math.round((taux(p) / tauxBase - 1) * 100) || undefined,
      meilleur: packs.length > 2 && meilleur?.slug === p.slug,
    }))
  }
  const grades = await prisma.grade.findMany({
    where: { slug: { in: GRADES_VENDUS }, visible: true },
    orderBy: { ordre: 'asc' },
    include: { avantages: { orderBy: { ordre: 'asc' } } },
  })
  return grades.map((g) => ({
    type: 'GRADE',
    slug: g.slug,
    nom: g.nom,
    prixCentimes: g.prixEurosCentimes,
    payable: g.achetable && g.tebexPackageId != null,
    avantages: g.avantages.map((a) => champ(locale, a.texte, a.texteEn)),
    ...STYLE_GRADES[g.slug],
  }))
}

export async function PageBoutique({ brut, rayon }: { brut: string; rayon: Rayon }) {
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const produits = await lireProduits(locale, rayon)

  return (
    <PagePublique locale={locale}>
      <main className="pb-6">
        <Conteneur className="pt-8 sm:pt-10">
          <div className="entree flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[30px] leading-tight font-extrabold tracking-[-.02em] text-creme sm:text-[38px]">{ts(locale, 'b.titre')}</h1>
              <p className="mt-1 flex items-center gap-2 text-[14px] text-gris">
                <span className="text-vert" aria-hidden>
                  ✓
                </span>
                {ts(locale, 'b.sous')}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <OngletsBoutique actif={rayon} locale={locale} />
          </div>

          <div className="mt-6">
            <BoutiqueS2 produits={produits} rayon={rayon} />
          </div>

          <p className="mt-5 flex items-start gap-2 text-[13.5px] text-gris">
            <span aria-hidden>ℹ</span>
            {ts(locale, rayon === 'coins' ? 'b.coins-usage' : 'b.grades-note')}
          </p>

          {/* Comment ça marche, en trois cases, puis les quatre questions qui reviennent. */}
          <section className="apparition mt-12">
            <h2 className="text-[19px] font-bold text-creme">{ts(locale, 'b.comment')}</h2>
            <ol className="mt-3 grid gap-3 sm:grid-cols-3">
              {(['b.c1', 'b.c2', 'b.c3'] as CleS2[]).map((cle, i) => (
                <li key={cle} className="flex items-center gap-3 rounded-[10px] border border-bord bg-charbon px-4 py-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-or/15 font-mono text-[14px] font-bold text-or">{i + 1}</span>
                  <span className="text-[14.5px] font-semibold text-creme">{ts(locale, cle)}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {(
                [
                  ['b.q1', 'b.r1'],
                  ['b.q2', 'b.r2'],
                  ['b.q3', 'b.r3'],
                  ['b.q4', 'b.r4'],
                ] as [CleS2, CleS2][]
              ).map(([q, r]) => (
                <details key={q} className="group rounded-[10px] border border-bord bg-charbon px-4 py-3 open:bg-braise/50">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14.5px] font-semibold text-creme [&::-webkit-details-marker]:hidden">
                    {ts(locale, q)}
                    <span className="text-gris transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-[14px] leading-relaxed text-gris">{ts(locale, r)}</p>
                </details>
              ))}
            </div>
          </section>
        </Conteneur>
      </main>
    </PagePublique>
  )
}
