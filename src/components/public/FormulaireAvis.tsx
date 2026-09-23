'use client'

import { useActionState, useId } from 'react'
import { useFormStatus } from 'react-dom'

import { envoyerAvis, type EtatAvis } from '@/actions/avis'
import { classesBouton } from '@/components/ui/Bouton'
import { CHAMP_PIEGE } from '@/lib/avis-partage'
import { t, type Locale } from '@/lib/i18n'
import { CASHPRIZE, euros } from '@/lib/saison'

/**
 * LE QUESTIONNAIRE JOUEURS — CÔTÉ NAVIGATEUR.
 *
 * Une seule page, cinq questions, aucune étape : un parcours en plusieurs
 * écrans ferait abandonner la moitié des gens pour une minute de réponses.
 *
 * LES CHOIX SONT DES `input` RADIO ET CHECKBOX DÉGUISÉS EN CARTES, pas des
 * `div` cliquables. On garde la navigation au clavier, l'annonce « 3 sur 7 »
 * des lecteurs d'écran et le groupement par `fieldset`/`legend` — pour le
 * prix d'un `peer-checked` en CSS.
 *
 * LA CONFIRMATION SERT AUSSI À COMMUNIQUER : quelqu'un qui vient de répondre
 * « je ne savais pas » pour le cashprize lit le montant et la règle juste
 * après. C'est le seul moment où on est sûr d'avoir son attention.
 */

const CLASSES_CHAMP =
  'w-full rounded-controle border border-bord bg-nuit px-3.5 py-2.5 text-[15px] text-creme placeholder:text-gris/50 focus:border-soupe focus:outline-none'

/** Carte cliquable : le vrai bouton est l'input, caché sous la carte. */
const CLASSES_CARTE =
  'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-carte border border-bord bg-charbon/60 px-3.5 py-2.5 text-[14.5px] text-creme transition-colors hover:border-soupe/60 peer-checked:border-soupe peer-checked:bg-soupe/10 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-soupe'

function Erreurs({ erreurs, id }: { erreurs?: string[]; id: string }) {
  if (!erreurs?.length) return null
  return (
    <ul id={id} className="mt-1.5 flex flex-col gap-0.5">
      {erreurs.map((m) => (
        <li key={m} className="text-[13px] text-rouge">
          {m}
        </li>
      ))}
    </ul>
  )
}

function Legende({ numero, texte, aide }: { numero: number; texte: string; aide?: string }) {
  return (
    <legend className="mb-3">
      <span className="font-mono text-[11px] tracking-[.14em] text-soupe uppercase">{numero}/5</span>
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
      <input
        type={multiple ? 'checkbox' : 'radio'}
        name={nom}
        value={valeur}
        className="peer sr-only"
      />
      <span className={CLASSES_CARTE}>
        <span
          aria-hidden
          className={`inline-block size-3 shrink-0 border border-gris/60 peer-checked:border-soupe peer-checked:bg-soupe ${
            multiple ? 'rounded-[2px]' : 'rounded-full'
          }`}
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
      {pending ? t(locale, 'avis.envoi') : t(locale, 'avis.envoyer')}
    </button>
  )
}

