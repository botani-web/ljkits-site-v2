'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'

import { creerCommande, type EtatCommande } from '@/actions/commandes'
import { ETAT_VIDE } from '@/actions/etat'
import { CarteGrade, CartePack } from '@/components/boutique/Cartes'
import { GrilleKitsBoutique } from '@/components/boutique/GrilleKitsBoutique'
import { ModaleRecapitulatif } from '@/components/boutique/ModaleRecapitulatif'
import { PaiementTebex } from '@/components/boutique/PaiementTebex'
import { Panier } from '@/components/boutique/Panier'
import type { GradeBoutique, KitBoutique, PackBoutique } from '@/components/boutique/types'
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
export function Boutique({
  grades,
  kits,
  packs,
  vitrine,
}: {
  grades: GradeBoutique[]
  kits: KitBoutique[]
  packs: PackBoutique[]
  vitrine: React.ReactNode
}) {
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

  const [etat, envoyer] = useActionState<EtatCommande, FormData>(creerCommande, ETAT_VIDE)

  /**
   * Le panier Tebex est prêt : on referme le récapitulatif pour laisser la
   * place à la modale de paiement. Deux <dialog> superposés se disputeraient
   * le focus.
   */
  const paiement = etat.paiement
  useEffect(() => {
    if (paiement) setModaleOuverte(false)
  }, [paiement])

  function basculerArticle(article: ArticlePanier) {
    setPanier((actuel) => basculer(actuel, article))
  }

  return (
    <>
      {/* ═══════════════════════════ LES GRADES ═══════════════════════════ */}
      <Section
        fond="charbon"
        id="grades"
        etiquette="Les grades"
        titre={
          <>
            Trois façons de se faire <span className="text-or">reconnaître</span>
          </>
        }
        chapeau={
          <>
            Permanents et cumulatifs : chaque grade contient tout ce que donne le précédent.{' '}
            <b className="font-semibold text-creme">Un seul achat, à vie</b> — pas
            d’abonnement, pas de renouvellement, rien qui expire.
          </>
        }
      >
        {grades.length === 0 ? (
          <EtatVide message="Aucun grade en vente pour le moment." />
        ) : (
          <div className="grid items-start gap-3.5 lg:grid-cols-3">
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
      </Section>

      {vitrine}

      {/* ════════════════════════ LES KITS ET LE PACK ════════════════════════ */}
      <Section
        fond="charbon"
        id="kits"
        etiquette="Les kits"
        titre={
          <>
            Débloque-les <span className="text-or">tout de suite</span>
          </>
        }
        chapeau="Chaque kit affiche aussi son prix en coins, pour que tu voies exactement combien d’heures de jeu tu économises."
      >
        {packs.map((pack) => (
          <div key={pack.slug} className="mb-3.5">
            <CartePack
              pack={pack}
              kitsInclus={pack.kitsInclus}
              dansLePanier={contient(panier, { type: 'PACK', slug: pack.slug })}
              onBasculer={() => basculerArticle({ type: 'PACK', slug: pack.slug })}
            />
          </div>
        ))}

        {kits.length === 0 ? (
          <EtatVide message="Aucun kit en vente pour le moment." />
        ) : (
          <GrilleKitsBoutique kits={kits} panier={panier} onBasculer={basculerArticle} />
        )}
      </Section>

      {/* ═══════════════════════════ LE PANIER ═══════════════════════════ */}
      <Section id="panier">
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
      </Section>

      {/*
        Le paiement s'affiche par-dessus la boutique, sans quitter ljkits.eu.
        La clé force un remontage à chaque nouveau panier Tebex : sans elle, un
        second paiement réutiliserait l'ident du premier.
      */}
      {paiement && (
        <PaiementTebex
          key={paiement.identPanier}
          identPanier={paiement.identPanier}
          commandeId={paiement.commandeId}
          urlCheckout={paiement.urlCheckout}
          onPaye={() => {
            setPanier([])
            ecrirePanierStocke([])
          }}
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
