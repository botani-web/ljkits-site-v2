import { PagePublique } from '@/components/public/PagePublique'
import { LienBouton } from '@/components/ui/Bouton'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { Etiquette } from '@/components/ui/TeteSection'

/** Page 404 : kit inexistant, kit masqué, adresse mal tapée. */
export default function PageIntrouvable() {
  return (
    <PagePublique>
      <main className="halo-hero py-[clamp(72px,10vw,140px)] text-center">
        <Enveloppe>
          <div className="mx-auto max-w-lecture">
            <Etiquette className="text-oni">Erreur 404</Etiquette>

            <h1 className="text-h1 mt-4 font-titre">
              Page <span className="text-or">introuvable</span>
            </h1>

            <p className="mx-auto mt-4.5 max-w-[48ch] text-gris">
              Cette page n’existe pas, ou plus. Le kit que tu cherchais a peut-être été
              retiré.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2.75">
              <LienBouton href="/" variante="plein">
                Retour à l’accueil
              </LienBouton>
              <LienBouton href="/kits" variante="vide">
                Voir les kits
              </LienBouton>
            </div>
          </div>
        </Enveloppe>
      </main>
    </PagePublique>
  )
}
