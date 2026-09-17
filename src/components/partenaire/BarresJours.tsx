import { t, type Locale } from '@/lib/i18n'
import { libelleJour } from '@/lib/partenaire-commun'
import type { JourPartenaire } from '@/lib/partenaire'

/**
 * Les connexions jour par jour, en barres.
 *
 * Deux informations dans une seule barre plutot que deux graphiques : la
 * hauteur totale donne les connexions du jour, la part dorée du bas donne les
 * NOUVEAUX joueurs. C'est exactement la lecture qu'un partenaire cherche —
 * « ce soir-la j'ai fait venir du monde, et des nouveaux » — et elle tient
 * sur un ecran de telephone.
 *
 * Aucune interactivite : composant serveur, rien n'est envoye au navigateur.
 * Le detail d'un jour passe par l'attribut `title` de la colonne.
 */
export function BarresJours({ jours, locale }: { jours: JourPartenaire[]; locale: Locale }) {
  const pic = Math.max(1, ...jours.map((j) => j.sessions))
  const vide = jours.every((j) => j.sessions === 0 && j.nouveaux === 0)

  if (vide) {
    return (
      <p className="rounded-carte border border-dashed border-bord px-6 py-12 text-center font-mono text-[13px] text-gris">
        {t(locale, 'part.graphe-vide')}
      </p>
    )
  }

  const HAUTEUR = 120

  return (
    <div className="rounded-carte border border-bord bg-charbon p-5">
      <div className="mb-4 flex flex-wrap gap-4 font-mono text-[10.5px] tracking-[.12em] text-gris uppercase">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-micro bg-soupe/45" />
          {t(locale, 'part.graphe-sessions')}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-micro bg-or" />
          {t(locale, 'part.graphe-nouveaux')}
        </span>
      </div>

      <div className="flex items-end gap-[3px]" style={{ height: `${HAUTEUR}px` }}>
        {jours.map((jour) => {
          // Un nouveau joueur ouvre forcement une session : sa part ne peut pas
          // depasser la barre, mais on borne quand meme — une session perdue
          // par un crash du serveur ferait sinon deborder la colonne.
          const nouveaux = Math.min(jour.nouveaux, jour.sessions)
          const hauteur = jour.sessions === 0 ? 3 : Math.max(4, (jour.sessions / pic) * HAUTEUR)
          const partNouveaux = jour.sessions === 0 ? 0 : (nouveaux / jour.sessions) * hauteur

          return (
            <div
              key={jour.jour}
              className="flex-1"
              title={t(locale, 'part.graphe-jour')
                .replace('{d}', libelleJour(jour.jour, locale))
                .replace('{s}', String(jour.sessions))
                .replace('{n}', String(jour.nouveaux))}
            >
              <div
                className="flex w-full flex-col justify-end overflow-hidden rounded-t-micro"
                style={{ height: `${hauteur}px`, background: jour.sessions === 0 ? 'var(--color-bord)' : 'var(--color-soupe)', opacity: jour.sessions === 0 ? 1 : 0.45 }}
              >
                {partNouveaux > 0 && (
                  <span aria-hidden className="block w-full" style={{ height: `${partNouveaux}px`, background: 'var(--color-or)' }} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] text-gris">
        <span>{libelleJour(jours[0].jour, locale)}</span>
        <span>{libelleJour(jours[jours.length - 1].jour, locale)}</span>
      </div>
    </div>
  )
}
