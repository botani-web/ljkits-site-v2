import type { Metadata } from 'next'

import { FormulaireCandidature } from '@/components/public/FormulaireCandidature'
import { PagePublique } from '@/components/public/PagePublique'
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
      <header className="halo-hero relative border-b border-bord">
        <div className="mx-auto max-w-lecture px-6 py-14 text-center sm:py-20">
          <p className="font-mono text-[11px] tracking-[2px] text-soupe uppercase">
            LJKITS — équipe de modération
          </p>
          <h1 className="mt-3 font-titre text-3xl uppercase sm:text-4xl">
            Rejoindre le <span className="texte-accent">staff</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-gris">
            Modérer un serveur soup, ce n’est pas distribuer des sanctions : c’est
            arbitrer vite, souvent sans preuve parfaite, et rester droit quand
            c’est un ami en face.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lecture px-6 py-12 sm:py-16">
        {!recrutementOuvert ? (
          /* Un message, jamais un 404 : le lien vient d'être partagé à la main,
             une page introuvable donnerait l'impression d'un site cassé. */
          <div className="rounded-2xl border border-bord bg-charbon px-6 py-14 text-center">
            <p className="font-titre text-xl text-creme uppercase">
              Recrutement fermé
            </p>
            <p className="mx-auto mt-4 max-w-lg text-[15px] text-gris">
              {recrutementMessageFerme}
            </p>
            {discord && discord !== '#' && (
              <a
                href={discord}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-discord px-5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Rejoindre le Discord ↗
              </a>
            )}
          </div>
        ) : questions.length === 0 ? (
          /* Cas de bord : recrutement ouvert mais questionnaire vide. Mieux
             vaut le dire que d'afficher un formulaire à trois champs. */
          <div className="rounded-2xl border border-bord bg-charbon px-6 py-14 text-center">
            <p className="font-titre text-xl text-creme uppercase">
              Formulaire indisponible
            </p>
            <p className="mx-auto mt-4 max-w-lg text-[15px] text-gris">
              Le questionnaire est en cours de préparation. Reviens d’ici peu.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-10 rounded-xl border border-bord bg-charbon p-5">
              <h2 className="font-mono text-[11px] tracking-[1.6px] text-soupe uppercase">
                Avant de commencer
              </h2>
              <ul className="mt-3 flex flex-col gap-2 text-[14px] text-gris">
                <li>
                  <span className="text-creme">{AGE_MINIMUM} ans minimum.</span> C’est
                  une équipe, pas un grade cosmétique.
                </li>
                <li>
                  <span className="text-creme">Compte une bonne demi-heure.</span> Les
                  mises en situation demandent des réponses développées — c’est
                  précisément ce qu’on lit.
                </li>
                <li>
                  <span className="text-creme">Sois honnête.</span> Une réponse
                  franche ne disqualifie pas. Un mensonge découvert, oui.
                </li>
                <li>
                  Tes réponses sont conservées {CONSERVATION_MOIS} mois, puis
                  supprimées.
                </li>
              </ul>
            </div>

            <FormulaireCandidature questions={questions} />
          </>
        )}
      </main>
    </PagePublique>
  )
}
