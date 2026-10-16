'use client'

import { useActionState, useEffect, useRef, useState } from 'react'

import { creerCommande, type EtatCommande } from '@/actions/commandes'
import { ETAT_VIDE } from '@/actions/etat'
import { IconeCoins } from '@/components/s2/IconeCoins'
import { useLocale } from '@/hooks/useLocale'
import { formaterEuros } from '@/lib/format'
import { type CleS2, ts } from '@/lib/i18n-s2'
import { ecrirePseudoStocke, lirePseudoStocke, pseudoValide } from '@/lib/panier'
import { urlTete } from '@/lib/practice-commun'

/**
 * LA BOUTIQUE SIMPLIFIÉE (refonte S2, 16/10/2026).
 *
 * Deux gestes, pas un de plus : on écrit son pseudo une fois (retenu dans le
 * navigateur, avec la tête du compte pour vérifier), puis on clique « Acheter »
 * sur un article. Une fenêtre de confirmation résume (article, pseudo, total) et
 * le bouton Payer emmène DIRECTEMENT sur la page de paiement Tebex, dans le même
 * onglet — pas de panier, pas d'étape intermédiaire.
 *
 * Les grades : LJ++ est une amélioration de LJ+. On lit dans LuckPerms ce que le
 * pseudo possède déjà : LJ++ coûte 10 € à qui a LJ+, et 35 € (les deux d'un
 * coup) aux autres. Le serveur revérifie tout dans creerCommande.
 */

export type ProduitBoutique = {
  type: 'PACK' | 'GRADE'
  slug: string
  nom: string
  prixCentimes: number
  payable: boolean
  /** Coins livrés (packs) et palier de l'icône. */
  coins?: number
  niveau?: number
  /** Coins offerts en plus, en %, par rapport au plus petit pack. */
  bonus?: number
  meilleur?: boolean
  /** Grades. */
  avantages?: string[]
  icone?: string
  couleur?: string
}

type Possede = { connu: boolean; plus: boolean; plusPlus: boolean }
type Achat = { libelle: string; articles: { type: 'PACK' | 'GRADE'; slug: string }[]; prix: number; produit: ProduitBoutique }

