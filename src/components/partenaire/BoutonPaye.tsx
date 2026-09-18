'use client'

import { useActionState, useEffect, useState } from 'react'

import { ETAT_VIDE } from '@/actions/etat'
import { confirmerPaiementPartenaire } from '@/actions/partenaire'
import { BoutonSoumettre } from '@/components/admin/BoutonSoumettre'
import { classesBouton } from '@/components/ui/Bouton'
import { t, type Locale } from '@/lib/i18n'
import { formaterMontant } from '@/lib/partenaire-commun'

/**
 * « J'AI ETE PAYE CETTE SEMAINE ».
 *
 * ── EN DEUX TEMPS, EXPRES ─────────────────────────────────────────────────
 * Le premier clic n'envoie rien : il ouvre une question qui rappelle le
 * montant et le nombre de joueurs. Confirmer un virement qu'on n'a pas recu
 * decale la borne pour de bon, et le partenaire perdrait le decompte de sa
 * semaine. Un `window.confirm()` aurait fait l'affaire techniquement, mais il
 * n'affiche ni le montant ni le detail, et il se clique en reflexe.
 *
 * ── LE FORMULAIRE NE POSTE QUE LE SLUG ────────────────────────────────────
 * Aucun montant, aucun nombre de joueurs : la Server Action recompte tout en
 * base. Rien a gagner a trafiquer ce formulaire.
 *
 * ── RIEN A CLIQUER QUAND IL N'Y A RIEN A ENCAISSER ────────────────────────
 * A zero joueur, on affiche la phrase et pas le bouton : un bouton qui ne
 * peut qu'echouer n'a pas sa place.
 */
export function BoutonPaye({
  slug,
  locale,
  joueurs,
  montantCentimes,
}: {
  slug: string
  locale: Locale
  joueurs: number
  montantCentimes: number
}) {
  const [etat, action] = useActionState(confirmerPaiementPartenaire, ETAT_VIDE)
  const [demande, setDemande] = useState(false)

  const montant = formaterMontant(montantCentimes, locale)

  // Une reponse arrive : on referme la question, quelle que soit l'issue.
  useEffect(() => {
    if (etat.succes || etat.erreur) setDemande(false)
  }, [etat])

  return (
    <div className="flex flex-col gap-3">
      {etat.succes && (
        <p
          role="status"
          className="rounded-controle border border-vert/40 bg-vert/10 px-3.5 py-2.5 text-[13.5px] text-vert"
        >
          {etat.succes}
        </p>
      )}
      {etat.erreur && (
        <p
          role="alert"
          className="rounded-controle border border-rouge/40 bg-rouge/10 px-3.5 py-2.5 text-[13.5px] text-rouge"
        >
          {etat.erreur}
        </p>
      )}

      {joueurs === 0 ? (
        <p className="text-[13.5px] leading-snug text-gris">{t(locale, 'part.paie-rien')}</p>
      ) : demande ? (
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="slug" value={slug} />

          <p className="text-[14px] leading-snug text-creme">
            {t(locale, 'part.paie-question').replace('{m}', montant).replace('{n}', String(joueurs))}
          </p>

          <div className="flex flex-wrap gap-2.5">
            <BoutonSoumettre enCours={t(locale, 'part.paie-en-cours')}>
              {t(locale, 'part.paie-confirmer').replace('{m}', montant)}
            </BoutonSoumettre>
            <button type="button" onClick={() => setDemande(false)} className={classesBouton({ variante: 'vide' })}>
              {t(locale, 'part.paie-annuler')}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <button type="button" onClick={() => setDemande(true)} className={classesBouton({ variante: 'or' })}>
            {t(locale, 'part.paie-bouton')}
          </button>
          <p className="mt-2.5 font-mono text-[11px] tracking-[.08em] text-gris/80 uppercase">
            {t(locale, 'part.paie-avertissement')}
          </p>
        </div>
      )}
    </div>
  )
}
