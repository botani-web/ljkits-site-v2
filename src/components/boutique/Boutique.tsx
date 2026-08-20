'use client'

import Link from 'next/link'
import { useActionState, useEffect, useMemo, useState } from 'react'

import { creerCommande } from '@/actions/commandes'
import { ETAT_VIDE } from '@/actions/etat'
import { CarteGrade, CarteKitBoutique, CartePack } from '@/components/boutique/Cartes'
import { ModaleRecapitulatif } from '@/components/boutique/ModaleRecapitulatif'
import { Panier } from '@/components/boutique/Panier'
import type { GradeBoutique, KitBoutique, PackBoutique } from '@/components/boutique/types'
import {
  basculer,
  contient,
  ecrirePanierStocke,
  ecrirePseudoStocke,
  lirePanierStocke,
  lirePseudoStocke,
  retirer,
  type ArticleAffiche,
  type ArticlePanier,
} from '@/lib/panier'
import { useReglages } from '@/components/public/ContexteReglages'

type Onglet = 'grades' | 'kits' | 'aide'

const ONGLETS: { cle: Onglet; label: string }[] = [
  { cle: 'grades', label: 'Grades' },
  { cle: 'kits', label: 'Kits exclusifs' },
  { cle: 'aide', label: 'Comment ça marche' },
]

/**
 * Toute la partie interactive de la boutique : onglets, panier, modale.
 *
 * Un seul îlot client plutôt que trois : le panier est partagé par les
 * cartes, le résumé et la modale. Les découper obligerait à un contexte React
 * pour un bénéfice nul — la page ne contient rien d'autre.
 */
