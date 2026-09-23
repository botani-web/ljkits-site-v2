import { basculerTraite, supprimerAvis } from '@/actions/avis'
import { BoutonCopier } from '@/components/admin/BoutonCopier'
import { classesBouton } from '@/components/ui/Bouton'
import { lireAvis, statistiques, type LigneAvis } from '@/lib/avis'
import { formaterDateHeure } from '@/lib/format'
import { SITE } from '@/lib/site'

export const metadata = { title: 'Avis des joueurs' }

/**
 * LE SUIVI DES AVIS.
 *
 * Trois choses à voir d'un coup d'œil, dans cet ordre : combien de retours
 * sont arrivés, ce qu'ils demandent en priorité, et ce qu'ils disent en
 * toutes lettres. Le reste est du détail.
 *
 * LE POURCENTAGE DU CASHPRIZE EST LA MESURE À SURVEILLER. Il ne dit rien des
 * joueurs, il dit si notre communication passe : s'il stagne bas, ce n'est
 * pas le montant qu'il faut changer.
 *
 * « Même source » compte les avis partageant la même empreinte d'adresse.
 * Trois avis d'affilée depuis la même source, ce n'est pas une tendance :
 * c'est une personne. Aucune adresse n'est lisible ici, ni ailleurs.
 */

/* -------------------------------------------------------------------------- */
/* Les libellés — côté admin, tout est en français                            */
/* -------------------------------------------------------------------------- */

const PRIORITE: Record<string, string> = {
  combat: 'Combat (KB, hits, soupe)',
  triche: 'Triche / anticheat',
  modes: 'Modes de jeu',
  cartes: 'Cartes et arènes',
  joueurs: 'Nombre de joueurs',
  boutique: 'Boutique, grades, kits',
  autre: 'Autre',
}

const FREIN: Record<string, string> = {
  'peu-de-joueurs': 'Pas assez de monde',
  attente: 'Files trop longues',
  gameplay: 'Gameplay',
  tricheurs: 'Tricheurs',
  horaires: 'Horaires',
  aucun: 'Aucun frein',
}

const CASHPRIZE: Record<string, string> = {
  oui: 'Le savait',
  vaguement: 'En avait entendu parler',
  non: 'Ne savait pas',
}

const COULEUR_NOTE = (note: number) =>
  note <= 2 ? 'border-rouge/50 bg-rouge/10 text-rouge'
  : note === 3 ? 'border-or/50 bg-or/10 text-or'
  : 'border-vert/50 bg-vert/10 text-vert'

function Chiffre({ valeur, legende, ton = '' }: { valeur: string; legende: string; ton?: string }) {
  return (
    <div className="rounded-carte border border-bord bg-charbon px-4 py-3.5">
      <p className={`font-titre text-[26px] leading-none ${ton || 'text-creme'}`}>{valeur}</p>
      <p className="mt-1.5 font-mono text-[10.5px] tracking-[.1em] text-gris uppercase">{legende}</p>
    </div>
  )
}

