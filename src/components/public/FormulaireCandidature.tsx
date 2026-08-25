'use client'

import { useActionState, useId, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { soumettreCandidature, type EtatCandidature } from '@/actions/candidature'
import {
  AGE_MAXIMUM,
  AGE_MINIMUM,
  CHAMP_HONEYPOT,
  TEXTE_CONSENTEMENT,
  champDeQuestion,
  plafondDe,
  type QuestionPubliee,
} from '@/lib/recrutement-partage'

/* -------------------------------------------------------------------------- */
/* Briques                                                                    */
/* -------------------------------------------------------------------------- */

const CLASSES_CHAMP =
  'w-full rounded-lg border border-bord bg-nuit px-3.5 py-2.5 text-[15px] text-creme placeholder:text-gris/50 focus:border-soupe focus:outline-none'

function Erreurs({ erreurs, id }: { erreurs?: string[]; id: string }) {
  if (!erreurs?.length) return null

  return (
    <ul id={id} className="mt-1.5 flex flex-col gap-0.5">
      {erreurs.map((message) => (
        <li key={message} className="text-[13px] text-rouge">
          {message}
        </li>
      ))}
    </ul>
  )
}

/** L'étoile des champs obligatoires, annoncée aux lecteurs d'écran. */
function Obligatoire() {
  return (
    <>
      <span aria-hidden="true" className="ml-1 text-soupe">
        *
      </span>
      <span className="sr-only"> (obligatoire)</span>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Une question                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Le rendu d'une question, d'après son type.
 *
 * Le compteur de caractères est purement indicatif : c'est le serveur qui
 * tranche, avec les bornes relues en base (cf. src/lib/recrutement.ts). Les
 * attributs `minLength` / `maxLength` du HTML sont un confort, pas une
 * sécurité — ils se contournent en trois clics dans l'inspecteur.
 */
function Question({
  question,
  erreurs,
}: {
  question: QuestionPubliee
  erreurs?: string[]
}) {
  const champ = champDeQuestion(question.id)
  const idAide = `${champ}-aide`
  const idErreur = `${champ}-erreur`
  const [valeur, setValeur] = useState('')

  const plafond = plafondDe(question)
  const decrit = [question.aide ? idAide : null, erreurs?.length ? idErreur : null]
    .filter(Boolean)
    .join(' ')

  // Le compteur n'a de sens que là où il y a une longueur à atteindre.
  const compteur =
    question.type === 'TEXTE_LONG' && question.minimum !== null ? (
      <span
        className={`font-mono text-[12px] ${
          valeur.trim().length >= question.minimum ? 'text-vert' : 'text-gris'
        }`}
      >
        {valeur.trim().length} / {question.minimum} minimum
      </span>
    ) : null

  const communs = {
    id: champ,
    name: champ,
    'aria-describedby': decrit || undefined,
    'aria-invalid': erreurs?.length ? true : undefined,
    className: CLASSES_CHAMP,
  }

  return (
    <div>
      <label htmlFor={champ} className="mb-1.5 block text-[15px] font-semibold text-creme">
        {question.libelle}
        {question.obligatoire && <Obligatoire />}
      </label>

      {question.type === 'TEXTE_COURT' && (
        <input {...communs} type="text" maxLength={plafond} autoComplete="off" />
      )}

      {question.type === 'TEXTE_LONG' && (
        <textarea
          {...communs}
          rows={5}
          maxLength={plafond}
          value={valeur}
          onChange={(evenement) => setValeur(evenement.target.value)}
          className={`${CLASSES_CHAMP} resize-y`}
        />
      )}

      {question.type === 'NOMBRE' && (
        <input
          {...communs}
          type="number"
          inputMode="numeric"
          min={question.minimum ?? undefined}
          max={question.maximum ?? undefined}
          className={`${CLASSES_CHAMP} max-w-40`}
        />
      )}

      {question.type === 'OUI_NON' && (
        // Un groupe de boutons radio, pas une case à cocher : « non » doit
        // être un choix explicite, pas l'absence de réponse.
        <fieldset className="flex gap-2" aria-describedby={decrit || undefined}>
          <legend className="sr-only">{question.libelle}</legend>
          {(['oui', 'non'] as const).map((option) => (
            <label
              key={option}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-bord bg-nuit px-4 text-[15px] text-creme transition-colors has-checked:border-soupe has-checked:text-soupe hover:border-gris"
            >
              <input
                type="radio"
                name={champ}
                value={option}
                className="accent-soupe"
              />
              {option === 'oui' ? 'Oui' : 'Non'}
            </label>
          ))}
        </fieldset>
      )}

      {question.type === 'CHOIX_UNIQUE' && (
        <select {...communs} defaultValue="">
          <option value="" disabled>
            Choisis une réponse…
          </option>
          {question.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}

      <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
        {question.aide ? (
          <p id={idAide} className="text-[13px] text-gris">
            {question.aide}
          </p>
        ) : (
          <span />
        )}
        {compteur}
      </div>

      <Erreurs erreurs={erreurs} id={idErreur} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Le bouton d'envoi                                                          */
/* -------------------------------------------------------------------------- */

function BoutonEnvoi() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-12 w-full rounded-lg bg-linear-[135deg] from-soupe to-or px-6 text-[15px] font-bold text-[#1a1005] transition-shadow hover:shadow-[0_4px_18px_rgba(254,147,1,.35)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? 'Envoi en cours…' : 'Envoyer ma candidature'}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Le formulaire                                                              */
/* -------------------------------------------------------------------------- */

/** Regroupe les questions par section, en respectant l'ordre reçu. */
function parSection(questions: QuestionPubliee[]) {
  const blocs: { nom: string; questions: QuestionPubliee[] }[] = []

  for (const question of questions) {
    const dernier = blocs.at(-1)
    if (dernier?.nom === question.section) dernier.questions.push(question)
    else blocs.push({ nom: question.section, questions: [question] })
  }

  return blocs
}

export function FormulaireCandidature({ questions }: { questions: QuestionPubliee[] }) {
  const [etat, action] = useActionState<EtatCandidature, FormData>(soumettreCandidature, {})
  const idConsentement = useId()

  /* --- confirmation --------------------------------------------------- */
  if (etat.succes) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-vert/40 bg-charbon px-6 py-10 text-center"
      >
        <p className="font-titre text-xl text-vert uppercase">Candidature envoyée</p>
        <p className="mx-auto mt-3 max-w-lg text-[15px] text-gris">{etat.succes}</p>

        {etat.numero !== undefined && (
          <p className="mt-5 font-mono text-sm text-creme">
            Ton numéro de dossier :{' '}
            <span className="text-soupe">#{String(etat.numero).padStart(6, '0')}</span>
          </p>
        )}

        <p className="mx-auto mt-5 max-w-lg text-[13px] text-gris">
          Inutile d’en renvoyer une : elle est enregistrée. Reste joignable sur
          Discord, c’est là que le staff te répondra.
        </p>
      </div>
    )
  }

  const blocs = parSection(questions)

  return (
    <form action={action} noValidate className="flex flex-col gap-10">
      {/* Le champ piège. Hors écran plutôt que `hidden` : un robot lit le HTML
          et ignore un champ explicitement caché, alors qu'il remplit celui-ci.
          `aria-hidden` et `tabIndex` le retirent du clavier et des lecteurs
          d'écran, donc aucun humain ne peut le remplir par accident. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={CHAMP_HONEYPOT}>Ne remplis pas ce champ</label>
        <input
          id={CHAMP_HONEYPOT}
          name={CHAMP_HONEYPOT}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* --- identité : trois champs système, jamais administrables ------- */}
      <section className="flex flex-col gap-5">
        <h2 className="font-titre text-lg text-creme uppercase">Identité</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="pseudoMinecraft"
              className="mb-1.5 block text-[15px] font-semibold text-creme"
            >
              Pseudo Minecraft
              <Obligatoire />
            </label>
            <input
              id="pseudoMinecraft"
              name="pseudoMinecraft"
              type="text"
              maxLength={16}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="pseudoMinecraft-erreur"
              aria-invalid={etat.champs?.pseudoMinecraft ? true : undefined}
              className={`${CLASSES_CHAMP} font-mono`}
            />
            <Erreurs erreurs={etat.champs?.pseudoMinecraft} id="pseudoMinecraft-erreur" />
          </div>

          <div>
            <label
              htmlFor="pseudoDiscord"
              className="mb-1.5 block text-[15px] font-semibold text-creme"
            >
              Pseudo Discord
              <Obligatoire />
            </label>
            <input
              id="pseudoDiscord"
              name="pseudoDiscord"
              type="text"
              maxLength={37}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="pseudoDiscord-aide pseudoDiscord-erreur"
              aria-invalid={etat.champs?.pseudoDiscord ? true : undefined}
              className={`${CLASSES_CHAMP} font-mono`}
            />
            <p id="pseudoDiscord-aide" className="mt-1.5 text-[13px] text-gris">
              C’est là que le staff te répondra. Vérifie-le deux fois.
            </p>
            <Erreurs erreurs={etat.champs?.pseudoDiscord} id="pseudoDiscord-erreur" />
          </div>

          <div>
            <label htmlFor="age" className="mb-1.5 block text-[15px] font-semibold text-creme">
              Âge
              <Obligatoire />
            </label>
            <input
              id="age"
              name="age"
              type="number"
              inputMode="numeric"
              min={AGE_MINIMUM}
              max={AGE_MAXIMUM}
              aria-describedby="age-aide age-erreur"
              aria-invalid={etat.champs?.age ? true : undefined}
              className={`${CLASSES_CHAMP} max-w-40`}
            />
            <p id="age-aide" className="mt-1.5 text-[13px] text-gris">
              {AGE_MINIMUM} ans minimum.
            </p>
            <Erreurs erreurs={etat.champs?.age} id="age-erreur" />
          </div>
        </div>
      </section>

      {/* --- les questions administrables --------------------------------- */}
      {blocs.map((bloc) => (
        <section key={bloc.nom} className="flex flex-col gap-5">
          <h2 className="font-titre text-lg text-creme uppercase">{bloc.nom}</h2>
          {bloc.questions.map((question) => (
            <Question
              key={question.id}
              question={question}
              erreurs={etat.champs?.[champDeQuestion(question.id)]}
            />
          ))}
        </section>
      ))}

      {/* --- consentement -------------------------------------------------- */}
      <section className="rounded-xl border border-bord bg-charbon p-5">
        <label htmlFor={idConsentement} className="flex cursor-pointer items-start gap-3">
          <input
            id={idConsentement}
            name="consentement"
            type="checkbox"
            aria-describedby="consentement-erreur"
            aria-invalid={etat.champs?.consentement ? true : undefined}
            className="mt-1 size-5 shrink-0 accent-soupe"
          />
          <span className="text-[14px] text-gris">
            {TEXTE_CONSENTEMENT}
            <Obligatoire />
          </span>
        </label>
        <Erreurs erreurs={etat.champs?.consentement} id="consentement-erreur" />
      </section>

      {/* --- envoi --------------------------------------------------------- */}
      <div className="flex flex-col gap-4">
        {etat.erreur && (
          <p
            role="alert"
            className="rounded-lg border border-rouge/40 bg-rouge/10 px-4 py-3 text-[14px] text-rouge"
          >
            {etat.erreur}
          </p>
        )}

        <BoutonEnvoi />

        <p className="text-[13px] text-gris">
          Une seule candidature à la fois. Prends le temps de te relire : tu ne
          pourras pas la modifier après l’envoi.
        </p>
      </div>
    </form>
  )
}
