'use client'

import { useEffect, useState } from 'react'

import { Enveloppe } from '@/components/ui/Enveloppe'
import { t, type Locale } from '@/lib/i18n'
import {
  CATEGORIES_REGLEMENT,
  CATEGORIE_DEFAUT,
  categorieValide,
  type CategorieReglement,
} from '@/lib/reglement'

/**
 * Une section, déjà rendue en HTML côté serveur.
 *
 * Le Markdown est converti sur le serveur et non ici : le contenu du
 * règlement doit se trouver dans le HTML de la page, sans JavaScript, pour
 * les moteurs de recherche — et pour le joueur dont le navigateur n'a pas
 * exécuté le script.
 */
export type SectionRendue = {
  id: string
  titre: string
  html: string
  categorie: string
}

/**
 * LE RÈGLEMENT, EN ONGLETS.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  TOUT EST DANS LA PAGE, ON NE FAIT QUE MASQUER
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Les cinq onglets sont rendus d'un coup et masqués avec `hidden`. Aucun
 * aller-retour serveur au changement d'onglet, et surtout : le règlement
 * entier reste dans le HTML. Un joueur qui fait Ctrl+F trouve la règle même
 * si elle est dans un autre onglet — ce qui n'aurait pas été le cas avec un
 * chargement à la demande.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  L'ONGLET EST DANS L'ADRESSE
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Le hash (#sanctions) suit l'onglet ouvert, et une adresse qui en porte un
 * s'ouvre dessus. C'est ce qui permet au staff de coller UN lien qui tombe
 * sur la bonne règle : « voici la règle que tu as enfreinte », pas « va lire
 * le règlement ». La différence compte le jour d'une contestation.
 *
 * On utilise `replaceState` et non `pushState` : cliquer cinq onglets ne doit
 * pas obliger à cinq retours arrière pour quitter la page.
 */
export function ReglementOnglets({
  locale,
  sections,
}: {
  locale: Locale
  sections: SectionRendue[]
}) {
  const [active, setActive] = useState<CategorieReglement>(CATEGORIE_DEFAUT)

  // Le hash n'est lisible qu'une fois dans le navigateur : le rendu serveur
  // ouvre donc toujours le premier onglet, et celui-ci se corrige au montage.
  // Sans cette précaution, le HTML du serveur et celui du client
  // divergeraient, ce que React signale comme une erreur d'hydratation.
  useEffect(() => {
    const dansLAdresse = window.location.hash.replace('#', '')
    if (CATEGORIES_REGLEMENT.some((c) => c.slug === dansLAdresse)) {
      setActive(dansLAdresse as CategorieReglement)
    }
  }, [])

  function ouvrir(slug: CategorieReglement) {
    setActive(slug)
    try {
      window.history.replaceState(null, '', `#${slug}`)
    } catch {
      // Navigateur qui refuse l'écriture de l'historique : l'onglet change
      // quand même, seule l'adresse ne suit pas.
    }
  }

  // Les onglets vides ne s'affichent pas : une catégorie sans section
  // publiée n'a rien à dire, et un onglet qui s'ouvre sur du vide donne
  // l'impression d'un site cassé.
  const onglets = CATEGORIES_REGLEMENT.filter((c) =>
    sections.some((s) => categorieValide(s.categorie) === c.slug),
  )

  return (
    <Enveloppe>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        {/* ═══════════════ LA COLONNE DE GAUCHE ═══════════════ */}
        <nav
          aria-label={t(locale, 'reglement.titre')}
          className="lg:sticky lg:top-24 lg:w-[248px] lg:shrink-0"
        >
          {/*
            En ligne et défilable sur mobile, en colonne à partir de lg :
            une colonne de gauche sur un écran de téléphone mangerait la
            moitié de la largeur de lecture.
          */}
          <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
            {onglets.map((onglet, index) => {
              const choisi = onglet.slug === active
              const combien = sections.filter(
                (s) => categorieValide(s.categorie) === onglet.slug,
              ).length

              return (
                <li key={onglet.slug} className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    onClick={() => ouvrir(onglet.slug)}
                    aria-current={choisi ? 'true' : undefined}
                    className={[
                      'flex w-full items-center gap-2.5 rounded-carte border px-3.5 py-2.5 text-left',
                      'font-mono text-[11px] tracking-[.14em] uppercase',
                      'transition-colors duration-[.18s]',
                      choisi
                        ? 'border-soupe bg-soupe/10 text-creme'
                        : 'border-bord bg-charbon text-gris hover:border-soupe/50 hover:text-creme',
                    ].join(' ')}
                  >
                    <span
                      aria-hidden="true"
                      className={choisi ? 'font-bold text-soupe' : 'font-bold text-bord'}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1">{t(locale, onglet.cleTexte)}</span>
                    <span aria-hidden="true" className="text-[10px] text-gris">
                      {combien}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ═══════════════ LES SECTIONS ═══════════════ */}
        <div className="min-w-0 flex-1">
          {onglets.map((onglet) => {
            const dedans = sections.filter(
              (s) => categorieValide(s.categorie) === onglet.slug,
            )
            return (
              <section
                key={onglet.slug}
                id={onglet.slug}
                hidden={onglet.slug !== active}
                aria-label={t(locale, onglet.cleTexte)}
              >
                <div className="flex flex-col gap-3.5">
                  {dedans.map((section, index) => (
                    <article
                      key={section.id}
                      className="overflow-hidden rounded-carte border border-bord bg-charbon transition-colors duration-[.18s] hover:border-soupe"
                    >
                      <div className="flex items-center gap-3.5 border-b border-bord bg-braise px-5.5 py-4">
                        <span
                          aria-hidden="true"
                          className="shrink-0 font-mono text-[11px] font-bold tracking-[.18em] text-soupe"
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h2 className="font-titre text-[clamp(17px,2.2vw,21px)] leading-tight tracking-[-.01em]">
                          {section.titre}
                        </h2>
                      </div>

                      {/*
                        Le HTML vient du Markdown converti côté serveur, à
                        partir d'un contenu que seul l'admin peut écrire.
                      */}
                      <div
                        className="markdown px-5.5 py-5"
                        dangerouslySetInnerHTML={{ __html: section.html }}
                      />
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </Enveloppe>
  )
}
