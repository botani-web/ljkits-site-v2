'use client'

import { useActionState, useState } from 'react'

import { ETAT_VIDE } from '@/actions/etat'
import { enregistrerPromo } from '@/actions/promo'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import { ChampCase, ChampSelection, ChampTexte, MessageErreurGlobale } from '@/components/admin/Champs'
import type { Promo } from '@/lib/promo'

/** « 2026-10-18T23:59 » dans l'heure locale du navigateur, pour un <input type="datetime-local">. */
function versChampLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const z = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`
}

export function FormulairePromo({ promo }: { promo: Promo }) {
  const [etat, envoyer] = useActionState(enregistrerPromo, ETAT_VIDE)
  const [fin, setFin] = useState(versChampLocal(promo.fin))
  // Converti ici, dans le fuseau de l'admin (Paris) : le serveur Vercel, lui, est en UTC.
  const finIso = fin ? new Date(fin).toISOString() : ''

  return (
    <form action={envoyer} className="flex flex-col gap-6">
      <MessageErreurGlobale message={etat.erreur} />
      {etat.succes && (
        <p role="status" className="rounded-controle border border-vert/40 bg-vert/10 px-4 py-3 text-sm text-vert">
          {etat.succes}
        </p>
      )}

      <section className="flex flex-col gap-4 rounded-carte border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base">La promo</h2>
        <ChampCase
          nom="promoActive"
          label="Promo active"
          aide="Décochée, plus rien n'apparaît sur le site (bulle, bandeau, prix barrés)."
          defaultChecked={promo.active}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampTexte
            nom="promoPourcentage"
            label="Réduction (%)"
            type="number"
            min={0}
            max={90}
            defaultValue={promo.pourcentage}
            erreurs={etat.champs?.promoPourcentage}
          />
          <ChampSelection
            nom="promoRayon"
            label="Sur quoi"
            defaultValue={promo.rayon}
            options={[
              { valeur: 'grades', label: 'Les grades (LJ+ / LJ++)' },
              { valeur: 'coins', label: 'Les coins' },
              { valeur: 'tout', label: 'Toute la boutique' },
            ]}
          />
        </div>
        <div>
          <label htmlFor="promoFin" className="mb-1.5 block text-sm font-semibold text-creme">
            Fin de la promo (heure de Paris)
          </label>
          <input
            id="promoFin"
            type="datetime-local"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
            className="w-full rounded-controle border border-bord bg-nuit px-3.5 py-2.5 text-[15px] text-creme focus:border-soupe focus:outline-none"
          />
          <input type="hidden" name="promoFinIso" value={finIso} />
          <p className="mt-1.5 text-[13px] text-gris">
            Passée cette date, la promo disparaît toute seule du site. Vide = jusqu'à ce que tu la décoches.
          </p>
          {etat.champs?.promoFin && <p className="mt-1 text-[13px] text-rouge">{etat.champs.promoFin[0]}</p>}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-carte border border-bord bg-charbon px-6 py-6">
        <h2 className="font-titre text-base">Ce qui s'affiche</h2>
        <ChampTexte
          nom="promoBulle"
          label="Bulle à côté de « Boutique » dans la barre"
          defaultValue={promo.bulle}
          placeholder="-20%"
          aide="Très court (12 caractères). Vide = pas de bulle."
          erreurs={etat.champs?.promoBulle}
        />
        <ChampTexte
          nom="promoTexte"
          label="Bandeau en haut de la boutique (français)"
          defaultValue={promo.texte}
          placeholder="-20 % sur les grades tout le week-end d'ouverture !"
          erreurs={etat.champs?.promoTexte}
        />
        <ChampTexte
          nom="promoTexteEn"
          label="Bandeau en haut de la boutique (anglais)"
          defaultValue={promo.texteEn}
          placeholder="20% off ranks all opening weekend!"
          erreurs={etat.champs?.promoTexteEn}
        />
      </section>

      <p className="rounded-carte border border-soupe/40 bg-soupe/10 px-4 py-3 text-[14px] text-creme">
        ⚠ Le site <strong>affiche</strong> la promo seulement : prix barrés, prix réduits, bulle et bandeau. Le prix
        réellement payé est celui de <strong>Tebex</strong> — crée la même réduction dans le panel Tebex (Sales), sur
        les mêmes produits et aux mêmes dates.
      </p>

      <div className="flex items-center gap-3">
        <BoutonSoumettre>Enregistrer</BoutonSoumettre>
        <span className="text-[13px] text-gris">Le site se met à jour immédiatement.</span>
      </div>
    </form>
  )
}
