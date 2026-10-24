import Link from 'next/link'

import { FormulaireEvenement } from '@/components/admin/FormulaireEvenement'
import { lireTousEvenements, statutDe } from '@/lib/evenements'

export const metadata = { title: 'Événements' }
export const dynamic = 'force-dynamic'

const STATUTS = { 'a-venir': 'À venir', 'en-direct': 'En direct', termine: 'Terminé' } as const

function date(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

/** Les événements (24/10/2026) : la liste, et le formulaire pour en créer un. */
export default async function PageAdminEvenements() {
  const evenements = await lireTousEvenements()
  return (
    <>
      <div className="mb-6">
        <h1 className="font-titre text-2xl">Événements</h1>
        <p className="mt-1 text-sm text-gris">
          Un événement = un créneau et un barème. Ses manches sont les parties du HG Run finies dans le créneau ; pendant le
          tournoi, le Run est en mode compétition (<code>/compet on &lt;nom&gt;</code> en jeu) et c&apos;est toi qui lances chaque manche.
        </p>
      </div>

      {evenements.length > 0 && (
        <section className="mb-8 overflow-hidden rounded-carte border border-bord bg-charbon">
          {evenements.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-bord px-5 py-3.5 last:border-0">
              <div className="min-w-0">
                <Link href={`/admin/evenements/${e.id}`} className="font-semibold text-creme hover:text-soupe">
                  {e.nom}
                </Link>
                <div className="text-[13px] text-gris">
                  {date(e.debut)} → {date(e.fin)} · {STATUTS[statutDe(e)]} {e.publie ? '' : '· masqué'}
                </div>
              </div>
              <div className="flex items-center gap-4 text-[13px]">
                <a href={`/fr/evenements/${e.slug}`} target="_blank" rel="noreferrer" className="text-gris hover:text-creme">
                  Page publique ↗
                </a>
                <Link href={`/admin/evenements/${e.id}`} className="font-semibold text-soupe hover:text-or">
                  Gérer
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}

      <h2 className="mb-3 font-titre text-lg">Nouvel événement</h2>
      <FormulaireEvenement />
    </>
  )
}
