'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'

import { creerCommande, type EtatCommande } from '@/actions/commandes'
import { ETAT_VIDE } from '@/actions/etat'
import { BarreBoutique } from '@/components/boutique/BarreBoutique'
import {
  CarteGradeProduit,
  CartePackCoinsProduit,
  TableauComparatif,
} from '@/components/boutique/CartesProduits'
import { ModaleRecapitulatif } from '@/components/boutique/ModaleRecapitulatif'
import { PaiementTebex } from '@/components/boutique/PaiementTebex'
import { Panier } from '@/components/boutique/Panier'
import type { GradeBoutique, PackBoutique } from '@/components/boutique/types'
import { EtatVide } from '@/components/ui/EtatVide'
import { Section } from '@/components/ui/Section'
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

/**
 * L'îlot client de la boutique : la barre, les deux rayons, le panier, la
 * modale de récapitulatif et l'écran de paiement.
 *
 * Refonte du 03/09/2026. Les onglets « Grades | Coins » ont disparu : ils
 * cachaient la moitié du catalogue derrière un clic, et un rayon qu'on ne
 * voit pas ne se vend pas. Les deux rayons sont maintenant affichés l'un sous
 * l'autre, avec une ancre chacun dans la barre collante.
 *
 * Le panier reste un seul état partagé par les cartes, la barre, le tiroir et
 * la modale — les découper obligerait à un contexte React pour rien.
 */
export function Boutique({ grades, packs }: { grades: GradeBoutique[]; packs: PackBoutique[] }) {
  const [panier, setPanier] = useState<ArticlePanier[]>([])
  const [pseudo, setPseudo] = useState<string | null>(null)
  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [panierOuvert, setPanierOuvert] = useState(false)
  /** localStorage n'existe pas au rendu serveur : on lit après le montage. */
  const [charge, setCharge] = useState(false)

  const catalogue = useMemo(() => {
    const table = new Map<string, { nom: string; prixCentimes: number }>()
    for (const grade of grades) {
      table.set(`GRADE:${grade.slug}`, {
        nom: `Grade ${grade.nom}`,
        prixCentimes: grade.prixEurosCentimes,
      })
    }
    for (const pack of packs) {
      table.set(`PACK:${pack.slug}`, { nom: pack.nom, prixCentimes: pack.prixEurosCentimes })
    }
    return table
  }, [grades, packs])

  const packsCoins = useMemo(() => packs.filter((pack) => (pack.coins ?? 0) > 0), [packs])
  /** Prix aux 1 000 coins du plus petit pack : la référence du dégressif. */
  const parMilleReference = useMemo(() => {
    const unitaires = packsCoins.map((p) => p.prixEurosCentimes / ((p.coins ?? 1) / 1000))
    return unitaires.length > 0 ? Math.max(...unitaires) : 0
  }, [packsCoins])
  /** Le pack au meilleur prix aux 1 000 coins porte le ruban. */
  const slugMeilleureValeur = useMemo(() => {
    let meilleur: { slug: string; parMille: number } | null = null
    for (const p of packsCoins) {
      const parMille = p.prixEurosCentimes / ((p.coins ?? 1) / 1000)
      if (!meilleur || parMille < meilleur.parMille) meilleur = { slug: p.slug, parMille }
    }
    return meilleur?.slug ?? null
  }, [packsCoins])
  const aucunPackPayable = packsCoins.length > 0 && packsCoins.every((p) => !p.paiementPret)

  useEffect(() => {
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

  const [etat, envoyer] = useActionState<EtatCommande, FormData>(creerCommande, ETAT_VIDE)

  /** Commande créée : on referme tiroir et modale pour laisser l'écran de paiement. */
  const paiement = etat.paiement
  useEffect(() => {
    if (!paiement) return
    setModaleOuverte(false)
    setPanierOuvert(false)
  }, [paiement])

  function basculerArticle(article: ArticlePanier) {
    setPanier((actuel) => basculer(actuel, article))
  }

  return (
    <>
      <BarreBoutique
        pseudo={pseudo}
        nombreArticles={articles.length}
        total={total}
        onOuvrirPanier={() => setPanierOuvert(true)}
      />

      {/* ═══════════════════════════ LES GRADES ═══════════════════════════ */}
      <Section
        id="grades"
        etiquette="Rayon 01 · Les grades"
        titre={
          <>
            Un achat, <span className="text-or">à vie</span>
          </>
        }
        chapeau="Trois grades, cumulatifs : chaque grade contient tout ce que donne le précédent. Ils changent ce que tu gagnes et comment on te voit — jamais ce que tu fais en combat."
        className="scroll-mt-[calc(var(--spacing-nav)+64px)]"
      >
        {grades.length === 0 ? (
          <EtatVide message="Aucun grade en vente pour le moment." />
        ) : (
          <div className="grid items-start gap-3.5 lg:grid-cols-3">
            {grades.map((grade, index) => (
              <CarteGradeProduit
                key={grade.slug}
                grade={grade}
                recommande={grades.length === 3 && index === 1}
                dansLePanier={contient(panier, { type: 'GRADE', slug: grade.slug })}
                onBasculer={() => basculerArticle({ type: 'GRADE', slug: grade.slug })}
              />
            ))}
          </div>
        )}
        <TableauComparatif grades={grades} />
      </Section>

      {/* ════════════════════════════ LES COINS ════════════════════════════ */}
      <Section
        id="coins"
        fond="charbon"
        etiquette="Rayon 02 · Les coins"
        titre={
          <>
            Le temps, <span className="text-or">pas la puissance</span>
          </>
        }
        chapeau="Les coins débloquent les kits — et tous les kits s'obtiennent en jouant, sans exception. Ici, tu achètes de quoi aller tout de suite au kit que tu voulais. Plus le palier est gros, moins les 1 000 coins te coûtent."
        className="scroll-mt-[calc(var(--spacing-nav)+64px)]"
      >
        {packsCoins.length === 0 ? (
          <EtatVide message="Aucun pack de coins pour le moment." />
        ) : (
          <div className="grid gap-3 min-[560px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {packsCoins.map((pack) => (
              <CartePackCoinsProduit
                key={pack.slug}
                pack={pack}
                parMilleReference={parMilleReference}
                meilleureValeur={pack.slug === slugMeilleureValeur}
                dansLePanier={contient(panier, { type: 'PACK', slug: pack.slug })}
                onBasculer={() => basculerArticle({ type: 'PACK', slug: pack.slug })}
              />
            ))}
          </div>
        )}
        {aucunPackPayable && (
          <p className="mt-5 text-center font-mono text-[11.5px] tracking-[.06em] text-gris">
            Les packs de coins sont en cours de branchement au paiement : les prix sont
            définitifs, l’achat ouvre dans quelques jours.
          </p>
        )}
      </Section>

      {/* ═══════════════════════════ LE PANIER ═══════════════════════════ */}
      <Panier
        ouvert={panierOuvert}
        onFermer={() => setPanierOuvert(false)}
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

      {paiement && (
        <PaiementTebex
          key={paiement.identPanier}
          commandeId={paiement.commandeId}
          urlCheckout={paiement.urlCheckout}
        />
      )}

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
