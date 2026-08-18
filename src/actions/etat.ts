/**
 * Forme de l'état renvoyé par les Server Actions de formulaire.
 * C'est ce que reçoit `useActionState` côté client pour afficher les erreurs.
 */
export type EtatFormulaire = {
  /** Message d'erreur global (slug déjà pris, action refusée…). */
  erreur?: string
  /** Erreurs de validation, par nom de champ. */
  champs?: Record<string, string[] | undefined>
}

/** État initial : aucun message. */
export const ETAT_VIDE: EtatFormulaire = {}
