import { NavS2 } from '@/components/s2/NavS2'

/**
 * L'ÉCRAN DE CHARGEMENT (refonte S2, 16/10/2026) : affiché le temps qu'une page
 * pas encore en cache se prépare (un profil visité pour la première fois…). La
 * barre reste en place et le squelette a la forme de la page qui arrive : le
 * clic répond tout de suite, le contenu se glisse dedans.
 */
export function Chargement({ forme }: { forme: 'profil' | 'liste' | 'match' }) {
  return (
    <>
      <NavS2 />
      <div className="mx-auto w-full max-w-[1200px] px-4 pt-8 sm:px-6" aria-busy="true">
        {forme === 'profil' && (
          <div className="grid gap-6 md:grid-cols-[230px_minmax(0,1fr)] md:items-end">
            <div className="squelette mx-auto h-[260px] w-[170px]" />
            <div>
              <div className="squelette h-4 w-28" />
              <div className="squelette mt-3 h-10 w-64" />
              <div className="squelette mt-3 h-4 w-80 max-w-full" />
              <div className="squelette mt-6 h-24 w-full" />
            </div>
          </div>
        )}
        {forme === 'match' && (
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-6">
            <div className="squelette mx-auto h-[200px] w-[110px]" />
            <div className="squelette h-10 w-14" />
            <div className="squelette mx-auto h-[200px] w-[110px]" />
          </div>
        )}
        {forme === 'liste' && (
          <>
            <div className="squelette h-10 w-56" />
            <div className="squelette mt-3 h-4 w-80 max-w-full" />
            <div className="squelette mt-6 h-11 w-full" />
          </>
        )}
        <div className="mt-8 grid gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="squelette h-12 w-full" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </div>
    </>
  )
}
