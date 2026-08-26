import Link from 'next/link'

import { Donut } from '@/components/admin/dashboard/Donut'
import { JoueursEnLigne } from '@/components/admin/dashboard/JoueursEnLigne'
import { Tuile } from '@/components/admin/dashboard/Tuile'
import { EtiquetteStatut } from '@/components/admin/EtiquetteStatut'
import { formaterDateHeure, formaterEuros, formaterNumeroCommande } from '@/lib/format'
import { lireReglages } from '@/lib/reglages'
import {
  lireAppareils,
  lireArgent,
  lireAudience,
  lireDernieresCommandes,
  lireEtatCollecte,
  lireMois,
  lirePages,
  lireSources,
  lireVentesParCategorie,
  type Repartition,
} from '@/lib/stats'

export const metadata = { title: 'Tableau de bord' }

/**
 * Le tableau de bord, page d'accueil de l'administration.
 *
 * Il répond à une seule question : « comment va le serveur, en trois
 * secondes ? ». D'où la hiérarchie, du plus important au moins important :
 * les chiffres clés, puis les dernières commandes, puis ce qui se vend, et
 * enfin — replié sur mobile — l'analyse détaillée.
 *
 * Toujours recalculé à l'affichage : des chiffres mis en cache seraient pires
 * qu'inutiles, on vient ici précisément pour savoir où on en est.
 */
export const dynamic = 'force-dynamic'

/* -------------------------------------------------------------------------- */
/* Briques de présentation                                                    */
/* -------------------------------------------------------------------------- */

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
    <section className="rounded-carte border border-bord bg-charbon px-5 py-5 sm:px-6 sm:py-6">
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

/** Couleur de chaque catégorie dans le donut « ce qui se vend ». */
const COULEUR_CATEGORIE: Record<string, string> = {
  KIT: 'var(--color-soupe)',
  GRADE: 'var(--color-or)',
  PACK: 'var(--color-violet)',
}

/** Les sections de gestion, pour l'accès rapide en bas de tableau de bord. */
const RACCOURCIS = [
  { href: '/admin/commandes', label: 'Commandes' },
  { href: '/admin/kits', label: 'Kits' },
  { href: '/admin/grades', label: 'Grades' },
  { href: '/admin/packs', label: 'Packs' },
  { href: '/admin/reglement', label: 'Règlement' },
  { href: '/admin/reglages', label: 'Réglages' },
]

/* -------------------------------------------------------------------------- */
/* La page                                                                    */
/* -------------------------------------------------------------------------- */

