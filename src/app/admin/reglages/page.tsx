import { FormulaireReglages } from '@/components/admin/FormulaireReglages'
import { prisma } from '@/lib/prisma'
import { REGLAGES_PAR_DEFAUT } from '@/lib/reglages'

export const metadata = { title: 'Réglages' }

/**
 * Les réglages du site : ce qui change au fil du temps sans mériter un
 * déploiement. Avant, ces valeurs étaient en dur dans src/lib/site.ts.
 */
export default async function PageReglages() {
  const enBase = await prisma.reglages.findUnique({ where: { id: 1 } })

  // Première ouverture, ligne pas encore créée : on pré-remplit avec les
  // valeurs de repli, celles-là mêmes que le site affiche déjà.
  const reglages = enBase ?? {
    ip: REGLAGES_PAR_DEFAUT.ip,
    discord: REGLAGES_PAR_DEFAUT.discord,
    updatedAt: null,
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="font-titre text-2xl">Réglages du site</h1>
        <p className="mt-1 text-sm text-gris">
          L’adresse du serveur et le lien Discord apparaissent sur presque toutes les pages.
          Les modifier ici les met à jour partout, sans déploiement.
          {enBase?.updatedAt && ` Dernière modification le ${enBase.updatedAt.toLocaleDateString('fr-FR')}.`}
        </p>
      </div>

      <FormulaireReglages
        reglages={{
          ip: reglages.ip,
          discord: reglages.discord,
        }}
      />

      <section className="mt-6 rounded-carte border border-bord bg-charbon px-6 py-5">
        <h2 className="mb-2 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
          Le lien Discord dans le règlement
        </h2>
        <p className="text-[14px] text-gris">
          Dans le règlement et les descriptions de kits, écris{' '}
          <code className="rounded-micro bg-braise px-2 py-0.5 font-mono text-[13px] text-or">
            {'{discord}'}
          </code>{' '}
          plutôt que de recopier l’adresse : elle sera remplacée par le lien ci-dessus au
          moment de l’affichage. Changer le lien ici le met alors à jour jusque dans le texte
          du règlement.
        </p>
      </section>
    </>
  )
}
