'use client'

import { useEffect, useMemo, useState } from 'react'

import { useStatutServeur } from '@/components/public/StatutServeur'
import { SITE } from '@/lib/site'

/**
 * Le serveur est-il ouvert, et sinon dans combien de temps ?
 *
 * `ouvertAuRendu` est la réponse du serveur au moment où la page a été
 * générée. Elle sert de valeur initiale pour que le premier affichage ne
 * clignote pas — et elle est identique côté serveur et côté client, puisque
 * c'est une propriété sérialisée : pas de divergence d'hydratation.
 *
 * Elle peut être périmée d'au plus une heure (`revalidate = 3600` sur
 * l'accueil). L'effet ci-dessous la corrige dès le montage, donc en pratique
 * en moins d'une seconde chez le visiteur.
 *
 * Le décompte, lui, n'est JAMAIS rendu côté serveur : il serait figé à
 * l'instant du build.
 */
export function useOuverture(ouvertAuRendu: boolean) {
  // Date.parse une seule fois : la constante ne bouge pas d'un rendu à l'autre.
  const cible = useMemo(() => Date.parse(SITE.ouverture), [])

  const [ouvert, setOuvert] = useState(ouvertAuRendu)
  const [restant, setRestant] = useState<number | null>(null)

  useEffect(() => {
    /** Renvoie true quand l'heure est passée — le battement s'arrête alors. */
    function battre() {
      const secondes = Math.floor((cible - Date.now()) / 1000)

      if (secondes <= 0) {
        setOuvert(true)
        setRestant(0)
        return true
      }

      setOuvert(false)
      setRestant(secondes)
      return false
    }

    // Premier battement immédiat : sinon l'encart afficherait un tiret pendant
    // une seconde entière au chargement.
    if (battre()) return

    const minuteur = setInterval(() => {
      if (battre()) clearInterval(minuteur)
    }, 1000)

    return () => clearInterval(minuteur)
  }, [cible])

  return { ouvert, restant }
}

/** 93_784 → « 1j 02h 03m 04s ». Les jours disparaissent le dernier jour. */
function formaterRestant(secondes: number): string {
  const deuxChiffres = (valeur: number) => String(valeur).padStart(2, '0')

  const jours = Math.floor(secondes / 86_400)
  const heures = Math.floor((secondes % 86_400) / 3_600)
  const minutes = Math.floor((secondes % 3_600) / 60)
  const restantes = secondes % 60

  const horloge = `${deuxChiffres(heures)}h ${deuxChiffres(minutes)}m ${deuxChiffres(restantes)}s`

  return jours > 0 ? `${jours}j ${horloge}` : horloge
}

/**
 * L'encart d'ouverture du hero.
 *
 * Avant le 29 août 15h30 : un décompte.
 * Après : le nombre de joueurs en ligne, via le même composant de statut que
 * le reste du site. La bascule est automatique, il n'y a rien à toucher le
 * jour J.
 */
export function EncartOuverture({
  ouvertAuRendu,
  /** « Samedi 29 août · 15h30 », formaté côté serveur en heure de Paris. */
  dateOuverture,
}: {
  ouvertAuRendu: boolean
  dateOuverture: string
}) {
  const { ouvert, restant } = useOuverture(ouvertAuRendu)
  const statut = useStatutServeur(ouvert)

  const valeur = ouvert
    ? statut === null
      ? '—'
      : String(statut.joueurs)
    : restant === null
      ? '—'
      : formaterRestant(restant)

  const mention = ouvert
    ? statut === null
      ? 'Connexion…'
      : statut.enLigne
        ? 'Serveur en ligne'
        : 'Serveur hors ligne'
    : dateOuverture

  return (
    <div className="mt-8.5 inline-flex w-full flex-col items-center justify-center gap-2 rounded-carte border border-or/35 bg-or/6 px-5 py-3.5 min-[560px]:w-auto min-[560px]:flex-row min-[560px]:flex-wrap min-[560px]:gap-3.5">
      <span className="font-mono text-[10.5px] font-bold tracking-[.18em] text-or uppercase">
        {ouvert ? 'Joueurs en ligne' : 'Ouverture dans'}
      </span>

      <span
        /*
          Annoncé aux lecteurs d'écran uniquement une fois ouvert, où la valeur
          change toutes les 60 secondes. Sur le décompte, qui change chaque
          seconde, ce serait un bavardage continu impossible à interrompre.
        */
        aria-live={ouvert ? 'polite' : 'off'}
        className="font-mono text-[15px] font-bold tracking-[.04em] text-creme"
      >
        {valeur}
      </span>

      <span aria-hidden="true" className="hidden h-4 w-px bg-or/30 min-[560px]:block" />

      <span className="font-mono text-[10.5px] font-bold tracking-[.18em] text-or uppercase">
        {mention}
      </span>
    </div>
  )
}

/**
 * La phrase du bloc d'appel de fin de page, qui bascule elle aussi le jour J :
 * on cesse d'annoncer un rendez-vous une fois qu'il est passé.
 */
export function PhraseOuverture({
  ouvertAuRendu,
  /** « samedi 29 août à 15h30 » — la forme qui s'insère dans une phrase. */
  dateEnPhrase,
}: {
  ouvertAuRendu: boolean
  dateEnPhrase: string
}) {
  const { ouvert } = useOuverture(ouvertAuRendu)

  return <>{ouvert ? 'Copie l’adresse et sors du spawn.' : `Rendez-vous ${dateEnPhrase}.`}</>
}
