'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'

import { creerCommande, type EtatCommande } from '@/actions/commandes'
import { ETAT_VIDE } from '@/actions/etat'
import { BarreBoutique } from '@/components/boutique/BarreBoutique'
import { CarteGrade, CartePackCoins } from '@/components/boutique/Cartes'
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
 * La partie interactive de la boutique : rayons, panier, modale de paiement.
 *
 * Un seul îlot client plutôt que trois : le panier est partagé par les cartes,
 * le résumé et la modale. Les découper obligerait à un contexte React pour un
 * bénéfice nul.
 *
 * Les onglets d'avant (Grades · Kits · Comment ça marche) ont disparu : la
 * maquette validée déroule tout sur une seule page, et le contenu de l'onglet
 * d'aide est devenu les sections livraison, garantie et FAQ, rendues côté
 * serveur dans la page.
 *
 * `vitrine` est un nœud rendu par le SERVEUR, passé en propriété et inséré
 * entre les grades et les kits. C'est ce qui permet de garder une section
 * purement statique au milieu d'un îlot client sans l'envoyer au navigateur.
 */
/** Les deux rayons. L'ordre est celui des onglets. */
const RAYONS = [
  { cle: 'grades' as const, nom: 'Grades' },
  { cle: 'coins' as const, nom: 'Coins' },
]