export function BoutiqueS2({ produits, rayon }: { produits: ProduitBoutique[]; rayon: 'coins' | 'grades' }) {
  const locale = useLocale()
  const [pseudo, setPseudo] = useState<string | null>(null)
  const [saisie, setSaisie] = useState('')
  const [erreurPseudo, setErreurPseudo] = useState<CleS2 | null>(null)
  const [possede, setPossede] = useState<Possede | null>(null)
  const [achat, setAchat] = useState<Achat | null>(null)
  const champ = useRef<HTMLInputElement>(null)
  const bloc = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const retenu = lirePseudoStocke()
    if (retenu) setPseudo(retenu)
  }, [])

  // Ce que ce pseudo possède déjà (grades) — et s'il est déjà venu sur le serveur.
  useEffect(() => {
    if (!pseudo) {
      setPossede(null)
      return
    }
    const annulation = new AbortController()
    fetch(`/api/boutique/joueur?pseudo=${encodeURIComponent(pseudo)}`, { signal: annulation.signal })
      .then((r) => r.json())
      .then((d: Possede) => setPossede(d))
      .catch(() => undefined)
    return () => annulation.abort()
  }, [pseudo])

  function valider(e?: React.FormEvent) {
    e?.preventDefault()
    const propre = saisie.trim()
    if (!pseudoValide(propre)) {
      setErreurPseudo('b.pseudo-invalide')
      return
    }
    setErreurPseudo(null)
    setPseudo(propre)
    ecrirePseudoStocke(propre)
  }

  function changer() {
    setSaisie(pseudo ?? '')
    setPseudo(null)
    ecrirePseudoStocke(null)
    setTimeout(() => champ.current?.focus(), 0)
  }

  function acheter(p: ProduitBoutique) {
    if (!pseudo) {
      setErreurPseudo('b.pseudo-requis')
      bloc.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      bloc.current?.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }],
        { duration: 320 },
      )
      setTimeout(() => champ.current?.focus(), 350)
      return
    }
    setAchat(commeAchat(p))
  }

  /** LJ++ sans LJ+ : les deux d'un coup. */
  function commeAchat(p: ProduitBoutique): Achat {
    if (p.slug === 'ljplusplus' && !possede?.plus) {
      const plus = produits.find((x) => x.slug === 'ljplus')
      return {
        libelle: 'LJ+ + LJ++',
        articles: [
          { type: 'GRADE', slug: 'ljplus' },
          { type: 'GRADE', slug: 'ljplusplus' },
        ],
        prix: p.prixCentimes + (plus?.prixCentimes ?? 0),
        produit: p,
      }
    }
    return { libelle: p.nom, articles: [{ type: p.type, slug: p.slug }], prix: p.prixCentimes, produit: p }
  }

  return (
    <>
      {/* ─────────── 1. le pseudo ─────────── */}
      <div ref={bloc} className="rounded-[10px] border border-or/35 bg-charbon p-4 shadow-[0_20px_60px_-30px_rgba(254,147,1,.45)] sm:p-5">
        <p className="flex items-center gap-2 text-[14px] font-bold text-creme">
          <span className="grid size-6 place-items-center rounded-full bg-or font-mono text-[12px] text-encre">1</span>
          {ts(locale, 'b.etape-pseudo')}
        </p>
        {pseudo ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlTete(pseudo, 96)} alt="" width={44} height={44} className="rounded-[6px] bg-braise [image-rendering:pixelated]" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-gris">{ts(locale, 'b.livre-a')}</p>
              <p className="truncate text-[20px] font-extrabold text-creme">{pseudo}</p>
            </div>
            <button
              type="button"
              onClick={changer}
              className="h-10 rounded-[6px] border border-bord px-4 text-[14px] font-semibold text-gris hover:border-gris hover:text-creme"
            >
              {ts(locale, 'b.pseudo-changer')}
            </button>
            {possede && !possede.connu && (
              <p className="w-full text-[12.5px] text-soupe">{ts(locale, 'b.pseudo-inconnu')}</p>
            )}
          </div>
        ) : (
          <form onSubmit={valider} className="mt-3">
            <div className="flex gap-2">
              <input
                ref={champ}
                value={saisie}
                onChange={(e) => {
                  setSaisie(e.target.value)
                  setErreurPseudo(null)
                }}
                placeholder={ts(locale, 'b.pseudo-placeholder')}
                aria-label={ts(locale, 'b.etape-pseudo')}
                autoComplete="off"
                spellCheck={false}
                maxLength={16}
                className={`h-12 min-w-0 flex-1 rounded-[8px] border bg-nuit px-4 text-[17px] font-semibold text-creme placeholder:font-normal placeholder:text-gris/60 focus:outline-none ${
                  erreurPseudo ? 'border-rouge' : 'border-bord focus:border-or/70'
                }`}
              />
              <button type="submit" className="reflet h-12 shrink-0 rounded-[8px] bg-gradient-to-b from-or to-soupe px-5 text-[15px] font-bold text-encre hover:brightness-110">
                {ts(locale, 'b.pseudo-ok')}
              </button>
            </div>
            <p className={`mt-2 text-[13px] ${erreurPseudo ? 'font-semibold text-rouge' : 'text-gris'}`}>
              {ts(locale, erreurPseudo ?? 'b.pseudo-aide')}
            </p>
          </form>
        )}
      </div>

      {/* ─────────── 2. les articles ─────────── */}
      {rayon === 'coins' ? (
        <div className="apparition-grille mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {produits.map((p) => (
            <CartePack key={p.slug} p={p} onAcheter={() => acheter(p)} />
          ))}
        </div>
      ) : (
        <div className="apparition-grille mt-6 grid gap-4 md:grid-cols-2">
          {produits.map((p) => (
            <CarteGrade
              key={p.slug}
              p={p}
              possede={possede}
              prixAffiche={commeAchat(p).prix}
              onAcheter={() => acheter(p)}
            />
          ))}
        </div>
      )}

      {achat && pseudo && <Confirmation achat={achat} pseudo={pseudo} onFermer={() => setAchat(null)} />}
    </>
  )
}

