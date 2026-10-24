import Link from 'next/link'
import { notFound } from 'next/navigation'

import { basculerManche, supprimerEvenement } from '@/actions/evenements'
import { FormulaireEvenement } from '@/components/admin/FormulaireEvenement'
import { classementDe, lireEvenementParId, lireManches, statutDe } from '@/lib/evenements'

export const metadata = { title: 'Événement' }
export const dynamic = 'force-dynamic'

function heure(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(iso))
}

function mmss(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Un événement (24/10/2026) : réglages, manches du créneau (à exclure ou non), classement, suppression. */
export default async function PageAdminEvenement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const e = await lireEvenementParId(Number(id))
  if (!e) notFound()
  const manches = await lireManches(e)
  const classement = classementDe(manches)

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/evenements" className="text-[13px] text-gris hover:text-creme">
            ← Tous les événements
          </Link>
          <h1 className="mt-1 font-titre text-2xl">{e.nom}</h1>
          <p className="mt-1 text-sm text-gris">
            {statutDe(e) === 'en-direct' ? 'En direct' : statutDe(e) === 'a-venir' ? 'À venir' : 'Terminé'} · {manches.filter((m) => !m.exclue).length} manche(s) qui
            comptent · {classement.length} joueur(s)
          </p>
        </div>
        <a href={`/fr/evenements/${e.slug}`} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-soupe hover:text-or">
          Voir la page publique ↗
        </a>
      </div>

      <section className="mb-8 rounded-carte border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base">Les parties du créneau</h2>
        <p className="mt-1 text-[13px] text-gris">
          Toutes les parties du HG Run finies entre le début et la fin. Exclus une partie de test ou une manche boguée : elle
          disparaît du classement et les numéros se recalent. (En jeu, <code>/compet annuler &lt;n&gt;</code> fait pareil pour le classement du chat.)
        </p>
        {manches.length === 0 ? (
          <p className="mt-4 text-sm text-gris">Aucune partie dans le créneau pour l&apos;instant.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-[.08em] text-gris">
                <tr>
                  <th className="py-2 pr-3 font-medium">Manche</th>
                  <th className="py-2 pr-3 font-medium">Fin</th>
                  <th className="py-2 pr-3 font-medium">Carte</th>
                  <th className="py-2 pr-3 font-medium">Durée</th>
                  <th className="py-2 pr-3 font-medium">Joueurs</th>
                  <th className="py-2 pr-3 font-medium">Gagnant</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {manches.map((m) => (
                  <tr key={m.id} className={`border-t border-bord ${m.exclue ? 'opacity-50' : ''}`}>
                    <td className="py-2 pr-3 font-mono">{m.exclue ? 'exclue' : m.numero}</td>
                    <td className="py-2 pr-3 text-gris">{heure(m.instant)}</td>
                    <td className="py-2 pr-3 text-gris">{m.carte}</td>
                    <td className="py-2 pr-3 font-mono">{mmss(m.duree)}</td>
                    <td className="py-2 pr-3 font-mono">{m.lignes.length}</td>
                    <td className="py-2 pr-3">{m.lignes.find((l) => l.place === 1)?.pseudo ?? '—'}</td>
                    <td className="py-2 text-right">
                      <form action={basculerManche}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="partie" value={m.id} />
                        <button type="submit" className={`text-[13px] font-semibold ${m.exclue ? 'text-vert hover:text-creme' : 'text-rouge hover:text-creme'}`}>
                          {m.exclue ? 'Faire compter' : 'Exclure'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {classement.length > 0 && (
          <p className="mt-4 text-[13px] text-gris">
            En tête : {classement.slice(0, 3).map((x) => `${x.rang}. ${x.pseudo} (${x.points} pts)`).join(' · ')}
          </p>
        )}
      </section>

      <FormulaireEvenement evenement={e} />

      <section className="mt-10 rounded-carte border border-rouge/30 bg-charbon px-6 py-5">
        <h2 className="font-titre text-base text-rouge">Supprimer l&apos;événement</h2>
        <p className="mt-1 text-[13px] text-gris">Les parties restent en base (stats du HG Run) ; seule la page de l&apos;événement disparaît.</p>
        <form action={supprimerEvenement} className="mt-3 flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={e.id} />
          <input
            name="confirmer"
            placeholder="Écris SUPPRIMER"
            className="rounded-controle border border-bord bg-nuit px-3 py-2 text-sm text-creme placeholder:text-gris/60"
          />
          <button type="submit" className="rounded-controle border border-rouge/50 px-3 py-2 text-sm font-semibold text-rouge hover:bg-rouge/10">
            Supprimer
          </button>
        </form>
      </section>
    </>
  )
}
