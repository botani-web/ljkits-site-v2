import { ChampZoneTexte } from '@/components/admin/Champs'

/**
 * Le champ « commande de livraison », commun aux kits, aux grades et aux packs.
 *
 * Une commande par ligne, `{pseudo}` remplacé par le pseudo de l'acheteur au
 * moment de la livraison (cf. src/lib/livraison.ts).
 */
export function ChampCommandeLivraison({
  valeurInitiale,
  exemple,
  erreurs,
}: {
  valeurInitiale?: string
  exemple: string
  erreurs?: string[]
}) {
  return (
    <div>
      <ChampZoneTexte
        nom="commandeLivraison"
        label="Commande(s) de livraison"
        defaultValue={valeurInitiale ?? ''}
        rows={3}
        placeholder={exemple}
        className="w-full resize-y rounded-lg border border-bord bg-nuit px-3.5 py-2.5 font-mono text-sm text-creme placeholder:text-gris/60 focus:border-soupe focus:outline-none"
        erreurs={erreurs}
      />
      <p className="mt-1.5 text-[13px] text-gris">
        Une commande par ligne. <code className="font-mono text-or">{'{pseudo}'}</code> est
        remplacé par le pseudo de l’acheteur. Laisse vide si l’article n’est pas encore
        livrable — les commandes s’affichent dans le détail d’une commande, à copier dans la
        console du serveur.
      </p>
    </div>
  )
}
