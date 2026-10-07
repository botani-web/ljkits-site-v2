import {
  basculerSuggestionTraitee,
  enregistrerNoteSuggestion,
  supprimerSuggestion,
} from '@/actions/suggestions'
import { BoutonCopier } from '@/components/admin/BoutonCopier'
import { classesBouton } from '@/components/ui/Bouton'
import { formaterDateHeure } from '@/lib/format'
import { SITE } from '@/lib/site'
import { compter, lireSuggestions, type LigneSuggestion } from '@/lib/suggestions'

export const metadata = { title: 'Suggestions saison 2' }

/**
 * LE SUIVI DES SUGGESTIONS POUR LA SAISON 2.
 *
 * En haut, ce que les joueurs demandent (question 1) et ce qui les fait
 * partir (question 3) ; en dessous, les suggestions en toutes lettres, avec
 * un filtre par catégorie. Une note interne par suggestion pour garder trace
 * de ce qu'on en fait.
 */

const CATEGORIE: Record<string, string> = {
  modes: 'Nouveaux modes',
  combat: 'Combat (KB, hits, fluidité)',
  anticheat: 'Anticheat / tricheurs',
  recompenses: 'Récompenses (cashprize, cosmétiques, grades)',
  events: 'Events et tournois',
  joueurs: 'Plus de monde en ligne',
  autre: 'Autre',
}

const RAISON: Record<string, string> = {
  'peu-de-joueurs': 'Pas assez de monde',
  attente: 'Files trop longues',
  tricheurs: 'Tricheurs',
  gameplay: 'Gameplay',
  lassitude: 'Lassitude, rien de nouveau',
  horaires: 'Horaires',
  aucune: 'Joue autant qu’il veut',
}

function Chiffre({ valeur, legende, ton = '' }: { valeur: string; legende: string; ton?: string }) {
  return (
    <div className="rounded-carte border border-bord bg-charbon px-4 py-3.5">
      <p className={`font-titre text-[26px] leading-none ${ton || 'text-creme'}`}>{valeur}</p>
      <p className="mt-1.5 font-mono text-[10.5px] tracking-[.1em] text-gris uppercase">{legende}</p>
    </div>
  )
}

