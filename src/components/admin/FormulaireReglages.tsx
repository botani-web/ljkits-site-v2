'use client'

import { useActionState } from 'react'

import { ETAT_VIDE } from '@/actions/etat'
import { enregistrerReglages } from '@/actions/reglages'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import { ChampTexte, MessageErreurGlobale } from '@/components/admin/Champs'

export type ReglagesEnEdition = {
  ip: string
  discord: string
}

export function FormulaireReglages({ reglages }: { reglages: ReglagesEnEdition }) {
  const [etat, envoyer] = useActionState(enregistrerReglages, ETAT_VIDE)

  return (
    <form action={envoyer} className="flex flex-col gap-6">
      <MessageErreurGlobale message={etat.erreur} />

      {etat.succes && (
        <p
          role="status"
          className="rounded-controle border border-vert/40 bg-vert/10 px-4 py-3 text-sm text-vert"
        >
          {etat.succes}
        </p>
      )}

      {/* ---------------------------- LE SERVEUR --------------------------- */}
      <section className="flex flex-col gap-4 rounded-carte border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base">Le serveur</h2>

        <ChampTexte
          nom="ip"
          label="Adresse du serveur Minecraft"
          defaultValue={reglages.ip}
          required
          placeholder="mc.ljkits.eu"
          aide="Ce que les joueurs collent dans leur client. Un nom d’hôte, sans http:// ni barre oblique. Affichée et copiable sur presque toutes les pages."
          erreurs={etat.champs?.ip}
        />

        <ChampTexte
          nom="discord"
          label="Lien d’invitation Discord"
          defaultValue={reglages.discord}
          required
          placeholder="https://discord.gg/ljkits"
          aide="Utilisé par la barre de navigation, le pied de page, la boutique et les pages de commande."
          erreurs={etat.champs?.discord}
        />
      </section>

      {/*
        Il n'y a pas de section « sites de vote ». Le serveur n'a pas de
        système de vote et n'en aura pas : récompenser des clics sur des sites
        tiers contredirait le positionnement « rien ne s'achète ».

        Les trois colonnes urlServeurPrive / urlTopServeurs /
        urlServeursMinecraft existent encore en base et dans schemaReglages.
        Elles sont donc réécrites à la chaîne vide à chaque enregistrement,
        ce qui est sans effet : elles valent déjà ''.
        À supprimer par une migration après l'ouverture — cf. README.
      */}

      <div className="flex items-center gap-3">
        <BoutonSoumettre>Enregistrer</BoutonSoumettre>
        <span className="text-[13px] text-gris">
          Les pages publiques sont régénérées immédiatement après l’enregistrement.
        </span>
      </div>
    </form>
  )
}
