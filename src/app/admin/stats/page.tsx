import { formaterEuros } from '@/lib/format'
import {
  lireAppareils,
  lireArgent,
  lireArticles,
  lireAudience,
  lireMois,
  lirePages,
  lireSources,
  type Repartition,
} from '@/lib/stats'

export const metadata = { title: 'Statistiques' }

/**
 * Le tableau de bord de la boutique : l'argent d'un côté, l'audience de
 * l'autre, et le lien entre les deux.
 *
 * Toujours recalculé à l'affichage — des chiffres mis en cache seraient pires
 * qu'inutiles, on viendrait ici précisément pour savoir où on en est.
 */
export const dynamic = 'force-dynamic'

/** Un chiffre isolé, en gros. */
function Tuile({
  libelle,
  valeur,
  precision,
  accent = false,
}: {
  libelle: string
  valeur: string
  precision?: string
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-bord bg-charbon px-5 py-4">
      <p className="font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
        {libelle}
      </p>
      <p
        className={`mt-1.5 font-titre text-2xl ${accent ? 'text-or' : 'text-creme'}`}
      >
        {valeur}
      </p>
      {precision && <p className="mt-0.5 text-[13px] text-gris">{precision}</p>}
    </div>
  )
}

function Section({
  titre,
  aide,
  children,
}: {
  titre: string
  aide?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-bord bg-charbon px-6 py-6">
      <h2 className="font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
        {titre}
      </h2>
      {aide && <p className="mt-1.5 mb-4 text-[13px] text-gris">{aide}</p>}
      <div className={aide ? '' : 'mt-4'}>{children}</div>
    </section>
  )
}

