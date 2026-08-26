import { ChampTexte } from '@/components/admin/Champs'

/**
 * Le bloc « vente », commun aux kits, aux grades et aux packs.
 *
 * Un seul champ depuis que la livraison est passée au plugin Tebex :
 * l'identifiant du package. C'est le plugin, installé sur le serveur
 * Minecraft, qui applique le contenu sur le compte du joueur — le site n'a
 * plus aucune commande console à stocker ni à jouer.
 */
export function ChampsVenteEtLivraison({
  tebexPackageId,
  erreurs,
}: {
  tebexPackageId?: number | null
  erreurs?: {
    tebexPackageId?: string[]
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

      <p className="rounded-controle border border-bord bg-nuit px-4 py-3 text-[13px] text-gris">
        La livraison en jeu est assurée par le{' '}
        <strong className="text-creme">plugin Tebex</strong> installé sur le serveur. Ce qui est
        réellement remis au joueur se configure sur le package, dans ton tableau de bord Tebex —
        pas ici.
      </p>
    </div>
  )
}
