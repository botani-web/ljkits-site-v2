'use client'

import { useActionState } from 'react'

import { ETAT_VIDE } from '@/actions/etat'
import { entrerPartenaire } from '@/actions/partenaire'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import { t, type Locale } from '@/lib/i18n'

/**
 * La porte de l'espace partenaire.
 *
 * L'identifiant est PRE-REMPLI par le slug de l'URL mais reste modifiable :
 * un partenaire qui arrive par un lien approximatif doit pouvoir se corriger
 * sans deviner l'adresse exacte.
 *
 * Le message d'erreur est le meme pour un identifiant inconnu et un mot de
 * passe faux : la page ne doit rien apprendre a qui teste des noms.
 */
export function FormulaireAcces({ slug, locale }: { slug: string; locale: Locale }) {
  const [etat, action] = useActionState(entrerPartenaire, ETAT_VIDE)

  const classesChamp =
    'w-full rounded-controle border border-bord bg-nuit px-3.5 py-2.5 text-[15px] text-creme placeholder:text-gris/60 focus:border-soupe focus:outline-none'

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />

      {etat.erreur && (
        <p role="alert" className="rounded-controle border border-rouge/40 bg-rouge/10 px-3.5 py-2.5 text-[13.5px] text-rouge">
          {etat.erreur}
        </p>
      )}

      <div>
        <label htmlFor="slug" className="mb-1.5 block text-sm font-semibold text-creme">
          {t(locale, 'part.champ-identifiant')}
        </label>
        <input id="slug" name="slug" defaultValue={slug} autoComplete="username" required className={classesChamp} />
      </div>

      <div>
        <label htmlFor="motDePasse" className="mb-1.5 block text-sm font-semibold text-creme">
          {t(locale, 'part.champ-mot-de-passe')}
        </label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          autoComplete="current-password"
          required
          className={classesChamp}
        />
      </div>

      <div className="mt-2">
        <BoutonSoumettre enCours={t(locale, 'part.entrer-en-cours')}>{t(locale, 'part.entrer')}</BoutonSoumettre>
      </div>
    </form>
  )
}