/** Un tableau qui défile horizontalement plutôt que d'élargir la page. */
function Tableau({ entetes, children }: { entetes: string[]; children: React.ReactNode }) {
  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <table className="w-full min-w-[440px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-bord">
            {entetes.map((entete, index) => (
              <th
                key={entete}
                className={`pb-2 font-mono text-[10.5px] font-bold tracking-wide text-gris uppercase ${
                  index === 0 ? 'text-left' : 'text-right'
                }`}
              >
                {entete}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/** Une barre horizontale proportionnelle, pour les répartitions. */
function Barre({ lignes }: { lignes: Repartition[] }) {
  const maximum = Math.max(1, ...lignes.map((l) => l.nombre))

  return (
    <ul className="flex flex-col gap-2.5">
      {lignes.map((ligne) => (
        <li key={ligne.libelle}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-creme">{ligne.libelle}</span>
            <span className="shrink-0 font-mono text-[13px] text-gris">
              {ligne.nombre} · {ligne.part} %
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-nuit">
            <div
              className="h-full rounded-full bg-soupe"
              style={{ width: `${Math.round((ligne.nombre / maximum) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** « 2 min 40 s », ou « 12 s » quand c'est court. */
function formaterDuree(secondes: number): string {
  if (secondes <= 0) return '—'
  if (secondes < 60) return `${secondes} s`
  const minutes = Math.floor(secondes / 60)
  const reste = secondes % 60
  return reste === 0 ? `${minutes} min` : `${minutes} min ${reste} s`
}

export default async function PageStats() {
  const [argent, mois, articles, audience, pages, sources, appareils] = await Promise.all([
    lireArgent(),
    lireMois(),
    lireArticles(),
    lireAudience(),
    lirePages(),
    lireSources(),
    lireAppareils(),
  ])

  const caMaximum = Math.max(1, ...mois.map((m) => m.caCentimes))

  return (
    <>
      <div className="mb-6">
        <h1 className="font-titre text-2xl uppercase">Statistiques</h1>
        <p className="mt-1 text-sm text-gris">
          Le chiffre d’affaires ne compte que les commandes <strong>livrées</strong>, et les
          remboursements en sont exclus. L’audience couvre le site public uniquement — tes
          passages dans l’admin ne sont jamais enregistrés.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* ------------------------------ ARGENT ------------------------------ */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tuile
            libelle="Depuis toujours"
            valeur={formaterEuros(argent.caTotalCentimes)}
            precision={`${argent.commandesLivrees} commande${
              argent.commandesLivrees > 1 ? 's' : ''
            } livrée${argent.commandesLivrees > 1 ? 's' : ''}`}
            accent
          />
          <Tuile
            libelle="Ce mois-ci"
            valeur={formaterEuros(argent.caMoisCentimes)}
            precision="depuis le 1er du mois"
          />
          <Tuile
            libelle="30 derniers jours"
            valeur={formaterEuros(argent.ca30joursCentimes)}
            precision="glissant"
          />
          <Tuile
            libelle="Panier moyen"
            valeur={formaterEuros(argent.panierMoyenCentimes)}
            precision="par commande livrée"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tuile
            libelle="Commandes créées"
            valeur={String(argent.commandesCreees)}
            precision="tous statuts confondus"
          />
          <Tuile
            libelle="Taux de conversion"
            valeur={`${argent.tauxConversion} %`}
            precision="créées → livrées"
          />
          <Tuile
            libelle="Remboursé"
            valeur={formaterEuros(argent.rembourseCentimes)}
            precision="déduit du chiffre d’affaires"
          />
          <Tuile
            libelle="Visiteurs (30 j)"
            valeur={String(audience.visiteurs30jours)}
            precision={`${audience.vues30jours} pages vues`}
          />
        </div>

        {/* ------------------------------- MOIS ------------------------------- */}
        <Section
          titre="Chiffre d’affaires par mois"
          aide="Les douze derniers mois. Un mois sans vente reste affiché à zéro."
        >
          <ul className="flex flex-col gap-2.5">
            {mois.map((m) => (
              <li key={m.cle}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-sm text-creme capitalize">{m.libelle}</span>
                  <span className="shrink-0 font-mono text-[13px] text-gris">
                    {formaterEuros(m.caCentimes)}
                    {m.commandes > 0 && ` · ${m.commandes} cmd`}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-nuit">
                  <div
                    className="h-full rounded-full bg-soupe"
                    style={{ width: `${Math.round((m.caCentimes / caMaximum) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* ----------------------------- ARTICLES ----------------------------- */}
        <Section
          titre="Ce qui se vend"
          aide="Sur les commandes livrées, classé par chiffre d’affaires."
        >
          {articles.length === 0 ? (
            <p className="text-sm text-gris">Aucune vente livrée pour l’instant.</p>
          ) : (
            <Tableau entetes={['Article', 'Type', 'Vendu', 'Chiffre d’affaires']}>
              {articles.map((article) => (
                <tr key={article.libelle} className="border-b border-bord last:border-b-0">
                  <td className="py-2.5 text-creme">{article.libelle}</td>
                  <td className="py-2.5 text-right font-mono text-[11px] tracking-wide text-gris uppercase">
                    {article.type}
                  </td>
                  <td className="py-2.5 text-right font-mono text-gris">{article.quantite}</td>
                  <td className="py-2.5 text-right font-mono text-or">
                    {formaterEuros(article.caCentimes)}
                  </td>
                </tr>
              ))}
            </Tableau>
          )}
        </Section>

        {/* ----------------------------- AUDIENCE ----------------------------- */}
        {audience.vide ? (
          <Section titre="Audience">
            <p className="text-sm text-gris">
              Aucune page vue enregistrée pour l’instant. Le suivi démarre au premier visiteur
              qui arrive sur le site public après la mise en ligne de cette version.
            </p>
          </Section>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Tuile
                libelle="Pages vues"
                valeur={String(audience.vuesTotal)}
                precision="depuis toujours"
              />
              <Tuile
                libelle="7 derniers jours"
                valeur={String(audience.vues7jours)}
                precision={`${audience.visiteurs7jours} visiteur${
                  audience.visiteurs7jours > 1 ? 's' : ''
                }`}
              />
              <Tuile
                libelle="Temps moyen"
                valeur={formaterDuree(audience.dureeMoyenneSecondes)}
                precision="par page"
              />
              <Tuile
                libelle="Taux de rebond"
                valeur={`${audience.tauxRebond} %`}
                precision="visites d’une seule page"
              />
            </div>

            <Section
              titre="Les pages les plus vues"
              aide="Sur 30 jours. Le temps moyen ne compte que les visites dont on a pu mesurer la sortie."
            >
              <Tableau entetes={['Page', 'Vues', 'Visiteurs', 'Temps moyen']}>
                {pages.map((page) => (
                  <tr key={page.chemin} className="border-b border-bord last:border-b-0">
                    <td className="py-2.5 font-mono text-[13px] text-creme">{page.chemin}</td>
                    <td className="py-2.5 text-right font-mono text-gris">{page.vues}</td>
                    <td className="py-2.5 text-right font-mono text-gris">{page.visiteurs}</td>
                    <td className="py-2.5 text-right font-mono text-gris">
                      {formaterDuree(page.dureeMoyenneSecondes)}
                    </td>
                  </tr>
                ))}
              </Tableau>
            </Section>

            <div className="grid gap-5 lg:grid-cols-2">
              <Section titre="D’où viennent les visiteurs" aide="Sur 30 jours.">
                <Barre lignes={sources} />
              </Section>

              <Section titre="Sur quel appareil" aide="Sur 30 jours.">
                <Barre lignes={appareils} />
              </Section>
            </div>
          </>
        )}
      </div>
    </>
  )
}