export function Boutique({
  grades,
  packs,
  vitrine,
}: {
  grades: GradeBoutique[]
  packs: PackBoutique[]
  vitrine: React.ReactNode
}) {
  const [panier, setPanier] = useState<ArticlePanier[]>([])
  const [pseudo, setPseudo] = useState<string | null>(null)
  const [modaleOuverte, setModaleOuverte] = useState(false)
  /*
    LA CATÉGORIE AFFICHÉE.
    ══════════════════════════════════════════════════════════════════════
    Avant, tout était empilé : les grades, PUIS une section de démonstration,
    PUIS les coins. Pour voir ce qu'on venait acheter, il fallait traverser
    ce qu'on ne cherchait pas. Une boutique ne se feuillette pas, elle se
    parcourt par rayon.
  */
  const [categorie, setCategorie] = useState<'grades' | 'coins'>('grades')
  const [panierOuvert, setPanierOuvert] = useState(false)

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
    // Aucune entrée 'KIT' : la boutique n'en vend plus depuis le
    // 03/09/2026. Le type reste dans le panier et dans TypeArticle parce
    // que des commandes passées le référencent — on cesse d'en proposer,
    // on ne réécrit pas l'historique. Un panier qui contiendrait encore un
    // kit (onglet resté ouvert) ne trouvera pas son libellé et sera
    // simplement ignoré au récapitulatif.
    for (const pack of packs) {
      table.set(`PACK:${pack.slug}`, { nom: pack.nom, prixCentimes: pack.prixEurosCentimes })
    }
    return table
  }, [grades, packs])

  /*
    Les packs qui donnent des coins, et le prix aux 1 000 coins du plus
    petit d'entre eux. C'est lui qui sert de référence : chaque carte
    affiche de combien elle fait mieux, ce qui rend le dégressif lisible
    sans calculatrice.
  */
  const packsCoins = useMemo(
    () => packs.filter((pack) => (pack.coins ?? 0) > 0),
    [packs],
  )
  const parMilleReference = useMemo(() => {
    const unitaires = packsCoins.map((p) => p.prixEurosCentimes / ((p.coins ?? 1) / 1000))
    return unitaires.length > 0 ? Math.max(...unitaires) : 0
  }, [packsCoins])

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

  const [etat, envoyer] = useActionState<EtatCommande, FormData>(creerCommande, ETAT_VIDE)

  /**
   * La commande est créée : on referme le récapitulatif ET le tiroir du panier
   * pour laisser la place à l'écran de paiement.
   *
   * Le tiroir surtout. Un <dialog> ouvert par showModal() vit dans le TOP
   * LAYER du navigateur : il recouvre tout le document, z-index compris. Tant
   * qu'il restait ouvert, l'écran de paiement était masqué derrière lui et il
   * fallait fermer le panier à la main pour le trouver.
   */
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

      {/* ══════════════════════════ LES RAYONS ══════════════════════════ */}
      <Section fond="charbon" id="rayons">
        <div
          role="tablist"
          aria-label="Rayons de la boutique"
          className="mx-auto flex max-w-[520px] gap-2 rounded-controle border border-bord bg-nuit p-1.5"
        >
          {RAYONS.map((rayon) => {
            const actif = categorie === rayon.cle
            return (
              <button
                key={rayon.cle}
                type="button"
                role="tab"
                aria-selected={actif}
                onClick={() => setCategorie(rayon.cle)}
                className={[
                  'flex min-h-11 flex-1 flex-col items-center justify-center rounded-controle px-3 py-2.5 transition-colors',
                  actif
                    ? 'bg-or text-nuit'
                    : 'text-gris hover:bg-braise hover:text-creme',
                ].join(' ')}
              >
                <span className="font-titre text-[15px] leading-none">{rayon.nom}</span>
                <span
                  className={[
                    'mt-1 font-mono text-[10.5px] tracking-[.08em]',
                    actif ? 'text-nuit/70' : 'text-gris',
                  ].join(' ')}
                >
                  {rayon.cle === 'grades' ? `${grades.length} grades` : `${packsCoins.length} paliers`}
                </span>
              </button>
            )
          })}
        </div>

        {/* ---------------------------- LES GRADES ---------------------------- */}
        {categorie === 'grades' && (
          <div className="mt-[clamp(26px,4vw,42px)]">
            <p className="mx-auto mb-6 max-w-[62ch] text-center text-[15px] text-gris">
              Permanents et cumulatifs : chaque grade contient tout ce que donne le
              précédent.{' '}
              <b className="font-semibold text-creme">Un seul achat, à vie</b> — pas
              d’abonnement, rien qui expire.
            </p>
            {grades.length === 0 ? (
              <EtatVide message="Aucun grade en vente pour le moment." />
            ) : (
              <div className="grid items-start gap-3.5 lg:grid-cols-3">
                {grades.map((grade, index) => (
                  <CarteGrade
                    key={grade.slug}
                    grade={grade}
                    // Celui du milieu : le compromis, et celui que les
                    // boutiques mettent en avant partout — pas un hasard,
                    // c'est le palier qu'on regarde en premier.
                    recommande={grades.length === 3 && index === 1}
                    dansLePanier={contient(panier, { type: 'GRADE', slug: grade.slug })}
                    onBasculer={() => basculerArticle({ type: 'GRADE', slug: grade.slug })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------- LES COINS ----------------------------- */}
        {/*
          Plus aucun kit ici depuis le 03/09/2026. Les trente-neuf kits
          s'obtiennent en jouant, sans exception : c'est la promesse du
          serveur, et la vendre à moitié la rendrait fausse. Ce qui s'achète,
          ce sont des coins — le temps de grind, pas la puissance.
        */}
        {categorie === 'coins' && (
          <div className="mt-[clamp(26px,4vw,42px)]">
            <p className="mx-auto mb-6 max-w-[62ch] text-center text-[15px] text-gris">
              Les coins débloquent des kits que tu peux{' '}
              <b className="font-semibold text-creme">tous obtenir en jouant</b>. Plus le
              palier est gros, moins les 1 000 coins te coûtent.
            </p>
            {packsCoins.length === 0 ? (
              <EtatVide message="Aucun pack de coins pour le moment." />
            ) : (
              <div className="grid gap-3 min-[560px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {packsCoins.map((pack) => (
                  <CartePackCoins
                    key={pack.slug}
                    pack={pack}
                    parMilleReference={parMilleReference}
                    dansLePanier={contient(panier, { type: 'PACK', slug: pack.slug })}
                    onBasculer={() => basculerArticle({ type: 'PACK', slug: pack.slug })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {/*
        La démonstration passe APRÈS les rayons. Elle était intercalée entre
        les grades et les coins : pour voir la seconde moitié du catalogue,
        il fallait traverser une section qui ne vendait rien.
      */}
      {vitrine}

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

      {/*
        Le paiement s'ouvre dans un onglet séparé, sur la page hébergée par
        Tebex. Ce bandeau ne fait que porter le lien et celui du suivi de
        commande.

        La clé force un remontage à chaque nouveau panier : sans elle, un
        second paiement afficherait l'URL du premier.

        Le panier n'est PAS vidé ici : c'est la page de commande qui s'en
        charge, une fois le paiement réellement confirmé par le webhook.
      */}
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