function BoutonAcheter({ prix, etat, onClick }: { prix: number; etat: 'ok' | 'possede' | 'bientot'; onClick: () => void }) {
  const locale = useLocale()
  if (etat !== 'ok') {
    return (
      <span className="mt-4 flex h-11 w-full items-center justify-center rounded-[8px] border border-bord text-[14px] font-semibold text-gris">
        {etat === 'possede' ? `✓ ${ts(locale, 'b.possede')}` : ts(locale, 'b.bientot')}
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="reflet mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-gradient-to-b from-or to-soupe text-[15px] font-extrabold text-encre shadow-[0_8px_22px_-10px_rgba(254,147,1,.9)] transition-[filter,transform] hover:brightness-110 active:scale-[.98]"
    >
      {ts(locale, 'b.acheter')} · {formaterEuros(prix)}
    </button>
  )
}

function CartePack({ p, onAcheter }: { p: ProduitBoutique; onAcheter: () => void }) {
  const locale = useLocale()
  return (
    <div
      className={`group relative flex flex-col items-center rounded-[10px] border bg-charbon px-3 pt-5 pb-3 text-center transition-[transform,border-color] duration-200 hover:-translate-y-1 ${
        p.meilleur ? 'border-or/60' : 'border-bord hover:border-or/40'
      }`}
    >
      {p.meilleur && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-or px-2.5 py-0.5 text-[11px] font-extrabold whitespace-nowrap text-encre">
          {ts(locale, 'b.meilleur')}
        </span>
      )}
      <IconeCoins niveau={p.niveau ?? 1} taille={84} className="transition-transform duration-300 group-hover:scale-110" />
      <p className="mt-2 font-mono text-[22px] leading-none font-extrabold text-or tabular-nums">
        {(p.coins ?? 0).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}
      </p>
      <p className="text-[12.5px] text-gris">{ts(locale, 'b.coins')}</p>
      <p className={`mt-1.5 h-5 text-[12px] font-bold ${p.bonus ? 'text-vert' : 'text-transparent'}`}>
        {p.bonus ? ts(locale, 'b.bonus', { n: p.bonus }) : '·'}
      </p>
      <BoutonAcheter prix={p.prixCentimes} etat={p.payable ? 'ok' : 'bientot'} onClick={onAcheter} />
    </div>
  )
}

function CarteGrade({
  p,
  possede,
  prixAffiche,
  onAcheter,
}: {
  p: ProduitBoutique
  possede: Possede | null
  prixAffiche: number
  onAcheter: () => void
}) {
  const locale = useLocale()
  const plusPlus = p.slug === 'ljplusplus'
  const dejaLa = plusPlus ? possede?.plusPlus : possede?.plus
  const etat = dejaLa ? 'possede' : p.payable ? 'ok' : 'bientot'
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-[12px] border bg-charbon p-5 sm:p-6 ${plusPlus ? 'border-soupe/60' : 'border-or/35'}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: p.couleur }}
      />
      {plusPlus && (
        <span className="absolute top-4 right-4 rounded-full bg-soupe px-2.5 py-0.5 text-[11px] font-extrabold text-encre">
          {ts(locale, 'b.complet')}
        </span>
      )}
      <div className="relative flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-[12px] border border-bord bg-nuit/70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/items/${p.icone}.png`} alt="" width={40} height={40} className="flotte [image-rendering:pixelated]" />
        </span>
        <div>
          <p className="font-titre text-[32px] leading-none" style={{ color: p.couleur }}>
            {p.nom}
          </p>
          <p className="mt-1 text-[13px] text-gris">{ts(locale, 'b.a-vie')}</p>
        </div>
      </div>
      <p className="relative mt-5 flex items-baseline gap-2">
        <span className="text-[38px] leading-none font-extrabold tracking-[-.02em] text-creme tabular-nums">{formaterEuros(prixAffiche)}</span>
        {plusPlus && (
          <span className="text-[13px] text-gris">
            {possede?.plus ? ts(locale, 'b.plusplus-amelio') : ts(locale, 'b.plusplus-avec')}
          </span>
        )}
      </p>
      <ul className="cascade-defilement cascade relative mt-5 flex-1 space-y-2">
        {(p.avantages ?? []).map((a) => (
          <li key={a} className="flex gap-2.5 text-[14.5px] text-creme/90">
            <span className="mt-0.5 font-bold" style={{ color: p.couleur }} aria-hidden>
              ✓
            </span>
            {a}
          </li>
        ))}
      </ul>
      <BoutonAcheter prix={prixAffiche} etat={etat} onClick={onAcheter} />
    </div>
  )
}

