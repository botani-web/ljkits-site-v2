'use client'

import { useActionState } from 'react'

import { connecter } from '@/actions/auth'
import { ETAT_VIDE } from '@/actions/etat'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import { ChampTexte, MessageErreurGlobale } from '@/components/admin/Champs'

export function FormulaireConnexion() {
  const [etat, action] = useActionState(connecter, ETAT_VIDE)

  return (
    <form action={action} className="flex flex-col gap-4">
      <MessageErreurGlobale message={etat.erreur} />

      <ChampTexte
        nom="email"
        label="Adresse e-mail"
        type="email"
        autoComplete="username"
        required
        erreurs={etat.champs?.email}
      />

      <ChampTexte
        nom="motDePasse"
        label="Mot de passe"
        type="password"
        autoComplete="current-password"
        required
        erreurs={etat.champs?.motDePasse}
      />

      <div className="mt-2">
        <BoutonSoumettre enCours="Connexion…">Se connecter</BoutonSoumettre>
      </div>
    </form>
  )
}
