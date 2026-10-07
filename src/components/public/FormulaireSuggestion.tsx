'use client'

import { useActionState, useId, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { envoyerSuggestion, type EtatSuggestion } from '@/actions/suggestions'
import { classesBouton } from '@/components/ui/Bouton'
import { t, type Locale } from '@/lib/i18n'
import { SITE } from '@/lib/site'
import {
  CATEGORIES_SUGGESTION,
  CHAMP_PIEGE_SUGGESTION,
  RAISONS_SUGGESTION,
  SUGGESTION_MAX,
} from '@/lib/suggestions-partage'

/**
 * LE FORMULAIRE DE SUGGESTIONS — CÔTÉ NAVIGATEUR.
 *
 * Même facture que FormulaireAvis (cartes radio/checkbox, une seule page).
 * Les erreurs affichées viennent du dictionnaire et non de zod : zod parle
 * français, et la moitié des visiteurs arrivent par /en.
 *
 * « Envoyer une autre idée » remonte un formulaire vierge en changeant sa clé :
 * plus simple que de vider chaque champ à la main.
 */

const CLASSES_CHAMP =
  'w-full rounded-controle border border-bord bg-nuit px-3.5 py-2.5 text-[15px] text-creme placeholder:text-gris/50 focus:border-soupe focus:outline-none'

const CLASSES_CARTE =
  'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-carte border border-bord bg-charbon/60 px-3.5 py-2.5 text-[14.5px] text-creme transition-colors hover:border-soupe/60 peer-checked:border-soupe peer-checked:bg-soupe/10 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-soupe'

function Erreur({ visible, texte }: { visible: boolean; texte: string }) {
  if (!visible) return null
  return <p className="mt-1.5 text-[13px] text-rouge">{texte}</p>
}

function Legende({ numero, texte, aide }: { numero: number; texte: string; aide?: string }) {
  return (
    <legend className="mb-3">
      <span className="font-mono text-[11px] tracking-[.14em] text-soupe uppercase">{numero}/4</span>
      <span className="mt-1 block font-titre text-[clamp(17px,2.2vw,21px)] leading-tight text-creme">
        {texte}
      </span>
      {aide && <span className="mt-1 block text-[14px] text-gris">{aide}</span>}
    </legend>
  )
}

function Choix({
  nom,
  valeur,
  libelle,
  multiple = false,
}: {
  nom: string
  valeur: string
  libelle: string
  multiple?: boolean
}) {
  return (
    <label className="relative block">
      <input type={multiple ? 'checkbox' : 'radio'} name={nom} value={valeur} className="peer sr-only" />
      <span className={CLASSES_CARTE}>
        <span
          aria-hidden
          className={`inline-block size-3 shrink-0 border border-gris/60 ${multiple ? 'rounded-[2px]' : 'rounded-full'}`}
        />
        {libelle}
      </span>
    </label>
  )
}

function Bouton({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={classesBouton({ taille: 'grande', className: 'w-full sm:w-auto' })}
    >
      {pending ? t(locale, 'sugg.envoi') : t(locale, 'sugg.envoyer')}
    </button>
  )
}

function Formulaire({ locale, recommencer }: { locale: Locale; recommencer: () => void }) {
  const [etat, action] = useActionState<EtatSuggestion, FormData>(envoyerSuggestion, {})
  const idBase = useId()

  if (etat.envoye) {
    return (
      <div className="rounded-carte border border-soupe/40 bg-soupe/[.07] px-6 py-8 text-center">
        <p className="font-titre text-[clamp(20px,3vw,26px)] text-creme">{t(locale, 'sugg.merci-titre')}</p>
        <p className="mx-auto mt-3 max-w-[54ch] text-[15px] text-gris">{t(locale, 'sugg.merci-texte')}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={SITE.discord}
            target="_blank"
            rel="noopener noreferrer"
            className={classesBouton({ taille: 'grande' })}
          >
            {t(locale, 'sugg.merci-discord')}
          </a>
          <button
            type="button"
            onClick={recommencer}
            className={classesBouton({ variante: 'vide', taille: 'grande' })}
          >
            {t(locale, 'sugg.merci-autre')}
          </button>
        </div>
      </div>
    )
  }

  const champs = etat.champs ?? {}

  return (
    <form action={action} className="flex flex-col gap-9">
      <input type="hidden" name="langue" value={locale} />

      {/* Le champ piège : invisible pour un humain, tentant pour un robot. */}
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${idBase}-piege`}>Site web</label>
        <input id={`${idBase}-piege`} type="text" name={CHAMP_PIEGE_SUGGESTION} tabIndex={-1} autoComplete="off" />
      </div>

      {etat.erreur && (
        <p role="alert" className="rounded-carte border border-rouge/40 bg-rouge/10 px-4 py-3 text-[14.5px] text-rouge">
          {etat.erreur}
        </p>
      )}

      {/* ---------- 1. ce qui le ferait rester ---------- */}
      <fieldset>
        <Legende numero={1} texte={t(locale, 'sugg.q1')} aide={t(locale, 'sugg.q1-aide')} />
        <div className="grid gap-2 sm:grid-cols-2">
          {CATEGORIES_SUGGESTION.map((c) => (
            <Choix key={c} nom="categorie" valeur={c} libelle={t(locale, `sugg.cat-${c}` as 'sugg.cat-modes')} />
          ))}
        </div>
        <Erreur visible={!!champs.categorie} texte={t(locale, 'sugg.erreur-categorie')} />
      </fieldset>

      {/* ---------- 2. la suggestion ---------- */}
      <fieldset>
        <Legende numero={2} texte={t(locale, 'sugg.q2')} aide={t(locale, 'sugg.q2-aide')} />
        <textarea
          name="message"
          rows={6}
          required
          maxLength={SUGGESTION_MAX}
          placeholder={t(locale, 'sugg.q2-exemple')}
          className={`${CLASSES_CHAMP} resize-y`}
        />
        <Erreur visible={!!champs.message} texte={t(locale, 'sugg.erreur-message')} />
      </fieldset>

      {/* ---------- 3. pourquoi il joue peu ---------- */}
      <fieldset>
        <Legende numero={3} texte={t(locale, 'sugg.q3')} aide={t(locale, 'sugg.q3-aide')} />
        <div className="grid gap-2 sm:grid-cols-2">
          {RAISONS_SUGGESTION.map((r) => (
            <Choix
              key={r}
              nom="raisons"
              valeur={r}
              multiple
              libelle={t(locale, `sugg.raison-${r}` as 'sugg.raison-attente')}
            />
          ))}
        </div>
      </fieldset>

      {/* ---------- 4. la signature, facultative ---------- */}
      <fieldset>
        <Legende numero={4} texte={t(locale, 'sugg.q4')} aide={t(locale, 'sugg.q4-aide')} />
        <div className="grid gap-4 rounded-carte border border-bord bg-charbon/40 px-4 py-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${idBase}-pseudo`} className="mb-1.5 block text-[14px] text-creme">
              {t(locale, 'sugg.pseudo')}
            </label>
            <input
              id={`${idBase}-pseudo`}
              type="text"
              name="pseudo"
              maxLength={16}
              autoComplete="off"
              className={CLASSES_CHAMP}
            />
            <Erreur visible={!!champs.pseudo} texte={t(locale, 'sugg.erreur-pseudo')} />
          </div>
          <div>
            <label htmlFor={`${idBase}-discord`} className="mb-1.5 block text-[14px] text-creme">
              {t(locale, 'sugg.discord')}
            </label>
            <input
              id={`${idBase}-discord`}
              type="text"
              name="discord"
              maxLength={33}
              autoComplete="off"
              className={CLASSES_CHAMP}
            />
            <Erreur visible={!!champs.discord} texte={t(locale, 'sugg.erreur-discord')} />
          </div>
        </div>
      </fieldset>

      <Bouton locale={locale} />
    </form>
  )
}

export function FormulaireSuggestion({ locale }: { locale: Locale }) {
  const [cle, setCle] = useState(0)
  return <Formulaire key={cle} locale={locale} recommencer={() => setCle((c) => c + 1)} />
}