/** La confirmation : ce qu'on achète, pour qui, combien — puis direct chez Tebex. */
function Confirmation({ achat, pseudo, onFermer }: { achat: Achat; pseudo: string; onFermer: () => void }) {
  const locale = useLocale()
  const dialogue = useRef<HTMLDialogElement>(null)
  const [etat, envoyer, enCours] = useActionState<EtatCommande, FormData>(creerCommande, ETAT_VIDE)
  const [redirection, setRedirection] = useState(false)

  useEffect(() => {
    const d = dialogue.current
    if (d && !d.open) d.showModal()
  }, [])

  // Commande créée : même onglet, page de paiement Tebex. Un changement de page n'est jamais bloqué.
  useEffect(() => {
    if (etat.paiement?.urlCheckout) {
      setRedirection(true)
      window.location.assign(etat.paiement.urlCheckout)
    }
  }, [etat.paiement])

  const p = achat.produit
  const occupe = enCours || redirection

  return (
    <dialog
      ref={dialogue}
      onClose={onFermer}
      onClick={(e) => {
        if (e.target === dialogue.current && !occupe) dialogue.current?.close()
      }}
      aria-labelledby="titre-achat"
      className="m-auto w-full max-w-[420px] bg-transparent p-4 text-creme backdrop:bg-nuit/80 backdrop:backdrop-blur-sm"
    >
      <div className="entree rounded-[14px] border border-bord bg-charbon p-5 shadow-[0_30px_80px_rgba(0,0,0,.6)] sm:p-6">
        <h2 id="titre-achat" className="text-[18px] font-extrabold">
          {ts(locale, 'b.confirmer-titre')}
        </h2>
        <div className="mt-4 flex items-center gap-4 rounded-[10px] border border-bord bg-nuit/60 p-3.5">
          {p.type === 'PACK' ? (
            <IconeCoins niveau={p.niveau ?? 1} taille={52} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/items/${p.icone}.png`} alt="" width={40} height={40} className="m-1.5 [image-rendering:pixelated]" />
          )}
          <div className="min-w-0">
            <p className="truncate text-[16px] font-bold">
              {p.type === 'PACK' ? `${(p.coins ?? 0).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} ${ts(locale, 'b.coins')}` : achat.libelle}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-gris">
              {ts(locale, 'b.livre-a')}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlTete(pseudo, 32)} alt="" width={16} height={16} className="rounded-[2px] [image-rendering:pixelated]" />
              <span className="font-semibold text-creme">{pseudo}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-[14px] text-gris">{ts(locale, 'b.total')}</span>
          <span className="text-[30px] font-extrabold tracking-[-.02em] text-or tabular-nums">{formaterEuros(achat.prix)}</span>
        </div>

        <form action={envoyer} className="mt-4">
          <input type="hidden" name="pseudoMinecraft" value={pseudo} />
          <input type="hidden" name="articles" value={JSON.stringify(achat.articles)} />
          <button
            type="submit"
            disabled={occupe}
            className="reflet flex h-13 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-or to-soupe text-[17px] font-extrabold text-encre shadow-[0_10px_28px_-10px_rgba(254,147,1,.9)] hover:brightness-110 disabled:cursor-wait disabled:opacity-80"
          >
            {occupe && <span className="size-4 animate-spin rounded-full border-2 border-encre/30 border-t-encre" aria-hidden />}
            {occupe ? ts(locale, 'b.redirection') : ts(locale, 'b.payer', { p: formaterEuros(achat.prix) })}
          </button>
        </form>
        {etat.erreur && <p className="mt-3 rounded-[6px] bg-rouge/10 px-3 py-2 text-[13.5px] font-semibold text-rouge">{etat.erreur}</p>}
        <p className="mt-3 text-center text-[12px] text-gris">{ts(locale, 'b.moyens')}</p>
        <p className="mt-1 text-center text-[12px] text-gris">{ts(locale, 'b.livraison')}</p>
        <button
          type="button"
          disabled={occupe}
          onClick={() => dialogue.current?.close()}
          className="mt-3 w-full py-2 text-[13.5px] font-semibold text-gris hover:text-creme disabled:opacity-50"
        >
          {ts(locale, 'b.annuler')}
        </button>
      </div>
    </dialog>
  )
}
