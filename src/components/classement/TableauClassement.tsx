'use client'

import Image from 'next/image'
import { useState } from 'react'

import { CompteARebours } from '@/components/classement/CompteARebours'
import { Podium } from '@/components/classement/Podium'
import { urlAvatar } from '@/lib/avatar'
import type { LigneClassement, Periode } from '@/lib/classement'
import { formaterCoins, formaterRatio } from '@/lib/format'

/**
 * Les trois classements et leurs onglets.
 *
 * Les trois listes sont envoyées ensemble par le serveur : changer d'onglet
 * n'entraîne aucun aller-retour. C'est un choix assumé — une vingtaine de
 * kilo-octets contre un affichage instantané.
 */
type Onglet = {
  cle: Periode
  label: string
  /** Unité affichée sous les valeurs. */
  unite: string
  /** Titre de la colonne de droite dans la liste. */
  colonne: string
  /** Timestamp de la prochaine remise à zéro, ou null pour « à vie ». */
  finUnix: number | null
  libelleReset: string
}

export function TableauClassement({
  classements,
  finSemaine,
  finMois,
}: {
  classements: Record<Periode, LigneClassement[]>
  finSemaine: number
  finMois: number
}) {
  const [actif, setActif] = useState<Periode>('semaine')

  const onglets: Onglet[] = [
    {
      cle: 'semaine',
      label: 'Semaine',
      unite: 'points',
      colonne: 'Points',
      finUnix: finSemaine,
      libelleReset: 'Remise à zéro dans',
    },
    {
      cle: 'mois',
      label: 'Mois',
      unite: 'points',
      colonne: 'Points',
      finUnix: finMois,
      libelleReset: 'Remise à zéro dans',
    },
    {
      cle: 'vie',
      label: 'À vie',
      unite: 'kills',
      colonne: 'Kills',
      finUnix: null,
      libelleReset: '',
    },
  ]

  const onglet = onglets.find((o) => o.cle === actif)!
  const lignes = classements[actif]
  const avecDetails = actif === 'vie'
  const reste = lignes.filter((ligne) => ligne.rang > 3)

  return (
    <>
      {/* ------------------------------ ONGLETS ----------------------------- */}
      <div
        role="tablist"
        aria-label="Période du classement"
        className="mb-6 flex flex-wrap items-center gap-2 border-b border-bord"
      >
        {onglets.map((option) => {
          const estActif = option.cle === actif
          return (
            <button
              key={option.cle}
              type="button"
              role="tab"
              aria-selected={estActif}
              onClick={() => setActif(option.cle)}
              className={`-mb-px border-b-2 px-4.5 py-2.5 font-mono text-[13px] font-bold tracking-wide uppercase transition-colors ${
                estActif ? 'border-soupe text-or' : 'border-transparent text-gris hover:text-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}

        <span className="ml-auto pb-2.5 font-mono text-[12.5px] text-gris">
          {lignes.length} {lignes.length > 1 ? 'joueurs' : 'joueur'}
        </span>
      </div>

      {/* -------------------------- COMPTE À REBOURS ------------------------ */}
      {onglet.finUnix !== null && (
        <div className="mb-6 flex justify-center">
          <CompteARebours finUnix={onglet.finUnix} libelle={onglet.libelleReset} />
        </div>
      )}

      {lignes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-bord px-6 py-14 text-center text-gris">
          Aucun joueur classé pour le moment.
          {actif !== 'vie' && (
            <>
              <br />
              <span className="text-[14px]">
                Les compteurs viennent d’être remis à zéro — connecte-toi pour ouvrir le bal.
              </span>
            </>
          )}
        </p>
      ) : (
        <>
          <Podium lignes={lignes} unite={onglet.unite} avecDetails={avecDetails} />

          {reste.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-bord bg-charbon">
              {/* En-tête de colonnes, masqué sur mobile faute de place. */}
              <div
                className={`hidden items-center gap-4 border-b border-bord px-5 py-2.5 font-mono text-[10.5px] tracking-[1.2px] text-gris uppercase sm:grid ${
                  avecDetails
                    ? 'grid-cols-[52px_38px_1fr_72px_64px_88px]'
                    : 'grid-cols-[52px_38px_1fr_88px]'
                }`}
              >
                <span>Rang</span>
                <span />
                <span>Joueur</span>
                {avecDetails && <span className="text-right">K/D</span>}
                {avecDetails && <span className="text-right">Série</span>}
                <span className="text-right">{onglet.colonne}</span>
              </div>

              {reste.map((ligne) => (
                <div
                  key={`${actif}-${ligne.pseudo}`}
                  className={`grid items-center gap-4 border-b border-bord px-5 py-3 transition-colors last:border-b-0 hover:bg-braise ${
                    avecDetails
                      ? 'grid-cols-[38px_38px_1fr_auto] sm:grid-cols-[52px_38px_1fr_72px_64px_88px]'
                      : 'grid-cols-[38px_38px_1fr_auto] sm:grid-cols-[52px_38px_1fr_88px]'
                  }`}
                >
                  <span className="font-mono text-[13px] font-bold text-gris">#{ligne.rang}</span>

                  <Image
                    src={urlAvatar(ligne.pseudo, 64)}
                    alt=""
                    width={34}
                    height={34}
                    unoptimized
                    loading="lazy"
                    className="size-8.5 rounded-lg [image-rendering:pixelated]"
                  />

                  <span className="min-w-0 truncate text-[15.5px] font-semibold">
                    {ligne.pseudo}
                  </span>

                  {avecDetails && ligne.morts !== null && (
                    <span className="hidden text-right font-mono text-[13px] text-gris sm:block">
                      {formaterRatio(ligne.valeur, ligne.morts)}
                    </span>
                  )}
                  {avecDetails && (
                    <span className="hidden text-right font-mono text-[13px] text-gris sm:block">
                      {ligne.recordSerie ?? 0}
                    </span>
                  )}

                  <span className="text-right font-mono text-[14px] font-bold text-or">
                    {formaterCoins(ligne.valeur)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {lignes.length >= 50 && (
            <p className="mt-4 text-center text-[13px] text-gris">
              Seuls les 50 premiers sont affichés.
            </p>
          )}
        </>
      )}
    </>
  )
}
