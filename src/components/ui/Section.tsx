import { Enveloppe } from '@/components/ui/Enveloppe'
import { TeteSection } from '@/components/ui/TeteSection'

/**
 * Une section de page : rythme vertical, fond, et en-tête facultatif.
 *
 * Les maquettes alternent deux fonds — nuit (le fond de page) et charbon,
 * cerné de deux filets. C'est cette alternance qui découpe les longues pages
 * sans qu'on ait à poser de séparateur.
 *
 * `py-section` vaut clamp(56px, 7vw, 96px) : le rythme est piloté par un seul
 * token, pas par cinq valeurs recopiées.
 */
export function Section({
  /** `charbon` = fond contrasté cerné de filets. */
  fond = 'nuit',
  etiquette,
  titre,
  chapeau,
  centre,
  id,
  className = '',
  children,
}: {
  fond?: 'nuit' | 'charbon'
  etiquette?: React.ReactNode
  titre?: React.ReactNode
  chapeau?: React.ReactNode
  centre?: boolean
  id?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={`py-section ${fond === 'charbon' ? 'border-y border-bord bg-charbon' : ''} ${className}`}
    >
      <Enveloppe>
        {titre && (
          <TeteSection
            etiquette={etiquette}
            titre={titre}
            chapeau={chapeau}
            centre={centre}
            className="mb-[clamp(26px,3.5vw,42px)]"
          />
        )}
        {children}
      </Enveloppe>
    </section>
  )
}

/**
 * Le bloc d'appel qui ferme chaque page : halo orange remontant du bas, titre,
 * phrase, et l'action (copier l'IP, ou une paire de boutons).
 *
 * Le halo est en `::before` via l'utilitaire `halo-final` ; `halo-final`
 * remet ses enfants en `position:relative`, sinon le dégradé passerait
 * par-dessus le texte.
 */
export function BlocFinal({
  etiquette,
  titre,
  chapeau,
  className = '',
  children,
}: {
  etiquette?: React.ReactNode
  titre: React.ReactNode
  chapeau?: React.ReactNode
  className?: string
  children?: React.ReactNode
}) {
  return (
    <section className={`halo-final py-section text-center ${className}`}>
      <Enveloppe>
        {etiquette && (
          <p className="font-mono text-[11px] font-bold tracking-[.22em] text-soupe uppercase">
            {etiquette}
          </p>
        )}

        <h2 className="text-cta mt-3 font-titre">{titre}</h2>

        {chapeau && (
          <p className="mx-auto mt-4 max-w-[52ch] text-gris">{chapeau}</p>
        )}

        {children && <div className="mt-7">{children}</div>}
      </Enveloppe>
    </section>
  )
}
