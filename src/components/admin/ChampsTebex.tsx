import { ChampTexte, ChampZoneTexte } from '@/components/admin/Champs'

const CLASSES_MONO =
  'w-full resize-y rounded-lg border border-bord bg-nuit px-3.5 py-2.5 font-mono text-sm text-creme placeholder:text-gris/60 focus:border-soupe focus:outline-none'

/**
 * Le bloc « vente et livraison », commun aux kits, aux grades et aux packs.
 *
 * Trois champs qui vont ensemble : l'identifiant du package chez Tebex, la
 * commande console jouée à la livraison, et celle jouée au retrait après un
 * remboursement ou un litige perdu.
 */
export function ChampsVenteEtLivraison({
  tebexPackageId,
  commandeLivraison,
  commandeRetrait,
  exempleLivraison,
  exempleRetrait,
  erreurs,
}: {
  tebexPackageId?: number | null
  commandeLivraison?: string
  commandeRetrait?: string
  exempleLivraison: string
  exempleRetrait: string
  erreurs?: {
    tebexPackageId?: string[]
    commandeLivraison?: string[]
    commandeRetrait?: string[]
  }
}) {
  return (
    <div className="flex flex-col gap-5">
      <ChampTexte
        nom="tebexPackageId"
        label="Identifiant du package Tebex"
        type="number"
        min={1}
        step={1}
        defaultValue={tebexPackageId ?? ''}
        placeholder="123456"
        aide="Le nombre affiché sur le package dans ton tableau de bord Tebex. Sans lui, l’article ne peut pas entrer dans un panier de paiement."
        erreurs={erreurs?.tebexPackageId}
      />

      <div>
        <ChampZoneTexte
          nom="commandeLivraison"
          label="Commande(s) de livraison"
          defaultValue={commandeLivraison ?? ''}
          rows={3}
          placeholder={exempleLivraison}
          className={CLASSES_MONO}
          erreurs={erreurs?.commandeLivraison}
        />
        <p className="mt-1.5 text-[13px] text-gris">
          Une commande par ligne, jouée quand le paiement est confirmé.{' '}
          <code className="font-mono text-or">{'{pseudo}'}</code> est remplacé par le pseudo de
          l’acheteur.
        </p>
      </div>

      <div>
        <ChampZoneTexte
          nom="commandeRetrait"
          label="Commande(s) de retrait"
          defaultValue={commandeRetrait ?? ''}
          rows={3}
          placeholder={exempleRetrait}
          className={CLASSES_MONO}
          erreurs={erreurs?.commandeRetrait}
        />
        <p className="mt-1.5 text-[13px] text-gris">
          Jouées en cas de remboursement ou de litige perdu. Laisse vide s’il n’y a rien à
          retirer — le remboursement passera quand même, simplement sans rien exécuter.
        </p>
      </div>

      <p className="rounded-lg border border-bord bg-nuit px-4 py-3 text-[13px] text-gris">
        Ces commandes peuvent être <strong className="text-creme">rejouées</strong> : si le bot
        de livraison meurt entre l’exécution et la confirmation, la ligne repartira dans la
        file. Écris-les de sorte qu’une seconde exécution soit sans effet.
      </p>
    </div>
  )
}
