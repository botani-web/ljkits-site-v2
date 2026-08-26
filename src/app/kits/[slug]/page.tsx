import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Badge, CarteKit, PrixKit, type KitEnCarte } from '@/components/public/CarteKit'
import { BoutonCopieIp } from '@/components/public/CopieIp'
import { IconeDiscord } from '@/components/public/IconeDiscord'
import { PagePublique } from '@/components/public/PagePublique'
import { formaterCoins, formaterEuros } from '@/lib/format'
import { markdownVersHtml } from '@/lib/markdown'
import { prisma } from '@/lib/prisma'
import { lireReglages } from '@/lib/reglages'
import { IMAGE_OG, reperes } from '@/lib/site'

export const revalidate = 3600 // une heure

/** Nombre de kits proposés en bas de page. Trois = une rangée pleine. */
const NOMBRE_DE_SUGGESTIONS = 3

/** Les repères de jeu rappelés dans la colonne de droite. */
const REPERES_AFFICHES = reperes('soupe', 'epee', 'armure', 'knockback')

/** Les champs dont <CarteKit> a besoin — réutilisés pour les suggestions. */
const CHAMPS_DE_CARTE = {
  slug: true,
  nom: true,
  kanji: true,
  role: true,
  descriptionCourte: true,
  prixCoins: true,
  prixEurosCentimes: true,
  type: true,
  bientot: true,
  kitDeDepart: true,
  caracteristiques: {
    orderBy: { ordre: 'asc' as const },
    select: { libelle: true, valeur: true },
  },
} as const

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

/**
 * Choisit les kits à proposer en bas de page.
 *
 * Priorité aux kits du même type (un joueur qui regarde un exclusif s'intéresse
 * d'abord aux autres exclusifs), puis, à l'intérieur de chaque groupe, aux prix
 * les plus proches — c'est le meilleur signal de « prochain kit à viser » dont
 * on dispose en base.
 */
function choisirSuggestions(
  kitCourant: { slug: string; type: string; prixCoins: number },
  tousLesKits: { slug: string; type: string; prixCoins: number }[],
) {
  const ecartDePrix = (kit: { prixCoins: number }) =>
    Math.abs(kit.prixCoins - kitCourant.prixCoins)

  return tousLesKits
    .filter((kit) => kit.slug !== kitCourant.slug)
    .sort((a, b) => {
      const memeTypeA = a.type === kitCourant.type ? 0 : 1
      const memeTypeB = b.type === kitCourant.type ? 0 : 1
      if (memeTypeA !== memeTypeB) return memeTypeA - memeTypeB
      return ecartDePrix(a) - ecartDePrix(b)
    })
    .slice(0, NOMBRE_DE_SUGGESTIONS)
    .map((kit) => kit.slug)
}