export default async function TableauDeBord() {
  const [
    reglages,
    argent,
    categories,
    dernieres,
    mois,
    audience,
    pages,
    sources,
    appareils,
    collecte,
  ] = await Promise.all([
    lireReglages(),
    lireArgent(),
    lireVentesParCategorie(),
    lireDernieresCommandes(10),
    lireMois(),
    lireAudience(),
    lirePages(),
    lireSources(),
    lireAppareils(),
    lireEtatCollecte(),
  ])

  const caMaximum = Math.max(1, ...mois.map((m) => m.caCentimes))
  const ventesTotales = categories.reduce((somme, c) => somme + c.caCentimes, 0)
  const segmentsVentes = categories.map((c) => ({
    libelle: c.libelle,
    valeur: c.caCentimes,
    couleur: COULEUR_CATEGORIE[c.categorie] ?? 'var(--color-gris)',
  }))

  return (
    <>
      <div className="mb-6">
        <h1 className="font-titre text-2xl">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gris">
          Le chiffre d’affaires ne compte que les commandes <strong>livrées</strong>,
          remboursements déduits. Les évolutions comparent aux 30 jours précédents, en heure de
          Paris.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* ------------------------- 1. CHIFFRES CLÉS ------------------------- */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Tuile
            libelle="Chiffre d’affaires"
            valeur={formaterEuros(argent.caTotalCentimes)}
            precision="depuis toujours"
            accent
          />
          <Tuile
            libelle="CA — 30 derniers jours"
            valeur={formaterEuros(argent.ca30joursCentimes)}
            evolution={argent.ca30joursEvolution}
            precision="glissant, en heure de Paris"
          />
          <Tuile
            libelle="Commandes livrées"
            valeur={String(argent.commandesLivrees)}
            evolution={argent.commandes30joursEvolution}
            precision={
              argent.enAttenteLivraison > 0
                ? `${argent.enAttenteLivraison} en attente de livraison`
                : 'rien en attente'
            }
            precisionAccent={argent.enAttenteLivraison > 0}
          />
          <Tuile
            libelle="Panier moyen — 30 j"
            valeur={formaterEuros(argent.panierMoyen30joursCentimes)}
            evolution={argent.panierMoyen30joursEvolution}
            precision="par commande livrée"
          />
          <Tuile
            libelle="Visiteurs — 30 j"
            valeur={String(audience.visiteurs30jours)}
            evolution={audience.visiteurs30joursEvolution}
            precision={`${audience.vues30jours} pages vues`}
          />
          <JoueursEnLigne
            ip={reglages.ip}
            dernierEchantillon={collecte.dernier ? collecte.dernier.toISOString() : null}
            echantillons24h={collecte.nombre24h}
          />
        </div>

        {/* ----------------------- 2. DERNIÈRES COMMANDES --------------------- */}
        <Section
          titre="Dernières commandes"
          aide="Les dix plus récentes. Les échecs et litiges sont soulignés en rouge."
        >
          {dernieres.length === 0 ? (
            <p className="text-sm text-gris">Aucune commande pour l’instant.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {dernieres.map((commande) => {
                const probleme =
                  commande.statut === 'ECHOUEE' || commande.statut === 'LITIGE'
                return (
                  <Link
                    key={commande.id}
                    href={`/admin/commandes/${commande.id}`}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-carte border px-4 py-3 transition-colors ${
                      probleme
                        ? 'border-rouge/40 bg-rouge/5 hover:border-rouge/70'
                        : 'border-bord bg-nuit/40 hover:border-soupe'
                    }`}
                  >
                    <span className="font-mono text-[13px] font-bold text-or">
                      {formaterNumeroCommande(commande.numero)}
                    </span>
                    <span className="min-w-[140px] flex-1">
                      <span className="block font-mono text-sm font-bold text-creme">
                        {commande.pseudoMinecraft}
                      </span>
                      <span className="block truncate text-[12.5px] text-gris">
                        {commande.articles || '—'}
                      </span>
                    </span>
                    <span className="font-titre text-sm text-or">
                      {formaterEuros(commande.montantTotalCentimes)}
                    </span>
                    <EtiquetteStatut statut={commande.statut} />
                    <span className="hidden font-mono text-[11px] text-gris sm:inline">
                      {formaterDateHeure(commande.createdAt)}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
          <Link
            href="/admin/commandes"
            className="mt-4 inline-flex text-[13px] font-semibold text-soupe transition-colors hover:text-or"
          >
            Toutes les commandes →
          </Link>
        </Section>

        {/* ------------------------- 3. CE QUI SE VEND ------------------------ */}
        <Section
          titre="Ce qui se vend"
          aide="Répartition du chiffre d’affaires par catégorie, sur les commandes livrées."
        >
          {ventesTotales === 0 ? (
            <p className="text-sm text-gris">Aucune vente livrée pour l’instant.</p>
          ) : (
            <Donut
              segments={segmentsVentes}
              total={ventesTotales}
              legendeCentre={formaterEuros(ventesTotales)}
              sousLegende="livré"
            />
          )}
        </Section>

        {/* ---------------------- 4. ACCÈS RAPIDE ---------------------------- */}
        <Section titre="Accès rapide">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {RACCOURCIS.map((raccourci) => (
              <Link
                key={raccourci.href}
                href={raccourci.href}
                className="rounded-carte border border-bord bg-nuit/40 px-4 py-3 text-sm font-semibold text-creme transition-colors hover:border-soupe hover:text-soupe"
              >
                {raccourci.label}
              </Link>
            ))}
          </div>
        </Section>

        {/* -------------------- 5. ANALYSE DÉTAILLÉE (repliée mobile) --------- */}
        <details className="audience-repliable rounded-carte border border-bord bg-charbon">
          <summary className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
            <span className="font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
              Analyse détaillée — historique &amp; audience
            </span>
            <span
              aria-hidden="true"
              className="audience-chevron text-gris transition-transform"
            >
              ▾
            </span>
          </summary>

          <div className="audience-contenu flex-col gap-5 px-5 pb-6 sm:px-6">
            {/* --- CA par mois --- */}
            <div>
              <h3 className="mb-1 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
                Chiffre d’affaires par mois
              </h3>
              <p className="mb-4 text-[13px] text-gris">
                Les douze derniers mois. Un mois sans vente reste affiché à zéro.
              </p>
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
            </div>

            {/* --- Audience --- */}
            {audience.vide ? (
              <div>
                <h3 className="mb-1 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
                  Audience
                </h3>
                <p className="text-sm text-gris">
                  Aucune page vue enregistrée pour l’instant. Le suivi démarre au premier
                  visiteur du site public — tes passages dans l’admin ne sont jamais comptés.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

                <div>
                  <h3 className="mb-1 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
                    Les pages les plus vues
                  </h3>
                  <p className="mb-4 text-[13px] text-gris">
                    Sur 30 jours. Le temps moyen ne compte que les visites dont on a pu mesurer
                    la sortie.
                  </p>
                  <Tableau entetes={['Page', 'Vues', 'Visiteurs', 'Temps moyen']}>
                    {pages.map((page) => (
                      <tr key={page.chemin} className="border-b border-bord last:border-b-0">
                        <td className="py-2.5 font-mono text-[13px] text-creme">{page.chemin}</td>
                        <td className="py-2.5 text-right font-mono text-gris">{page.vues}</td>
                        <td className="py-2.5 text-right font-mono text-gris">
                          {page.visiteurs}
                        </td>
                        <td className="py-2.5 text-right font-mono text-gris">
                          {formaterDuree(page.dureeMoyenneSecondes)}
                        </td>
                      </tr>
                    ))}
                  </Tableau>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-4 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
                      D’où viennent les visiteurs
                    </h3>
                    <Barre lignes={sources} />
                  </div>
                  <div>
                    <h3 className="mb-4 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
                      Sur quel appareil
                    </h3>
                    <Barre lignes={appareils} />
                  </div>
                </div>
              </>
            )}
          </div>
        </details>
      </div>
    </>
  )
}
