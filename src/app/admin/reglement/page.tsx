import Link from 'next/link'

import {
  basculerPublicationSection,
  deplacerSection,
  supprimerSection,
} from '@/actions/reglement'
import {
  BoutonBascule,
  BoutonOrdre,
  BoutonSupprimer,
} from '@/components/admin/BoutonsAction'
import { formaterDate } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { classesBouton } from '@/components/ui/Bouton'

export const metadata = { title: 'Règlement' }

export default async function TableauDeBordReglement() {
  // Brouillons compris : le tri est identique à celui de deplacerSection().
  const sections = await prisma.sectionReglement.findMany({
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
  })

  const publiees = sections.filter((section) => section.publie)

  const derniereMaj = publiees.reduce<Date | null>(
    (plusRecente, section) =>
      plusRecente === null || section.updatedAt > plusRecente ? section.updatedAt : plusRecente,
    null,
  )

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titre text-2xl">Le règlement</h1>
          <p className="mt-1 text-sm text-gris">
            {sections.length} section{sections.length > 1 ? 's' : ''}, {publiees.length}{' '}
            publiée{publiees.length > 1 ? 's' : ''}.
            {derniereMaj && ` Mise à jour publique : ${formaterDate(derniereMaj)}.`}
          </p>
        </div>

        <Link
          href="/admin/reglement/nouveau"
          className={classesBouton({ variante: 'plein' })}
        >
          + Nouvelle section
        </Link>
      </div>

      {sections.length === 0 ? (
        <p className="rounded-carte border border-bord bg-charbon px-6 py-12 text-center text-gris">
          Aucune section pour l’instant.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sections.map((section, index) => {
            // Le numéro affiché côté public ne compte que les sections publiées.
            const numeroPublic = section.publie
              ? publiees.findIndex((publiee) => publiee.id === section.id) + 1
              : null

            return (
              <article
                key={section.id}
                className={`flex flex-wrap items-center gap-4 rounded-carte border bg-charbon px-4 py-3.5 ${
                  section.publie ? 'border-bord' : 'border-bord/50 opacity-60'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <BoutonOrdre
                    action={deplacerSection.bind(null, section.id, 'haut')}
                    direction="haut"
                    desactive={index === 0}
                  />
                  <BoutonOrdre
                    action={deplacerSection.bind(null, section.id, 'bas')}
                    direction="bas"
                    desactive={index === sections.length - 1}
                  />
                </div>

                <div className="min-w-[200px] flex-1">
                  <h2 className="text-[16px] font-bold text-creme">
                    {numeroPublic !== null && (
                      <span className="mr-2 font-mono text-sm text-soupe">
                        {numeroPublic}.
                      </span>
                    )}
                    {section.titre}
                  </h2>
                  <p className="font-mono text-[11px] text-gris">
                    Modifiée le {formaterDate(section.updatedAt)} ·{' '}
                    {section.contenu.length} caractères
                  </p>
                </div>

                <BoutonBascule
                  action={basculerPublicationSection.bind(null, section.id)}
                  actif={section.publie}
                  label={section.publie ? 'Publiée' : 'Brouillon'}
                  couleur="vert"
                />

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/reglement/${section.id}`}
                    className="inline-flex min-h-11 items-center rounded-controle border border-bord px-3 text-[13px] font-semibold text-gris transition-colors hover:border-soupe hover:text-soupe sm:min-h-0 sm:py-1.5"
                  >
                    Modifier
                  </Link>
                  <BoutonSupprimer action={supprimerSection.bind(null, section.id)} />
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