export default async function PageKit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const kit = await lireKit(slug)

  // Kit inexistant ou masqué depuis l'admin : 404, pas de page vide.
  if (!kit) notFound()

  // Liste légère de tous les kits visibles : sert au précédent/suivant ET au
  // classement des suggestions. Volontairement sans les caractéristiques, qui
  // ne sont chargées ensuite que pour les trois kits réellement affichés.
  const tousLesKits = await prisma.kit.findMany({
    where: { visible: true },
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }],
    select: { slug: true, nom: true, type: true, prixCoins: true },
  })

  const position = tousLesKits.findIndex((autre) => autre.slug === kit.slug)
  const precedent = position > 0 ? tousLesKits[position - 1] : null
  const suivant = position < tousLesKits.length - 1 ? tousLesKits[position + 1] : null

  const slugsSuggeres = choisirSuggestions(kit, tousLesKits)
  const suggestionsEnDesordre = await prisma.kit.findMany({
    where: { slug: { in: slugsSuggeres } },
    select: CHAMPS_DE_CARTE,
  })
  // findMany ne garantit pas l'ordre du `in` : on remet le classement voulu.
  const suggestions = slugsSuggeres
    .map((slugSuggere) => suggestionsEnDesordre.find((s) => s.slug === slugSuggere))
    .filter((s): s is KitEnCarte => s !== undefined)

  const exclusif = kit.type === 'EXCLUSIF'
  const { ip, discord } = await lireReglages()

  return (
    <PagePublique>
      {/* ================================ EN-TÊTE =============================== */}
      <header className="halo-hero px-6 pt-14">
        <div className="relative mx-auto max-w-lecture overflow-hidden text-center">
          {/*
            Le kanji en très grand filigrane derrière le titre. Purement
            décoratif (aria-hidden), non sélectionnable, et sous le texte.
            Le masque en dégradé évite que le débordement, coupé par
            overflow-hidden, ne laisse une arête horizontale nette.
          */}
          {kit.kanji && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[42%] font-mono text-[clamp(150px,22vw,270px)] leading-none whitespace-nowrap text-violet/8 select-none [mask-image:linear-gradient(to_bottom,transparent,#000_22%,#000_78%,transparent)]"
            >
              {kit.kanji}
            </span>
          )}

          <div className="relative z-10">
            <Link
              href="/kits"
              className="-my-3 mb-2 inline-flex min-h-11 items-center font-mono text-[12.5px] tracking-wide text-gris uppercase transition-colors hover:text-creme"
            >
              ← Tous les kits
            </Link>

            <p
              className={`mb-3 font-mono text-xs font-bold tracking-[3px] uppercase ${
                exclusif ? 'text-violet' : 'text-oni [text-shadow:0_0_18px_rgba(233,40,19,.35)]'
              }`}
            >
              {kit.role}
              {exclusif && ' · Kit exclusif'}
            </p>

            <h1 className="font-titre text-[clamp(30px,5vw,54px)] leading-[1.06] uppercase">
              <span className={exclusif ? 'text-violet' : 'texte-accent'}>{kit.nom}</span>
            </h1>

            <p className="mx-auto mt-4 max-w-[560px] text-gris">{kit.descriptionCourte}</p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <PrixKit prixCoins={kit.prixCoins} taille="detail" />
              {kit.bientot && <Badge variante="bientot">Bientôt disponible</Badge>}
              {kit.kitDeDepart && <Badge variante="depart">Kit de départ</Badge>}
              {kit.prixEurosCentimes !== null && (
                <Badge variante="euro">ou {formaterEuros(kit.prixEurosCentimes)}</Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =============================== CONTENU ================================ */}
      <main className="mx-auto max-w-contenu px-6 pt-9 pb-4">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          {/* ------------------------- colonne de gauche ------------------------ */}
          <div className="flex flex-col gap-5">
            <article
              className="markdown rounded-2xl border border-bord bg-charbon px-7 py-7"
              dangerouslySetInnerHTML={{ __html: markdownVersHtml(kit.descriptionLongue, { discord }) }}
            />

            {exclusif && (
              <p className="rounded-[10px] border border-[#3a2a55] border-l-[3px] border-l-violet bg-linear-[100deg] from-violet/6 to-transparent px-6 py-4 text-[14.5px] text-gris">
                <strong className="font-semibold text-white">
                  Kit exclusif, pas kit supérieur.
                </strong>{' '}
                Il joue autrement, il ne frappe pas plus fort, et il s’obtient en coins comme
                tous les autres.
              </p>
            )}

            {/* --- navigation d'un kit à l'autre, dans l'ordre de la grille --- */}
            {(precedent || suivant) && (
              <nav aria-label="Kit précédent et suivant" className="grid gap-3 sm:grid-cols-2">
                {precedent ? (
                  <LienKitVoisin kit={precedent} direction="precedent" />
                ) : (
                  <span className="hidden sm:block" />
                )}
                {suivant && <LienKitVoisin kit={suivant} direction="suivant" />}
              </nav>
            )}
          </div>

          {/* ------------------------- colonne de droite ------------------------ */}
          {/*
            Collée au scroll à partir de lg : sur les kits à deux caractéristiques,
            elle suivait sinon le lecteur avec un grand vide en dessous.
          */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
            {kit.caracteristiques.length > 0 && (
              <BlocLateral titre="Fiche technique">
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
              </BlocLateral>
            )}

            {/* --- comment débloquer ce kit --- */}
            <BlocLateral titre="Comment l’obtenir">
              <div className="flex flex-col gap-3 text-[14.5px] text-gris">
                {kit.kitDeDepart ? (
                  <p>
                    <strong className="font-semibold text-vert">Offert</strong> — il est à toi
                    dès ta première connexion, sans rien débloquer.
                  </p>
                ) : kit.prixCoins === 0 ? (
                  <p>
                    <strong className="font-semibold text-vert">Gratuit</strong> — aucun coin à
                    dépenser.
                  </p>
                ) : (
                  <p>
                    <strong className="font-titre text-[15px] text-or">
                      {formaterCoins(kit.prixCoins)} coins
                    </strong>
                    , gagnés en jouant : environ 20 par kill, +50 tous les 10 kills, 500 pour
                    un KOTH tenu.
                  </p>
                )}

                {kit.prixEurosCentimes !== null && (
                  <p className="border-t border-bord pt-3">
                    Ou <strong className="text-violet">{formaterEuros(kit.prixEurosCentimes)}</strong>{' '}
                    sur la{' '}
                    <Link href="/boutique" className="text-violet underline underline-offset-2">
                      boutique
                    </Link>{' '}
                    — le même kit, juste sans le grind. Ça fait tourner le serveur.
                  </p>
                )}

                {kit.bientot && (
                  <p className="border-t border-bord pt-3 text-soupe">
                    Ce kit est annoncé mais pas encore jouable.
                  </p>
                )}
              </div>
            </BlocLateral>

            {/* --- rappels communs à tous les kits --- */}
            <BlocLateral titre="Les règles du soup">
              {/*
                En grille 2×2 plutôt qu'en liste : ça reprend le bloc de chiffres
                de la page /kits, et ça garde la colonne assez courte pour que le
                `sticky` ci-dessus serve à quelque chose.
                dt avant dd pour rester du HTML valide, inversés à l'affichage.
              */}
              <dl className="grid grid-cols-2 gap-2">
                {REPERES_AFFICHES.map((repere) => (
                  <div
                    key={repere.cle}
                    className="flex flex-col-reverse rounded-lg border border-bord bg-nuit px-3 py-2.5 text-center"
                  >
                    <dt className="mt-1 font-mono text-[9.5px] tracking-[1px] text-gris uppercase">
                      {repere.label}
                    </dt>
                    <dd className="font-titre text-[17px] leading-none text-or">
                      {repere.valeur}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[13px] text-gris">
                Identiques pour les {tousLesKits.length} kits. Seule la capacité change.
              </p>
            </BlocLateral>
          </aside>
        </div>
      </main>

      {/* ============================ LES AUTRES KITS =========================== */}
      {suggestions.length > 0 && (
        <section className="mx-auto max-w-contenu px-6 pt-12">
          <h2 className="font-titre text-[clamp(20px,2.6vw,27px)] uppercase">
            Les autres kits
          </h2>
          <p className="mt-1.5 mb-6 text-[15.5px] text-gris">
            {exclusif
              ? 'Les autres kits maison, dans la même gamme de prix.'
              : 'Dans la même gamme de prix — le prochain à viser, sans doute.'}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((suggestion) => (
              <CarteKit key={suggestion.slug} kit={suggestion} />
            ))}
          </div>

          <Link
            href="/kits"
            className="mt-2 -mb-3 inline-flex min-h-11 items-center font-mono text-[12.5px] tracking-wide text-gris uppercase transition-colors hover:text-creme"
          >
            Voir les {tousLesKits.length} kits →
          </Link>
        </section>
      )}

      {/* ============================== APPEL À L'ACTION ======================== */}
      <section className="mx-auto max-w-contenu px-6">
        <div className="my-12 mb-20 rounded-xl border border-dashed border-soupe bg-linear-[100deg] from-soupe/7 to-transparent px-6 py-8.5 text-center">
          <h2 className="font-titre text-[clamp(19px,2.4vw,25px)] uppercase">
            {kit.bientot ? 'Prends de l’avance' : `Va chercher le ${kit.nom}`}
          </h2>
          <p className="mx-auto mt-2 mb-5 max-w-[480px] text-[15px] text-gris">
            {kit.kitDeDepart || kit.prixCoins === 0
              ? 'Il t’attend dès ta première connexion. Connecte-toi et saute dans l’arène.'
              : `Connecte-toi, enchaîne les kills, et il est à toi. ${formaterCoins(kit.prixCoins)} coins, ça se fait plus vite qu’on ne croit.`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <BoutonCopieIp
              aria-label={`Copier l’adresse du serveur, ${ip}`}
              className="rounded-lg bg-soupe px-6.5 py-3 font-mono text-[15px] font-bold text-[#1a0f00] transition-all hover:-translate-y-px hover:bg-or"
            >
              {ip}
            </BoutonCopieIp>

            <a
              href={discord}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-discord px-5 py-3 text-[15px] font-bold text-white transition-all hover:bg-[#6a76f5] hover:shadow-[0_4px_18px_rgba(88,101,242,.35)]"
            >
              <IconeDiscord className="size-4.5 fill-white" />
              Rejoindre le Discord
            </a>
          </div>
        </div>
      </section>
    </PagePublique>
  )
}

/* -------------------------------------------------------------------------- */
/* Composants locaux à cette page                                             */
/* -------------------------------------------------------------------------- */

/** Une carte de la colonne de droite : titre en petites capitales + contenu. */
function BlocLateral({
  titre,
  children,
}: {
  titre: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-bord bg-charbon px-6 py-5.5">
      <h2 className="mb-4 font-mono text-[10.5px] font-bold tracking-[1.4px] text-gris uppercase">
        {titre}
      </h2>
      {children}
    </section>
  )
}

/** Lien « kit précédent » ou « kit suivant », dans l'ordre de la grille. */
function LienKitVoisin({
  kit,
  direction,
}: {
  kit: { slug: string; nom: string }
  direction: 'precedent' | 'suivant'
}) {
  const versLaDroite = direction === 'suivant'

  return (
    <Link
      href={`/kits/${kit.slug}`}
      className={`flex flex-col gap-1 rounded-xl border border-bord bg-charbon px-5 py-4 transition-colors hover:border-[#3d2f5c] ${
        versLaDroite ? 'text-right' : ''
      }`}
    >
      <span className="font-mono text-[10.5px] tracking-[1.2px] text-gris uppercase">
        {versLaDroite ? 'Kit suivant' : 'Kit précédent'}
      </span>
      <span className="font-titre text-[15px] uppercase">
        {versLaDroite ? `${kit.nom} →` : `← ${kit.nom}`}
      </span>
    </Link>
  )
}
