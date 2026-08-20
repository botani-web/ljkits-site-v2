'use client'

import { useActionState } from 'react'

import { ETAT_VIDE } from '@/actions/etat'
import { enregistrerReglages } from '@/actions/reglages'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import { ChampTexte, MessageErreurGlobale } from '@/components/admin/Champs'

export type ReglagesEnEdition = {
  ip: string
  discord: string
  urlServeurPrive: string
  urlTopServeurs: string
  urlServeursMinecraft: string
}

export function FormulaireReglages({ reglages }: { reglages: ReglagesEnEdition }) {
  const [etat, envoyer] = useActionState(enregistrerReglages, ETAT_VIDE)

  return (
    <form action={envoyer} className="flex flex-col gap-6">
      <MessageErreurGlobale message={etat.erreur} />

      {etat.succes && (
        <p
          role="status"
          className="rounded-lg border border-vert/40 bg-vert/10 px-4 py-3 text-sm text-vert"
        >
          {etat.succes}
        </p>
      )}

      {/* ---------------------------- LE SERVEUR --------------------------- */}
      <section className="flex flex-col gap-4 rounded-2xl border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base uppercase">Le serveur</h2>

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

      {/* --------------------------- LES VOTES ----------------------------- */}
      <section className="flex flex-col gap-4 rounded-2xl border border-bord bg-charbon px-6 py-6">
        <div>
          <h2 className="font-titre text-base uppercase">Les sites de vote</h2>
          <p className="mt-1.5 text-[13px] text-gris">
            Laisse vide tant que le serveur n’y est pas inscrit : le bouton reste affiché sur
            l’accueil mais ne mène nulle part, plutôt que d’envoyer le joueur sur une page
            morte.
          </p>
        </div>

        <ChampTexte
          nom="urlServeurPrive"
          label="Serveur-Privé.net"
          defaultValue={reglages.urlServeurPrive}
          placeholder="https://serveur-prive.net/minecraft/ljkits/vote"
          erreurs={etat.champs?.urlServeurPrive}
        />
        <ChampTexte
          nom="urlTopServeurs"
          label="Top-Serveurs.net"
          defaultValue={reglages.urlTopServeurs}
          placeholder="https://top-serveurs.net/minecraft/ljkits/vote"
          erreurs={etat.champs?.urlTopServeurs}
        />
        <ChampTexte
          nom="urlServeursMinecraft"
          label="Serveurs-Minecraft.org"
          defaultValue={reglages.urlServeursMinecraft}
          placeholder="https://serveurs-minecraft.org/vote.php?id=xxxx"
          erreurs={etat.champs?.urlServeursMinecraft}
        />
      </section>

      <div className="flex items-center gap-3">
        <BoutonSoumettre>Enregistrer</BoutonSoumettre>
        <span className="text-[13px] text-gris">
          Les pages publiques sont régénérées immédiatement après l’enregistrement.
        </span>
      </div>
    </form>
  )
}