export function FormulaireAvis({ locale }: { locale: Locale }) {
  const [etat, action] = useActionState<EtatAvis, FormData>(envoyerAvis, {})
  const idBase = useId()

  if (etat.envoye) {
    return (
      <div className="rounded-carte border border-soupe/40 bg-soupe/[.07] px-6 py-8 text-center">
        <p className="font-titre text-[clamp(20px,3vw,26px)] text-creme">
          {t(locale, 'avis.merci-titre')}
        </p>
        <p className="mx-auto mt-3 max-w-[54ch] text-[15px] text-gris">
          {t(locale, 'avis.merci-texte')}
        </p>
        <p className="mx-auto mt-4 max-w-[54ch] text-[15px] text-creme">
          {t(locale, 'avis.merci-cashprize')
            .replace('{c}', euros(CASHPRIZE.total, locale))
            .replace('{p}', CASHPRIZE.podium.map((m) => euros(m, locale)).join(' · '))}
        </p>
      </div>
    )
  }

  const notes = ['1', '2', '3', '4', '5'] as const
  const priorites = ['combat', 'triche', 'modes', 'cartes', 'joueurs', 'boutique', 'autre'] as const
  const freins = ['peu-de-joueurs', 'attente', 'gameplay', 'tricheurs', 'horaires', 'aucun'] as const
  const cashprize = ['oui', 'vaguement', 'non'] as const

  return (
    <form action={action} className="flex flex-col gap-9">
      <input type="hidden" name="langue" value={locale} />

      {/* Le champ piège : invisible pour un humain, tentant pour un robot. */}
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${idBase}-piege`}>Site web</label>
        <input id={`${idBase}-piege`} type="text" name={CHAMP_PIEGE} tabIndex={-1} autoComplete="off" />
      </div>

      {etat.erreur && (
        <p role="alert" className="rounded-carte border border-rouge/40 bg-rouge/10 px-4 py-3 text-[14.5px] text-rouge">
          {etat.erreur}
        </p>
      )}

      {/* ---------- 1. la note ---------- */}
      <fieldset>
        <Legende numero={1} texte={t(locale, 'avis.q1')} aide={t(locale, 'avis.q1-aide')} />
        <div className="grid grid-cols-5 gap-2">
          {notes.map((n) => (
            <label key={n} className="relative block">
              <input type="radio" name="note" value={n} className="peer sr-only" />
              <span className="flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-carte border border-bord bg-charbon/60 px-1 py-2 transition-colors hover:border-soupe/60 peer-checked:border-soupe peer-checked:bg-soupe/10 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-soupe">
                <span className="font-titre text-[18px] text-creme">{n}</span>
                <span className="text-center font-mono text-[9.5px] leading-tight tracking-[.06em] text-gris uppercase">
                  {t(locale, `avis.note-${n}` as 'avis.note-1')}
                </span>
              </span>
            </label>
          ))}
        </div>
        <Erreurs erreurs={etat.champs?.note} id={`${idBase}-note`} />
      </fieldset>

      {/* ---------- 2. la priorité ---------- */}
      <fieldset>
        <Legende numero={2} texte={t(locale, 'avis.q2')} aide={t(locale, 'avis.q2-aide')} />
        <div className="grid gap-2 sm:grid-cols-2">
          {priorites.map((p) => (
            <Choix
              key={p}
              nom="priorite"
              valeur={p}
              libelle={t(locale, `avis.priorite-${p}` as 'avis.priorite-combat')}
            />
          ))}
        </div>
        <Erreurs erreurs={etat.champs?.priorite} id={`${idBase}-priorite`} />
      </fieldset>

      {/* ---------- 3. les freins ---------- */}
      <fieldset>
        <Legende numero={3} texte={t(locale, 'avis.q3')} aide={t(locale, 'avis.q3-aide')} />
        <div className="grid gap-2 sm:grid-cols-2">
          {freins.map((f) => (
            <Choix
              key={f}
              nom="freins"
              valeur={f}
              multiple
              libelle={t(locale, `avis.frein-${f}` as 'avis.frein-attente')}
            />
          ))}
        </div>
      </fieldset>

      {/* ---------- 4. le cashprize ---------- */}
      <fieldset>
        <Legende numero={4} texte={t(locale, 'avis.q4').replace('{c}', euros(CASHPRIZE.total, locale))} aide={t(locale, 'avis.q4-aide')} />
        <div className="grid gap-2 sm:grid-cols-3">
          {cashprize.map((c) => (
            <Choix
              key={c}
              nom="cashprize"
              valeur={c}
              libelle={t(locale, `avis.cashprize-${c}` as 'avis.cashprize-oui')}
            />
          ))}
        </div>
        <Erreurs erreurs={etat.champs?.cashprize} id={`${idBase}-cashprize`} />
      </fieldset>

      {/* ---------- 5. le texte libre ---------- */}
      <fieldset>
        <Legende numero={5} texte={t(locale, 'avis.q5')} aide={t(locale, 'avis.q5-aide')} />
        <textarea
          name="message"
          rows={5}
          maxLength={2000}
          placeholder={t(locale, 'avis.q5-exemple')}
          className={`${CLASSES_CHAMP} resize-y`}
        />
        <Erreurs erreurs={etat.champs?.message} id={`${idBase}-message`} />
      </fieldset>

      {/* ---------- la signature, facultative ---------- */}
      <div className="rounded-carte border border-bord bg-charbon/40 px-4 py-4">
        <label htmlFor={`${idBase}-pseudo`} className="block text-[15px] text-creme">
          {t(locale, 'avis.pseudo')}
        </label>
        <p className="mt-1 mb-2.5 text-[13.5px] text-gris">{t(locale, 'avis.pseudo-aide')}</p>
        <input
          id={`${idBase}-pseudo`}
          type="text"
          name="pseudo"
          maxLength={16}
          autoComplete="off"
          placeholder={t(locale, 'avis.pseudo-exemple')}
          className={`${CLASSES_CHAMP} sm:max-w-[280px]`}
        />
        <Erreurs erreurs={etat.champs?.pseudo} id={`${idBase}-pseudo-erreur`} />
      </div>

      <Bouton locale={locale} />
    </form>
  )
}