/** Un classement en barres : la valeur la plus haute donne l'échelle. */
function Barres({ titre, lignes, libelles }: { titre: string; lignes: { cle: string; n: number }[]; libelles: Record<string, string> }) {
  const max = Math.max(1, ...lignes.map((l) => l.n))
  return (
    <div className="rounded-carte border border-bord bg-charbon px-4 py-3.5">
      <p className="font-mono text-[10.5px] tracking-[.1em] text-gris uppercase">{titre}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {lignes.length === 0 && <li className="text-[13.5px] text-gris">Rien pour l’instant.</li>}
        {lignes.map((l) => (
          <li key={l.cle} className="flex items-center gap-3">
            <span className="w-[190px] shrink-0 truncate text-[13.5px] text-creme">
              {libelles[l.cle] ?? l.cle}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-nuit">
              <span className="block h-full bg-soupe" style={{ width: `${(l.n * 100) / max}%` }} />
            </span>
            <span className="w-8 shrink-0 text-right font-mono text-[12px] text-gris">{l.n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Carte({ avis }: { avis: LigneAvis }) {
  return (
    <li className={`rounded-carte border bg-charbon px-4 py-4 ${avis.traiteAt ? 'border-bord opacity-60' : 'border-bord'}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className={`inline-flex items-center rounded-controle border px-2 py-0.5 font-mono text-[11px] ${COULEUR_NOTE(avis.note)}`}>
          {avis.note}/5
        </span>
        <span className="text-[15px] text-creme">
          {avis.pseudo ?? <span className="text-gris italic">anonyme</span>}
        </span>
        <span className="font-mono text-[11px] tracking-[.08em] text-gris uppercase">
          #{avis.numero} · {formaterDateHeure(avis.createdAt, 'fr')} · {avis.langue.toUpperCase()}
        </span>
        {avis.memeSource > 1 && (
          <span className="rounded-controle border border-or/40 bg-or/10 px-2 py-0.5 font-mono text-[10.5px] text-or">
            {avis.memeSource} avis de la même source
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <form action={basculerTraite.bind(null, avis.id)}>
            <button type="submit" className={classesBouton({ variante: 'vide', className: 'px-3 text-[11px]' })}>
              {avis.traiteAt ? 'À relire' : 'Traité'}
            </button>
          </form>
          <form action={supprimerAvis.bind(null, avis.id)}>
            <button
              type="submit"
              className="min-h-11 px-2 font-mono text-[11px] tracking-[.08em] text-gris uppercase transition-colors hover:text-rouge"
            >
              Supprimer
            </button>
          </form>
        </span>
      </div>

      {avis.message && (
        <p className="mt-3 border-l-2 border-soupe/40 pl-3 text-[15px] leading-relaxed whitespace-pre-line text-creme">
          {avis.message}
        </p>
      )}

      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-gris">
        <span>Priorité : <span className="text-creme">{PRIORITE[avis.priorite] ?? avis.priorite}</span></span>
        <span>Cashprize : <span className="text-creme">{CASHPRIZE[avis.cashprize] ?? avis.cashprize}</span></span>
        {avis.freins.length > 0 && (
          <span>
            Freins : <span className="text-creme">{avis.freins.map((f) => FREIN[f] ?? f).join(', ')}</span>
          </span>
        )}
      </p>
    </li>
  )
}

export default async function PageAvisAdmin({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>
}) {
  const { filtre } = await searchParams
  const tous = await lireAvis()
  const stats = statistiques(tous)

  const lignes =
    filtre === 'a-traiter' ? tous.filter((a) => !a.traiteAt)
    : filtre === 'avec-message' ? tous.filter((a) => a.message)
    : tous

  const maxJour = Math.max(1, ...stats.parJour.map((j) => j.n))

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titre text-2xl">Avis des joueurs</h1>
          <p className="mt-1 text-sm text-gris">
            Cinq questions posées sur <span className="text-creme">/avis</span>, pseudo facultatif.
            Les avis les plus récents d’abord.
          </p>
        </div>
        <BoutonCopier texte={`${SITE.url}/fr/avis`} libelle="Copier le lien du questionnaire" />
      </div>

      {/* ---------- les chiffres ---------- */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Chiffre valeur={String(stats.total)} legende="avis reçus" />
        <Chiffre
          valeur={String(stats.aTraiter)}
          legende="à relire"
          ton={stats.aTraiter > 0 ? 'text-or' : 'text-creme'}
        />
        <Chiffre valeur={stats.noteMoyenne === null ? '—' : `${stats.noteMoyenne}/5`} legende="note moyenne" />
        <Chiffre
          valeur={stats.cashprizeConnu === null ? '—' : `${stats.cashprizeConnu} %`}
          legende="connaissaient le cashprize"
          ton={
            stats.cashprizeConnu !== null && stats.cashprizeConnu < 50 ? 'text-rouge' : 'text-vert'
          }
        />
      </div>

      {/* ---------- ce qu'ils demandent ---------- */}
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Barres titre="Priorités" lignes={stats.priorites} libelles={PRIORITE} />
        <Barres titre="Ce qui les freine" lignes={stats.freins} libelles={FREIN} />
      </div>

      {/* ---------- le rythme des envois ---------- */}
      {stats.total > 0 && (
        <div className="mt-3 rounded-carte border border-bord bg-charbon px-4 py-3.5">
          <p className="font-mono text-[10.5px] tracking-[.1em] text-gris uppercase">
            Sept derniers jours
          </p>
          <ol className="mt-3 flex h-16 items-end gap-2">
            {stats.parJour.map((j) => (
              <li key={j.jour} className="flex flex-1 flex-col items-center gap-1" title={`${j.jour} : ${j.n}`}>
                <span
                  className="w-full rounded-[2px] bg-soupe/70"
                  style={{ height: `${Math.max(2, (j.n * 100) / maxJour)}%` }}
                />
                <span className="font-mono text-[9.5px] text-gris">{j.jour.slice(8)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ---------- la liste ---------- */}
      <nav className="mt-8 mb-3 flex flex-wrap gap-1">
        {[
          { cle: '', label: `Tous (${tous.length})` },
          { cle: 'a-traiter', label: `À relire (${stats.aTraiter})` },
          { cle: 'avec-message', label: `Avec message (${tous.filter((a) => a.message).length})` },
        ].map((f) => {
          const actif = (filtre ?? '') === f.cle
          return (
            <a
              key={f.cle || 'tous'}
              href={f.cle ? `/admin/avis?filtre=${f.cle}` : '/admin/avis'}
              aria-current={actif ? 'page' : undefined}
              className={`flex min-h-11 items-center rounded-controle border px-3.5 font-mono text-[11.5px] tracking-[.1em] uppercase transition-colors ${
                actif ? 'border-soupe bg-soupe/10 text-soupe' : 'border-bord text-gris hover:text-creme'
              }`}
            >
              {f.label}
            </a>
          )
        })}
      </nav>

      {lignes.length === 0 ? (
        <p className="rounded-carte border border-bord bg-charbon px-4 py-8 text-center text-[15px] text-gris">
          Aucun avis pour ce filtre. Le questionnaire vit à /avis — le lien se partage en jeu et sur
          Discord.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lignes.map((avis) => (
            <Carte key={avis.id} avis={avis} />
          ))}
        </ul>
      )}
    </>
  )
}
