'use client'

import { useActionState, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { soumettreCandidature, type EtatCandidature } from '@/actions/candidature'
import { classesBouton } from '@/components/ui/Bouton'
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
  'w-full rounded-controle border border-bord bg-nuit px-3.5 py-2.5 text-[15px] text-creme placeholder:text-gris/50 focus:border-soupe focus:outline-none'

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
 *
 * ⚠ Ce composant n'est JAMAIS démonté quand on change d'étape : c'est son
 * conteneur qui est masqué. Le `useState` du compteur, comme la valeur du
 * champ, survit donc à un aller-retour dans le parcours.
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
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-controle border border-bord bg-nuit px-4 text-[15px] text-creme transition-colors has-checked:border-soupe has-checked:text-soupe hover:border-gris"
            >
              <input type="radio" name={champ} value={option} className="accent-soupe" />
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
      className={classesBouton({
        variante: 'plein',
        taille: 'grande',
        className:
          'w-full disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-soupe disabled:hover:shadow-none sm:w-auto',
      })}
    >
      {pending ? 'Envoi en cours…' : 'Envoyer ma candidature'}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Découpage en étapes                                                        */
/* -------------------------------------------------------------------------- */

type Etape = {
  cle: string
  nom: string
  questions: QuestionPubliee[]
  /**
   * Cette étape ouvre-t-elle le formulaire ? Si oui, les trois champs système
   * — pseudo Minecraft, pseudo Discord, âge — s'affichent AVANT ses questions.
   *
   * Ils ne forment pas une étape à eux seuls, et c'est délibéré : le découpage
   * appartient à la table SectionRecrutement. Leur créer une étape en dur
   * ajoutait un écran, et faisait apparaître deux fois de suite le titre
   * « Identité » quand une section de la base porte déjà ce nom.
   */
  identite: boolean
}

/**
 * Regroupe les questions par section, en respectant l'ordre reçu.
 *
 * Une section dont TOUTES les questions ont été désactivées depuis l'admin ne
 * produit aucun groupe : `lireQuestionsActives()` ne renvoie plus rien pour
 * elle, et elle ne devient donc pas une étape fantôme. La numérotation se
 * calcule sur les groupes réellement construits, jamais sur la table
 * SectionRecrutement.
 */
function parSection(questions: QuestionPubliee[]) {
  const blocs: { nom: string; questions: QuestionPubliee[] }[] = []

  for (const question of questions) {
    const dernier = blocs.at(-1)
    if (dernier?.nom === question.section) dernier.questions.push(question)
    else blocs.push({ nom: question.section, questions: [question] })
  }

  return blocs
}

/** Les noms des champs HTML que porte une étape. */
function champsDe(etape: Etape, derniere: boolean): string[] {
  const champs = etape.identite
    ? ['pseudoMinecraft', 'pseudoDiscord', 'age']
    : etape.questions.map((question) => champDeQuestion(question.id))

  return derniere ? [...champs, 'consentement'] : champs
}

/* -------------------------------------------------------------------------- */
/* Validation d'une étape, côté client                                        */
/* -------------------------------------------------------------------------- */

/**
 * ⚠ CONFORT, JAMAIS SÉCURITÉ.
 *
 * Cette validation ne fait qu'éviter au candidat d'arriver au bout d'un
 * parcours de sept écrans pour découvrir qu'il a laissé un champ vide au
 * deuxième. La source de vérité reste `soumettreCandidature` et son schéma
 * zod, qui revalident TOUT à l'envoi final, exactement comme avant ce
 * parcours. Ce qui passe ici et que le serveur refuse est simplement refusé.
 *
 * Les messages sont recopiés de src/lib/recrutement.ts pour qu'un candidat ne
 * lise jamais deux formulations différentes du même problème. Cette
 * duplication est assumée : recrutement-partage.ts, le seul endroit où elle
 * pourrait être évitée, est hors du périmètre de cette refonte. Si les deux
 * divergent un jour, c'est le serveur qui gagne et le candidat verra son
 * message. Noté dans le README.
 */
const REGEX_PSEUDO_MINECRAFT = /^[A-Za-z0-9_]{3,16}$/
const REGEX_PSEUDO_DISCORD = /^[A-Za-z0-9._-]{2,32}(#\d{4})?$/

function validerIdentite(lire: (nom: string) => string) {
  const erreurs: Record<string, string[]> = {}

  if (!REGEX_PSEUDO_MINECRAFT.test(lire('pseudoMinecraft'))) {
    erreurs.pseudoMinecraft = [
      'Pseudo Minecraft invalide : 3 à 16 caractères, lettres, chiffres et _ uniquement.',
    ]
  }

  if (!REGEX_PSEUDO_DISCORD.test(lire('pseudoDiscord'))) {
    erreurs.pseudoDiscord = ['Pseudo Discord invalide : 2 à 32 caractères, sans espace.']
  }

  const age = lire('age')
  if (!/^\d{1,3}$/.test(age)) {
    erreurs.age = ['Indique ton âge en chiffres.']
  } else if (Number(age) < AGE_MINIMUM) {
    erreurs.age = [`Il faut avoir ${AGE_MINIMUM} ans ou plus pour rejoindre le staff.`]
  } else if (Number(age) > AGE_MAXIMUM) {
    erreurs.age = ['Cet âge ne semble pas sérieux.']
  }

  return erreurs
}

function validerQuestion(question: QuestionPubliee, valeur: string): string[] {
  const choix = question.type === 'OUI_NON' || question.type === 'CHOIX_UNIQUE'

  // Le vide se traite d'abord, comme côté serveur : une question facultative
  // laissée vide est valide et s'arrête là.
  if (valeur === '') {
    if (!question.obligatoire) return []
    return [choix ? 'Choisis une réponse.' : 'Cette question est obligatoire.']
  }

  if (question.type === 'TEXTE_COURT' || question.type === 'TEXTE_LONG') {
    if (question.minimum !== null && valeur.length < question.minimum) {
      return [
        `Réponse trop courte : ${question.minimum} caractères minimum (tu en as écrit ${valeur.length}).`,
      ]
    }
  }

  if (question.type === 'NOMBRE') {
    if (!/^-?\d+$/.test(valeur)) return ['Indique un nombre entier.']
    const nombre = Number(valeur)
    if (question.minimum !== null && nombre < question.minimum) {
      return [`La valeur minimale est ${question.minimum}.`]
    }
    if (question.maximum !== null && nombre > question.maximum) {
      return [`La valeur maximale est ${question.maximum}.`]
    }
  }

  return []
}

/* -------------------------------------------------------------------------- */
/* La barre de progression                                                    */
/* -------------------------------------------------------------------------- */

function BarreProgression({
  index,
  total,
  nom,
}: {
  index: number
  total: number
  nom: string
}) {
  const numero = index + 1

  return (
    <div className="sticky top-nav z-40 -mx-gouttiere border-y border-bord bg-nuit/95 px-gouttiere py-3.5 backdrop-blur-xl">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-[10.5px] font-bold tracking-[.18em] text-soupe uppercase">
          Étape {numero} sur {total}
        </span>
        <span className="font-titre text-[15px]">{nom}</span>
      </div>

      {/*
        `aria-hidden` sur la jauge : l'information est déjà donnée en toutes
        lettres juste au-dessus, et le <progress> natif serait annoncé une
        seconde fois par les lecteurs d'écran.
      */}
      <div
        aria-hidden="true"
        className="mt-2.5 h-1.5 overflow-hidden rounded-[3px] border border-bord bg-braise"
      >
        <span
          style={{ width: `${(numero / total) * 100}%` }}
          className="block h-full bg-linear-90 from-soupe to-or transition-[width] duration-300"
        />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Le formulaire                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Le formulaire de candidature, en parcours guidé.
 *
 * ── Comment le parcours est bâti ────────────────────────────────────────────
 * UN SEUL <form>, du premier écran au dernier. Les étapes ne sont pas des
 * formulaires successifs : ce sont des <section> dont on masque celles qui ne
 * sont pas l'étape courante. Les champs masqués RESTENT montés, avec leur
 * valeur.
 *
 * Trois conséquences, et ce sont les trois raisons de ce choix :
 *   1. La Server Action reçoit exactement le même FormData qu'avant — tous les
 *      champs sont là à l'envoi, ils n'ont jamais quitté le formulaire.
 *   2. Les réponses survivent au bouton Retour sans un seul état React à
 *      maintenir : c'est le DOM qui les garde, comme il l'a toujours fait.
 *   3. Le compteur de caractères continue de fonctionner sans rien changer.
 *
 * ⚠ Masquage par l'attribut `hidden`, jamais par un rendu conditionnel. Un
 * `{etape === n && <Champs/>}` démonterait les champs et perdrait les réponses.
 *
 * ── Sans JavaScript ─────────────────────────────────────────────────────────
 * `parcours` ne passe à true qu'après le montage côté client. Le rendu initial,
 * serveur comme client, affiche donc TOUTES les sections et un seul bouton
 * d'envoi : c'est-à-dire exactement le formulaire d'avant. Le parcours est une
 * amélioration progressive, pas un remplacement.
 *
 * `apercu` sert à /admin/recrutement, qui rend CE composant-CI plutôt qu'une
 * maquette séparée. Le parcours y est volontairement désactivé : l'admin veut
 * relire ses dix-huit questions d'un coup d'œil, pas cliquer sept fois pour
 * vérifier une faute de frappe.
 */
export function FormulaireCandidature({
  questions,
  apercu = false,
}: {
  questions: QuestionPubliee[]
  apercu?: boolean
}) {
  const [etat, action] = useActionState<EtatCandidature, FormData>(soumettreCandidature, {})
  const idConsentement = useId()

  const formulaire = useRef<HTMLFormElement>(null)
  const [etapeCourante, setEtapeCourante] = useState(0)
  const [erreursClient, setErreursClient] = useState<Record<string, string[]>>({})
  const [modifie, setModifie] = useState(false)

  /**
   * Le parcours ne s'active qu'une fois monté dans le navigateur.
   *
   * Le premier rendu — celui du serveur, et le rendu d'hydratation qui doit lui
   * être identique — laisse donc tout visible. Sans ce drapeau, un visiteur
   * sans JavaScript ne verrait jamais que la première étape et ne pourrait
   * jamais candidater.
   */
  const [monte, setMonte] = useState(false)
  useEffect(() => setMonte(true), [])
  const parcours = monte && !apercu

  const etapes: Etape[] = useMemo(() => {
    const blocs = parSection(questions)

    // Aucune question active : il reste les trois champs système, qui doivent
    // bien s'afficher quelque part. Cas de bord atteignable depuis l'aperçu de
    // l'admin ; la page publique, elle, n'affiche pas le formulaire du tout.
    if (blocs.length === 0) {
      return [{ cle: 'identite', nom: 'Identité', questions: [], identite: true }]
    }

    return blocs.map((bloc, index) => ({
      cle: `section-${index}`,
      nom: bloc.nom,
      questions: bloc.questions,
      // Les champs système ouvrent la première étape, quel que soit son nom.
      identite: index === 0,
    }))
  }, [questions])

  const derniere = etapes.length - 1

  /**
   * Une erreur renvoyée par le serveur ramène le candidat sur l'étape
   * concernée. Sans ça, un refus de zod sur un champ de l'étape 2 laisserait
   * le candidat sur la dernière page devant un formulaire qui semble ne rien
   * faire.
   */
  useEffect(() => {
    if (!parcours || !etat.champs) return

    const index = etapes.findIndex((etape, position) =>
      champsDe(etape, position === derniere).some(
        (champ) => etat.champs?.[champ]?.length,
      ),
    )

    if (index >= 0) {
      setEtapeCourante(index)
      formulaire.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [etat.champs, parcours, etapes, derniere])

  /**
   * Avertit avant de fermer l'onglet, dès qu'un champ a été touché.
   *
   * Rien n'est écrit dans le navigateur : ces réponses contiennent l'âge d'un
   * mineur, un pseudo Discord et des mises en situation personnelles. Les
   * déposer dans localStorage reviendrait à laisser des données personnelles
   * sur une machine souvent partagée, sans durée de vie ni moyen d'effacement
   * — alors que la conservation est bornée à six mois côté serveur. Un
   * rechargement fait donc tout perdre, et c'est le comportement voulu.
   */
  useEffect(() => {
    if (!modifie || apercu || etat.succes) return

    function prevenir(evenement: BeforeUnloadEvent) {
      evenement.preventDefault()
    }

    window.addEventListener('beforeunload', prevenir)
    return () => window.removeEventListener('beforeunload', prevenir)
  }, [modifie, apercu, etat.succes])

  /** Les erreurs affichées sous un champ : celles du client, sinon du serveur. */
  function erreursDe(champ: string) {
    return erreursClient[champ] ?? etat.champs?.[champ]
  }

  /** Valide l'étape courante et renvoie ses erreurs, vides si tout va bien. */
  function validerEtapeCourante(): Record<string, string[]> {
    const element = formulaire.current
    if (!element) return {}

    const donnees = new FormData(element)
    const lire = (nom: string) => String(donnees.get(nom) ?? '').trim()

    const etape = etapes[etapeCourante]
    const erreurs: Record<string, string[]> = etape.identite ? validerIdentite(lire) : {}

    for (const question of etape.questions) {
      const champ = champDeQuestion(question.id)
      const messages = validerQuestion(question, lire(champ))
      if (messages.length) erreurs[champ] = messages
    }

    if (etapeCourante === derniere && donnees.get('consentement') !== 'on') {
      erreurs.consentement = [
        'Tu dois accepter la conservation de tes réponses pour candidater.',
      ]
    }

    return erreurs
  }

  function avancer() {
    const erreurs = validerEtapeCourante()
    setErreursClient(erreurs)

    const premier = Object.keys(erreurs)[0]
    if (premier) {
      // Le focus part sur le premier champ fautif : sur une étape longue,
      // l'erreur peut être hors écran.
      const champ = formulaire.current?.elements.namedItem(premier)
      const cible = champ instanceof RadioNodeList ? champ[0] : champ
      if (cible instanceof HTMLElement) cible.focus()
      return
    }

    setEtapeCourante((index) => Math.min(index + 1, derniere))
    formulaire.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /**
   * Le dernier écran n'a pas de bouton « Suivant » : ses questions et la case
   * de consentement ne passeraient donc par aucune validation client, et un
   * simple oubli de la case coûterait un aller-retour serveur — en consommant
   * au passage un jeton de limitation de débit.
   *
   * Ce garde-fou ne relâche rien : il ne fait que refuser plus tôt ce que le
   * serveur refuserait de toute façon. Sans JavaScript, il n'existe pas, et le
   * formulaire part directement au serveur comme avant.
   */
  function auMomentDEnvoyer(evenement: React.FormEvent<HTMLFormElement>) {
    if (!parcours) return

    const erreurs = validerEtapeCourante()
    if (Object.keys(erreurs).length === 0) return

    evenement.preventDefault()
    setErreursClient(erreurs)

    const premier = Object.keys(erreurs)[0]
    const champ = formulaire.current?.elements.namedItem(premier)
    const cible = champ instanceof RadioNodeList ? champ[0] : champ
    if (cible instanceof HTMLElement) cible.focus()
  }

  function reculer() {
    // Pas de validation en arrière : on ne bloque jamais quelqu'un qui veut
    // relire ce qu'il a écrit.
    setErreursClient({})
    setEtapeCourante((index) => Math.max(index - 1, 0))
    formulaire.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /* --- confirmation --------------------------------------------------- */
  if (etat.succes) {
    return (
      <div
        role="status"
        className="rounded-carte border border-vert/40 bg-charbon px-6 py-10 text-center"
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
          Inutile d’en renvoyer une : elle est enregistrée. Reste joignable sur Discord,
          c’est là que le staff te répondra.
        </p>
      </div>
    )
  }

  return (
    <form
      ref={formulaire}
      action={apercu ? undefined : action}
      noValidate
      onInput={() => {
        if (!modifie) setModifie(true)
      }}
      onSubmit={auMomentDEnvoyer}
      /*
        Entrée dans un champ de texte soumet un formulaire par défaut. En cours
        de parcours, ça enverrait une candidature à moitié remplie : on
        transforme donc la touche en « Suivant ». Les zones de texte gardent
        leur retour à la ligne.
      */
      onKeyDown={(evenement) => {
        if (evenement.key !== 'Enter') return
        if (!parcours || etapeCourante === derniere) return
        if (evenement.target instanceof HTMLTextAreaElement) return

        evenement.preventDefault()
        avancer()
      }}
      className="flex flex-col gap-10"
    >
      {/* `contents` : le fieldset désactive tout son contenu sans peser
          sur la mise en page, les enfants restent dans le flex du formulaire. */}
      <fieldset disabled={apercu} className="contents">
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

        {parcours && (
          <BarreProgression
            index={etapeCourante}
            total={etapes.length}
            nom={etapes[etapeCourante].nom}
          />
        )}

        {etapes.map((etape, index) => {
          const estDerniere = index === derniere

          return (
            <section
              key={etape.cle}
              // `hidden` et non un rendu conditionnel : les champs restent
              // montés, donc remplis, quand on navigue.
              hidden={parcours && index !== etapeCourante}
              aria-labelledby={`titre-${etape.cle}`}
              className="flex flex-col gap-5"
            >
              <h2
                id={`titre-${etape.cle}`}
                className="font-titre text-lg text-creme uppercase"
              >
                {etape.nom}
              </h2>

              {etape.identite && (
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
                      aria-invalid={erreursDe('pseudoMinecraft') ? true : undefined}
                      className={`${CLASSES_CHAMP} font-mono`}
                    />
                    <Erreurs
                      erreurs={erreursDe('pseudoMinecraft')}
                      id="pseudoMinecraft-erreur"
                    />
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
                      aria-invalid={erreursDe('pseudoDiscord') ? true : undefined}
                      className={`${CLASSES_CHAMP} font-mono`}
                    />
                    <p id="pseudoDiscord-aide" className="mt-1.5 text-[13px] text-gris">
                      C’est là que le staff te répondra. Vérifie-le deux fois.
                    </p>
                    <Erreurs
                      erreurs={erreursDe('pseudoDiscord')}
                      id="pseudoDiscord-erreur"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="age"
                      className="mb-1.5 block text-[15px] font-semibold text-creme"
                    >
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
                      aria-invalid={erreursDe('age') ? true : undefined}
                      className={`${CLASSES_CHAMP} max-w-40`}
                    />
                    <p id="age-aide" className="mt-1.5 text-[13px] text-gris">
                      {AGE_MINIMUM} ans minimum.
                    </p>
                    <Erreurs erreurs={erreursDe('age')} id="age-erreur" />
                  </div>
                </div>
              )}

              {etape.questions.map((question) => (
                <Question
                  key={question.id}
                  question={question}
                  erreurs={erreursDe(champDeQuestion(question.id))}
                />
              ))}

              {/* --- consentement, sur le dernier écran uniquement --------- */}
              {estDerniere && (
                <div className="rounded-carte border border-bord bg-charbon p-5.5">
                  <label
                    htmlFor={idConsentement}
                    className="flex cursor-pointer items-start gap-3"
                  >
                    <input
                      id={idConsentement}
                      name="consentement"
                      type="checkbox"
                      aria-describedby="consentement-erreur"
                      aria-invalid={erreursDe('consentement') ? true : undefined}
                      className="mt-1 size-5 shrink-0 accent-soupe"
                    />
                    <span className="text-[14px] text-gris">
                      {TEXTE_CONSENTEMENT}
                      <Obligatoire />
                    </span>
                  </label>
                  <Erreurs erreurs={erreursDe('consentement')} id="consentement-erreur" />
                </div>
              )}
            </section>
          )
        })}

        {/* --- navigation et envoi ------------------------------------------ */}
        <div className="flex flex-col gap-4">
          {etat.erreur && (
            <p
              role="alert"
              className="rounded-controle border border-rouge/40 bg-rouge/10 px-4 py-3 text-[14px] text-rouge"
            >
              {etat.erreur}
            </p>
          )}

          {apercu ? (
            <p className="rounded-controle border border-bord bg-braise px-4 py-3 text-[13px] text-gris">
              Aperçu — l’envoi est désactivé.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {parcours && etapeCourante > 0 && (
                <button
                  type="button"
                  onClick={reculer}
                  className={classesBouton({ variante: 'vide', taille: 'grande' })}
                >
                  Retour
                </button>
              )}

              {/*
                Le bouton d'envoi n'existe QUE sur le dernier écran — et hors
                parcours, c'est-à-dire sans JavaScript, où il est le seul.
              */}
              {parcours && etapeCourante < derniere ? (
                <button
                  type="button"
                  onClick={avancer}
                  className={classesBouton({
                    variante: 'plein',
                    taille: 'grande',
                    className: 'max-[560px]:w-full',
                  })}
                >
                  Suivant
                </button>
              ) : (
                <BoutonEnvoi />
              )}
            </div>
          )}

          <p className="text-[13px] text-gris">
            Une seule candidature à la fois. Prends le temps de te relire : tu ne pourras
            pas la modifier après l’envoi.
            {parcours && ' Un rechargement de la page efface tout : rien n’est enregistré tant que tu n’as pas envoyé.'}
          </p>
        </div>
      </fieldset>
    </form>
  )
}
