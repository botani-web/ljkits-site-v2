import Link from 'next/link'

import { basculerGrade, deplacerGrade, supprimerGrade } from '@/actions/grades'
import {
  BoutonBascule,
  BoutonOrdre,
  BoutonSupprimer,
} from '@/components/admin/BoutonsAction'
import { formaterEuros } from '@/lib/format'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Grades' }

export default async function TableauDeBordGrades() {
  // Même tri que deplacerGrade(), pour que les flèches déplacent bien la
  // ligne qu'on voit à l'écran.
  const grades = await prisma.grade.findMany({
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    include: { _count: { select: { avantages: true } } },
  })

  const visibles = grades.filter((grade) => grade.visible).length

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titre text-2xl uppercase">Les grades</h1>
          <p className="mt-1 text-sm text-gris">
            {grades.length} grade{grades.length > 1 ? 's' : ''}, {visibles} visible
            {visibles > 1 ? 's' : ''} sur la boutique. L’ordre détermine aussi de quel grade
            hérite le suivant.
          </p>
        </div>

        <Link
          href="/admin/grades/nouveau"
          className="rounded-lg bg-linear-[135deg] from-soupe to-or px-4 py-2.5 text-sm font-bold text-[#1A1005] transition-shadow hover:shadow-[0_4px_18px_rgba(254,147,1,.35)]"
        >
          + Nouveau grade
        </Link>
      </div>

      {grades.length === 0 ? (
        <p className="rounded-2xl border border-bord bg-charbon px-6 py-12 text-center text-gris">
          Aucun grade pour l’instant. Lance <code className="text-or">npm run db:seed</code> ou
          crée-en un.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {grades.map((grade, index) => (
            <article
              key={grade.id}
              className={`flex flex-wrap items-center gap-4 rounded-xl border bg-charbon px-4 py-3.5 ${
                grade.visible ? 'border-bord' : 'border-bord/50 opacity-60'
              }`}
            >
              <div className="flex flex-col gap-1">
                <BoutonOrdre
                  action={deplacerGrade.bind(null, grade.id, 'haut')}
                  direction="haut"
                  desactive={index === 0}
                />
                <BoutonOrdre
                  action={deplacerGrade.bind(null, grade.id, 'bas')}
                  direction="bas"
                  desactive={index === grades.length - 1}
                />
              </div>

              <div className="min-w-[180px] flex-1">
                <div className="flex items-baseline gap-2">
                  <h2 className="font-titre text-[17px] text-or uppercase">{grade.nom}</h2>
                  {grade.kanji && (
                    <span className="font-mono text-sm text-bord">{grade.kanji}</span>
                  )}
                  {grade.etiquette && (
                    <span className="rounded bg-soupe px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-[#1a0f00] uppercase">
                      {grade.etiquette}
                    </span>
                  )}
                </div>
                <p className="font-mono text-[11px] tracking-wide text-gris">
                  {grade.slug} · {grade._count.avantages} avantage
                  {grade._count.avantages > 1 ? 's' : ''}
                  {grade.achetable && grade.commandeLivraison.trim() === '' && (
                    <span className="text-rouge"> · pas de commande de livraison</span>
                  )}
                  {grade.achetable && grade.tebexPackageId === null && (
                    <span className="text-rouge"> · pas d’ID Tebex</span>
                  )}
                </p>
              </div>

              <div className="font-titre text-sm text-or">
                {formaterEuros(grade.prixEurosCentimes)}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <BoutonBascule
                  action={basculerGrade.bind(null, grade.id, 'visible')}
                  actif={grade.visible}
                  label="Visible"
                  couleur="vert"
                />
                <BoutonBascule
                  action={basculerGrade.bind(null, grade.id, 'achetable')}
                  actif={grade.achetable}
                  label="Achetable"
                  couleur="violet"
                />
                <BoutonBascule
                  action={basculerGrade.bind(null, grade.id, 'heriteDuPrecedent')}
                  actif={grade.heriteDuPrecedent}
                  label="Hérite"
                />
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/grades/${grade.id}`}
                  className="inline-flex min-h-11 items-center rounded-lg border border-bord px-3 text-[13px] font-semibold text-gris transition-colors hover:border-soupe hover:text-soupe sm:min-h-0 sm:py-1.5"
                >
                  Modifier
                </Link>
                <BoutonSupprimer action={supprimerGrade.bind(null, grade.id)} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
