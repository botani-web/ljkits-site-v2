import type { Metadata } from 'next'

import { FormulaireCandidature } from '@/components/public/FormulaireCandidature'
import { PagePublique } from '@/components/public/PagePublique'
import { classesBouton } from '@/components/ui/Bouton'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { EtatVide } from '@/components/ui/EtatVide'
import { Etiquette } from '@/components/ui/TeteSection'
import { lireReglages } from '@/lib/reglages'
import { AGE_MINIMUM, CONSERVATION_MOIS, lireQuestionsActives } from '@/lib/recrutement'

/**
 * Le formulaire de recrutement staff.
 *
 * PAGE NON RÉFÉRENCÉE, ACCESSIBLE PAR LIEN DIRECT UNIQUEMENT.
 *
 * Elle n'apparaît nulle part : ni dans la barre de navigation, ni dans le pied
 * de page, ni dans un plan de site. Le lien se copie depuis /admin/recrutement
 * et se partage à la main quand le recrutement ouvre.
 *
 * `robots: noindex` demande aux moteurs de ne pas l'indexer. Volontairement
 * PAS de `Disallow: /recrutement` dans un robots.txt : ce fichier est public,
 * et une ligne Disallow ANNONCERAIT l'adresse au monde entier — exactement le
 * contraire du but recherché.
 */
export const metadata: Metadata = {
  title: 'Recrutement staff',
  robots: { index: false, follow: false },
}

/**
 * Rendu à chaque requête.
 *
 * Sans ça, Next.js rendrait la page au build : les questions modifiées depuis
 * l'admin et l'ouverture du recrutement ne seraient visibles qu'au prochain
 * déploiement.
 */
export const dynamic = 'force-dynamic'

export default async function PageRecrutement() {
  const { recrutementOuvert, recrutementMessageFerme, discord } = await lireReglages()

  // Les questions ne sont même pas lues si c'est fermé.
  const questions = recrutementOuvert ? await lireQuestionsActives() : []

  return (
    <PagePublique>
      <header className="halo-hero border-b border-bord py-[clamp(48px,6vw,80px)] text-center">
        <Enveloppe>
          <div className="mx-auto max-w-lecture">
            <Etiquette>LJKITS — équipe de modération</Etiquette>

            <h1 className="text-h1 mt-4 font-titre">
              Rejoindre le <span className="text-or">staff</span>
            </h1>

            <p className="mx-auto mt-4.5 max-w-[52ch] text-gris">
              Modérer un serveur soup, ce n’est pas distribuer des sanctions : c’est arbitrer
              vite, souvent sans preuve parfaite, et rester droit quand c’est un ami en face.
            </p>
          </div>
        </Enveloppe>
      </header>

      <main className="py-section">
        <Enveloppe>
          <div className="mx-auto max-w-lecture">
            {!recrutementOuvert ? (
              /* Un message, jamais un 404 : le lien vient d'être partagé à la
                 main, une page introuvable donnerait l'impression d'un site
                 cassé. */
              <div className="rounded-carte border border-bord bg-charbon px-6 py-12 text-center">
                <p className="font-titre text-xl">Recrutement fermé</p>
                <p className="mx-auto mt-3.5 max-w-lg text-[15px] text-gris">
                  {recrutementMessageFerme}
                </p>

                {discord && discord !== '#' && (
                  <a
                    href={discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classesBouton({ variante: 'plein', className: 'mt-6' })}
                  >
                    Rejoindre le Discord
                  </a>
                )}
              </div>
            ) : questions.length === 0 ? (
              /* Cas de bord : recrutement ouvert mais questionnaire vide. Mieux
                 vaut le dire que d'afficher un formulaire à trois champs. */
              <EtatVide message="Le questionnaire est en cours de préparation. Reviens d’ici peu." />
            ) : (
              <>
                <div className="mb-9 rounded-carte border border-bord bg-charbon p-5.5">
                  <h2 className="font-mono text-[10.5px] font-bold tracking-[.18em] text-soupe uppercase">
                    Avant de commencer
                  </h2>

                  <ul className="mt-3.5">
                    <li className="flex gap-3 border-t border-bord py-2.5 text-sm text-gris first:border-t-0 first:pt-0">
                      <span aria-hidden="true" className="shrink-0 font-mono text-soupe">
                        ›
                      </span>
                      <span>
                        <b className="font-semibold text-creme">{AGE_MINIMUM} ans minimum.</b>{' '}
                        C’est une équipe, pas un grade cosmétique.
                      </span>
                    </li>
                    <li className="flex gap-3 border-t border-bord py-2.5 text-sm text-gris">
                      <span aria-hidden="true" className="shrink-0 font-mono text-soupe">
                        ›
                      </span>
                      <span>
                        <b className="font-semibold text-creme">
                          Compte une bonne demi-heure.
                        </b>{' '}
                        Les mises en situation demandent des réponses développées — c’est
                        précisément ce qu’on lit.
                      </span>
                    </li>
                    <li className="flex gap-3 border-t border-bord py-2.5 text-sm text-gris">
                      <span aria-hidden="true" className="shrink-0 font-mono text-soupe">
                        ›
                      </span>
                      <span>
                        <b className="font-semibold text-creme">Sois honnête.</b> Une réponse
                        franche ne disqualifie pas. Un mensonge découvert, oui.
                      </span>
                    </li>
                    <li className="flex gap-3 border-t border-bord py-2.5 text-sm text-gris">
                      <span aria-hidden="true" className="shrink-0 font-mono text-soupe">
                        ›
                      </span>
                      <span>
                        Tes réponses sont conservées {CONSERVATION_MOIS} mois, puis
                        supprimées.
                      </span>
                    </li>
                  </ul>
                </div>

                {/*
                  Le formulaire n'est pas touché : validation zod, honeypot,
                  limitation de débit et gel de l'historique des candidatures
                  restent exactement ce qu'ils étaient.
                */}
                <FormulaireCandidature questions={questions} />
              </>
            )}
          </div>
        </Enveloppe>
      </main>
    </PagePublique>
  )
}
