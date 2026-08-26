/**
 * Briques de formulaire de l'administration.
 *
 * Volontairement minimalistes : un label, un champ HTML natif, et les
 * messages d'erreur renvoyés par zod juste en dessous. Pas de librairie de
 * formulaire — les Server Actions et `useActionState` suffisent.
 */

function MessagesErreur({ erreurs }: { erreurs?: string[] }) {
  if (!erreurs?.length) return null

  return (
    <ul className="mt-1.5 flex flex-col gap-0.5">
      {erreurs.map((message) => (
        <li key={message} className="text-[13px] text-rouge">
          {message}
        </li>
      ))}
    </ul>
  )
}

const CLASSES_CHAMP =
  'w-full rounded-controle border border-bord bg-nuit px-3.5 py-2.5 text-[15px] text-creme placeholder:text-gris/60 focus:border-soupe focus:outline-none'

export function ChampTexte({
  nom,
  label,
  aide,
  erreurs,
  ...props
}: {
  nom: string
  label: string
  aide?: string
  erreurs?: string[]
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={nom} className="mb-1.5 block text-sm font-semibold text-creme">
        {label}
      </label>
      <input id={nom} name={nom} className={CLASSES_CHAMP} {...props} />
      {aide && <p className="mt-1.5 text-[13px] text-gris">{aide}</p>}
      <MessagesErreur erreurs={erreurs} />
    </div>
  )
}

export function ChampZoneTexte({
  nom,
  label,
  aide,
  erreurs,
  ...props
}: {
  nom: string
  label: string
  aide?: string
  erreurs?: string[]
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={nom} className="mb-1.5 block text-sm font-semibold text-creme">
        {label}
      </label>
      <textarea id={nom} name={nom} className={`${CLASSES_CHAMP} resize-y`} {...props} />
      {aide && <p className="mt-1.5 text-[13px] text-gris">{aide}</p>}
      <MessagesErreur erreurs={erreurs} />
    </div>
  )
}

export function ChampSelection({
  nom,
  label,
  options,
  erreurs,
  ...props
}: {
  nom: string
  label: string
  options: { valeur: string; label: string }[]
  erreurs?: string[]
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={nom} className="mb-1.5 block text-sm font-semibold text-creme">
        {label}
      </label>
      <select id={nom} name={nom} className={CLASSES_CHAMP} {...props}>
        {options.map((option) => (
          <option key={option.valeur} value={option.valeur} className="bg-nuit">
            {option.label}
          </option>
        ))}
      </select>
      <MessagesErreur erreurs={erreurs} />
    </div>
  )
}

export function ChampCase({
  nom,
  label,
  aide,
  defaultChecked,
}: {
  nom: string
  label: string
  aide?: string
  defaultChecked?: boolean
}) {
  return (
    <label
      htmlFor={nom}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-bord bg-nuit px-3.5 py-3 transition-colors hover:border-[#43305E]"
    >
      <input
        id={nom}
        name={nom}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 accent-soupe"
      />
      <span>
        <span className="block text-sm font-semibold text-creme">{label}</span>
        {aide && <span className="mt-0.5 block text-[13px] text-gris">{aide}</span>}
      </span>
    </label>
  )
}

/** Bandeau d'erreur globale, en tête de formulaire. */
export function MessageErreurGlobale({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p
      role="alert"
      className="rounded-lg border border-rouge/40 bg-rouge/10 px-4 py-3 text-sm text-rouge"
    >
      {message}
    </p>
  )
}