export function Boutique({
  grades,
  kits,
  packs,
}: {
  grades: GradeBoutique[]
  kits: KitBoutique[]
  packs: PackBoutique[]
}) {
  const { discord } = useReglages()
  const [onglet, setOnglet] = useState<Onglet>('grades')
  const [panier, setPanier] = useState<ArticlePanier[]>([])
  const [pseudo, setPseudo] = useState<string | null>(null)
  const [modaleOuverte, setModaleOuverte] = useState(false)

  /**
   * localStorage n'existe pas au rendu serveur : on part d'un panier vide et
   * on le remplit après le montage. Sans ce drapeau, le premier effet
   * d'écriture écraserait le contenu stocké avant même de l'avoir lu.
   */
  const [charge, setCharge] = useState(false)

  /** Catalogue indexé, pour retrouver nom et prix d'un article du panier. */
  const catalogue = useMemo(() => {
    const table = new Map<string, { nom: string; prixCentimes: number }>()
    for (const grade of grades) {
      table.set(`GRADE:${grade.slug}`, {
        nom: `Grade ${grade.nom}`,
        prixCentimes: grade.prixEurosCentimes,
      })
    }
    for (const kit of kits) {
      table.set(`KIT:${kit.slug}`, {
        nom: `Kit ${kit.nom}`,
        prixCentimes: kit.prixEurosCentimes,
      })
    }
    for (const pack of packs) {
      table.set(`PACK:${pack.slug}`, { nom: pack.nom, prixCentimes: pack.prixEurosCentimes })
    }
    return table
  }, [grades, kits, packs])

  useEffect(() => {
    // Un article retiré de la vente depuis la dernière visite ne peut plus
    // être acheté : on l'écarte silencieusement du panier restauré.
    setPanier(lirePanierStocke().filter((a) => catalogue.has(`${a.type}:${a.slug}`)))
    setPseudo(lirePseudoStocke())
    setCharge(true)
  }, [catalogue])

  useEffect(() => {
    if (charge) ecrirePanierStocke(panier)
  }, [panier, charge])

  const articles: ArticleAffiche[] = panier.flatMap((article) => {
    const entree = catalogue.get(`${article.type}:${article.slug}`)
    if (!entree) return []
    return [{ ...article, ...entree, disponible: true }]
  })

  const total = articles.reduce((somme, article) => somme + article.prixCentimes, 0)
  const pretAPayer = articles.length > 0 && pseudo !== null

  const [etat, envoyer] = useActionState(creerCommande, ETAT_VIDE)

  function basculerArticle(article: ArticlePanier) {
    setPanier((actuel) => basculer(actuel, article))
  }

  function allerAuPanier() {
    document.getElementById('panier')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <>
      {/* ------------------------------ ONGLETS ----------------------------- */}
      <div
        role="tablist"
        aria-label="Rayons de la boutique"
        className="mt-11 mb-8 flex flex-wrap gap-2 border-b border-bord"
      >
        {ONGLETS.map((option) => {
          const actif = onglet === option.cle
          return (
            <button
              key={option.cle}
              type="button"
              role="tab"
              aria-selected={actif}
              onClick={() => setOnglet(option.cle)}
              className={`-mb-px border-b-2 px-4.5 py-2.5 font-mono text-[13px] font-bold tracking-wide uppercase transition-colors ${
                actif
                  ? 'border-soupe text-or'
                  : 'border-transparent text-gris hover:text-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}

        <button
          type="button"
          onClick={allerAuPanier}
          className="ml-auto self-center rounded-[7px] bg-soupe px-3.5 py-2 font-mono text-[12.5px] font-bold text-[#1a0f00] transition-colors hover:bg-or lg:hidden"
        >
          Panier ({articles.length})
        </button>
      </div>

      <div className="grid items-start gap-7 pb-17 lg:grid-cols-[1fr_370px]">
        <div>
          {/* ------------------------- VUE : GRADES ------------------------- */}
          {onglet === 'grades' && (
            <section>
              <EnTeteRayon titre="Les grades">
                Un préfixe, des effets, un rôle Discord. Chaque grade inclut tout ce que
                contient le précédent.
              </EnTeteRayon>

              {grades.length === 0 ? (
                <Vide>Aucun grade en vente pour le moment.</Vide>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {grades.map((grade) => (
                    <CarteGrade
                      key={grade.slug}
                      grade={grade}
                      dansLePanier={contient(panier, { type: 'GRADE', slug: grade.slug })}
                      onBasculer={() => basculerArticle({ type: 'GRADE', slug: grade.slug })}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* -------------------- VUE : KITS EXCLUSIFS ---------------------- */}
          {onglet === 'kits' && (
            <section>
              <EnTeteRayon titre="Kits exclusifs">
                Des kits pensés et codés pour LJKITS. Aucun ne frappe plus fort que les kits
                gratuits : ils jouent autrement.
              </EnTeteRayon>

              {kits.length === 0 ? (
                <Vide>Aucun kit en vente pour le moment.</Vide>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {kits.map((kit) => (
                    <CarteKitBoutique
                      key={kit.slug}
                      kit={kit}
                      dansLePanier={contient(panier, { type: 'KIT', slug: kit.slug })}
                      onBasculer={() => basculerArticle({ type: 'KIT', slug: kit.slug })}
                    />
                  ))}
                </div>
              )}

              {packs.map((pack) => (
                <CartePack
                  key={pack.slug}
                  pack={pack}
                  dansLePanier={contient(panier, { type: 'PACK', slug: pack.slug })}
                  onBasculer={() => basculerArticle({ type: 'PACK', slug: pack.slug })}
                />
              ))}
            </section>
          )}

          {/* ---------------------- VUE : COMMENT ÇA MARCHE ---------------- */}
          {onglet === 'aide' && <Aide discord={discord} />}
        </div>

        {/* ------------------------------ PANIER ---------------------------- */}
        <Panier
          articles={articles}
          total={total}
          pseudo={pseudo}
          pretAPayer={pretAPayer}
          onRetirer={(article) => setPanier((actuel) => retirer(actuel, article))}
          onValiderPseudo={(nouveau) => {
            setPseudo(nouveau)
            ecrirePseudoStocke(nouveau)
          }}
          onChangerPseudo={() => {
            setPseudo(null)
            ecrirePseudoStocke(null)
          }}
          onPayer={() => setModaleOuverte(true)}
        />
      </div>

      {pseudo !== null && (
        <ModaleRecapitulatif
          ouverte={modaleOuverte}
          articles={articles}
          total={total}
          pseudo={pseudo}
          erreur={etat.erreur}
          action={envoyer}
          onFermer={() => setModaleOuverte(false)}
        />
      )}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Petits composants locaux                                                   */
/* -------------------------------------------------------------------------- */

function EnTeteRayon({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="mb-5.5">
      <h2 className="font-titre text-[clamp(20px,2.6vw,27px)] uppercase">{titre}</h2>
      <p className="mt-1.5 max-w-[620px] text-[15.5px] text-gris">{children}</p>
    </div>
  )
}

function Vide({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-bord px-6 py-10 text-center text-gris">
      {children}
    </p>
  )
}

function Aide({ discord }: { discord: string }) {
  return (
    <section>
      <EnTeteRayon titre="Comment ça marche">
        Trois étapes, et le contenu arrive sur ton compte en jeu.
      </EnTeteRayon>

      <div className="grid gap-3.5 md:grid-cols-3">
        <Info titre="1. Entre ton pseudo">
          Celui de ton compte Minecraft, exactement comme en jeu. Ton skin s’affiche pour
          confirmer que c’est le bon.
        </Info>
        <Info titre="2. Choisis et paie">
          Ajoute au panier, puis règle par carte, PayPal ou Paysafecard. Le paiement est
          traité par notre prestataire.
        </Info>
        <Info titre="3. Reçois en jeu">
          Le contenu est activé automatiquement, en général sous une minute. Reconnecte-toi
          si tu étais déjà en ligne.
        </Info>
      </div>

      <div className="mt-3.5 grid gap-3.5 md:grid-cols-3">
        <Info titre="Un souci de livraison ?">
          Ouvre un ticket sur le{' '}
          <a
            href={discord}
            target="_blank"
            rel="noopener noreferrer"
            className="text-soupe underline underline-offset-2"
          >
            Discord
          </a>{' '}
          avec ton pseudo et l’e-mail utilisé au paiement.
        </Info>
        <Info titre="Je me suis trompé de pseudo">
          Contacte-nous vite sur le Discord : tant que le contenu n’est pas consommé, on peut
          le transférer.
        </Info>
        <Info titre="Lier son Discord">
          Fais <code className="font-mono text-[12.5px] text-or">/discord</code> en jeu et
          colle le code dans le salon de vérification pour récupérer ton rôle.
        </Info>
      </div>

      <p className="mt-3.5 rounded-[10px] border border-bord px-5 py-4 text-[13px] text-gris">
        <strong className="font-semibold text-white">Note aux parents.</strong> Cette boutique
        propose des achats facultatifs sur un serveur Minecraft. Tout le contenu vendu
        s’obtient également en jouant, sans dépenser d’argent — le prix en coins est affiché
        sur chaque kit. Nous recommandons aux parents de superviser les achats de leurs
        enfants. Les achats sont définitifs une fois le contenu livré ; en cas de sanction
        pour triche, aucun remboursement n’est effectué. Le{' '}
        <Link href="/reglement" className="text-soupe underline underline-offset-2">
          règlement
        </Link>{' '}
        s’applique à tous les joueurs, quels que soient leurs achats.
      </p>
    </section>
  )
}

function Info({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-bord bg-braise px-5 py-4.5">
      <h3 className="mb-1.5 text-[14.5px] font-bold">{titre}</h3>
      <p className="text-[13.5px] text-gris">{children}</p>
    </div>
  )
}