function Barres({ titre, lignes, libelles }: { titre: string; lignes: { cle: string; n: number }[]; libelles: Record<string, string> }) {
  const max = Math.max(1, ...lignes.map((l) => l.n))
  return (
    <div className="rounded-carte border border-bord bg-charbon px-4 py-3.5">
      <p className="font-mono text-[10.5px] tracking-[.1em] text-gris uppercase">{titre}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {lignes.length === 0 && <li className="text-[13.5px] text-gris">Rien pour l’instant.</li>}
        {lignes.map((l) => (
          <li key={l.cle} className="flex items-center gap-3">
            <span className="w-[190px] shrink-0 truncate text-[13.5px] text-creme">{libelles[l.cle] ?? l.cle}</span>
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

function Carte({ s }: { s: LigneSuggestion }) {
  return (
    <li className={`rounded-carte border border-bord bg-charbon px-4 py-4 ${s.traiteAt ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center rounded-controle border border-soupe/50 bg-soupe/10 px-2 py-0.5 font-mono text-[11px] text-soupe">
          {CATEGORIE[s.categorie] ?? s.categorie}
        </span>
        <span className="text-[15px] text-creme">
          {s.pseudo ?? <span className="text-gris italic">anonyme</span>}
          {s.discord && <span className="text-gris"> · Discord : {s.discord}</span>}
        </span>
        <span className="font-mono text-[11px] tracking-[.08em] text-gris uppercase">
          #{s.numero} · {formaterDateHeure(s.createdAt, 'fr')} · {s.langue.toUpperCase()}
        </span>
        {s.memeSource > 1 && (
          <span className="rounded-controle border border-or/40 bg-or/10 px-2 py-0.5 font-mono text-[10.5px] text-or">
            {s.memeSource} de la même source
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <form action={basculerSuggestionTraitee.bind(null, s.id)}>
            <button type="submit" className={classesBouton({ variante: 'vide', className: 'px-3 text-[11px]' })}>
              {s.traiteAt ? 'À relire' : 'Traitée'}
            </button>
          </form>
          <form action={supprimerSuggestion.bind(null, s.id)}>
            <button
              type="submit"
              className="min-h-11 px-2 font-mono text-[11px] tracking-[.08em] text-gris uppercase transition-colors hover:text-rouge"
            >
              Supprimer
            </button>
          </form>
        </span>
      </div>

      <p className="mt-3 border-l-2 border-soupe/40 pl-3 text-[15px] leading-relaxed whitespace-pre-line text-creme">
        {s.message}
      </p>

      {s.raisons.length > 0 && (
        <p className="mt-3 font-mono text-[11px] text-gris">
          Joue peu parce que : <span className="text-creme">{s.raisons.map((r) => RAISON[r] ?? r).join(', ')}</span>
        </p>
      )}

      <form action={enregistrerNoteSuggestion.bind(null, s.id)} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          name="note"
          defaultValue={s.noteAdmin ?? ''}
          maxLength={2000}
          placeholder="Note interne (ex. : prévu pour la saison 2, déjà fait, refusé…)"
          className="min-h-11 flex-1 rounded-controle border border-bord bg-nuit px-3 text-[13.5px] text-creme placeholder:text-gris/50 focus:border-soupe focus:outline-none"
        />
        <button type="submit" className={classesBouton({ variante: 'vide', className: 'px-3 text-[11px]' })}>
          Enregistrer
        </button>
      </form>
    </li>
  )
}

export default async function PageSuggestionsAdmin({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string; categorie?: string }>
}) {
  const { filtre, categorie } = await searchParams
  const toutes = await lireSuggestions()
  const aTraiter = toutes.filter((s) => !s.traiteAt).length
  const signees = toutes.filter((s) => s.pseudo || s.discord).length

  const lignes = toutes
    .filter((s) => (filtre === 'a-traiter' ? !s.traiteAt : true))
    .filter((s) => (categorie ? s.categorie === categorie : true))

  const lienFiltre = (f: { filtre?: string; categorie?: string }) => {
    const p = new URLSearchParams()
    if (f.filtre) p.set('filtre', f.filtre)
    if (f.categorie) p.set('categorie', f.categorie)
    const q = p.toString()
    return q ? `/admin/suggestions?${q}` : '/admin/suggestions'
  }

  const classesPastille = (actif: boolean) =>
    `flex min-h-11 items-center rounded-controle border px-3.5 font-mono text-[11.5px] tracking-[.1em] uppercase transition-colors ${
      actif ? 'border-soupe bg-soupe/10 text-soupe' : 'border-bord text-gris hover:text-creme'
    }`

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titre text-2xl">Suggestions saison 2</h1>
          <p className="mt-1 text-sm text-gris">
            Envoyées depuis <span className="text-creme">/suggestions</span>, pseudo facultatif. Les plus récentes d’abord.
          </p>
        </div>
        <BoutonCopier texte={`${SITE.url}/suggestions`} libelle="Copier le lien de la page" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Chiffre valeur={String(toutes.length)} legende="suggestions reçues" />
        <Chiffre valeur={String(aTraiter)} legende="à relire" ton={aTraiter > 0 ? 'text-or' : 'text-creme'} />
        <Chiffre valeur={String(signees)} legende="signées (pseudo ou Discord)" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Barres titre="Ce qui les ferait rester" lignes={compter(toutes.map((s) => s.categorie))} libelles={CATEGORIE} />
        <Barres titre="Pourquoi ils jouent peu" lignes={compter(toutes.flatMap((s) => s.raisons))} libelles={RAISON} />
      </div>

      <nav className="mt-8 mb-2 flex flex-wrap gap-1">
        <a href={lienFiltre({ categorie })} aria-current={!filtre ? 'page' : undefined} className={classesPastille(!filtre)}>
          Toutes ({toutes.length})
        </a>
        <a
          href={lienFiltre({ filtre: 'a-traiter', categorie })}
          aria-current={filtre === 'a-traiter' ? 'page' : undefined}
          className={classesPastille(filtre === 'a-traiter')}
        >
          À relire ({aTraiter})
        </a>
      </nav>
      <nav className="mb-3 flex flex-wrap gap-1">
        <a href={lienFiltre({ filtre })} className={classesPastille(!categorie)}>
          Toutes catégories
        </a>
        {Object.entries(CATEGORIE).map(([cle, libelle]) => (
          <a key={cle} href={lienFiltre({ filtre, categorie: cle })} className={classesPastille(categorie === cle)}>
            {libelle.split(' (')[0]}
          </a>
        ))}
      </nav>

      {lignes.length === 0 ? (
        <p className="rounded-carte border border-bord bg-charbon px-4 py-8 text-center text-[15px] text-gris">
          Aucune suggestion pour ce filtre.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lignes.map((s) => (
            <Carte key={s.id} s={s} />
          ))}
        </ul>
      )}
    </>
  )
}
