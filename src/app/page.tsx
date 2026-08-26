import { BoutonIpGeant } from '@/components/public/CopieIp'
import { IconeDiscord } from '@/components/public/IconeDiscord'
import { EncartOuverture, PhraseOuverture } from '@/components/public/Ouverture'
import { PagePublique } from '@/components/public/PagePublique'
import { LienFleche } from '@/components/ui/Badge'
import { classesBouton } from '@/components/ui/Bouton'
import { CadreTable, JaugeDeFond } from '@/components/ui/CadreTable'
import { CarteLien } from '@/components/ui/Carte'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { CaseCloisonnee, GrilleCloisonnee } from '@/components/ui/GrilleCloisonnee'
import { BlocFinal, Section } from '@/components/ui/Section'
import { Etiquette } from '@/components/ui/TeteSection'
import { lireClassements } from '@/lib/classement'
import { formaterOuverture, formaterOuvertureEnPhrase } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { lireReglages } from '@/lib/reglages'
import { SITE } from '@/lib/site'

// Page statique, régénérée au plus toutes les heures. Les Server Actions de
// l'admin appellent revalidatePath('/') dès qu'un kit change, pour que le
// nombre de kits affiché plus bas reste juste.
export const revalidate = 3600 // une heure

/** Combien de joueurs l'aperçu du classement montre. */
const TAILLE_APERCU = 5

export default async function Accueil() {
  const [nombreKits, classements, reglages] = await Promise.all([
    // Le nombre de kits est lu en base plutôt qu'écrit en dur : la maquette
    // annonçait « 29 kits » à un endroit et « 15 » à un autre.
    prisma.kit.count({ where: { visible: true } }),
    lireClassements(),
    lireReglages(),
  ])

  const { discord } = reglages

  /*
    L'aperçu reprend le classement HEBDOMADAIRE : c'est celui dont parle le
    texte à côté (« le tableau se vide chaque lundi »).

    `lireClassements()` écarte déjà les joueurs à zéro point. Avant l'ouverture,
    et après chaque remise à zéro du lundi, la liste est donc vide — et la
    section entière disparaît plutôt que d'afficher un cadre creux.

    Note : cet aperçu peut avoir jusqu'à une heure de retard sur /classement,
    qui revalide toutes les 60 secondes. C'est une vitrine, pas le tableau.
  */
  const apercuClassement = classements.semaine.slice(0, TAILLE_APERCU)
  const meilleurScore = apercuClassement[0]?.valeur ?? 0

  const ouverture = new Date(SITE.ouverture)
  /*
    L'état au moment de la génération de la page. Il sert de valeur initiale
    aux deux composants d'ouverture, qui le corrigent dès le montage côté
    client : au pire, un visiteur voit l'ancien état pendant une fraction de
    seconde.
  */
  const ouvertAuRendu = Date.now() >= ouverture.getTime()

  return (
    <PagePublique>
      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <header id="haut" className="halo-hero pt-[clamp(56px,8vw,104px)] pb-[clamp(48px,6vw,76px)] text-center">
        <Enveloppe>
          <div className="mx-auto max-w-[900px]">
            <h1 className="text-h1 font-titre text-balance">
              Serveur Minecraft
              <br />
              <span className="text-oni">PvP Soup</span> en <span className="text-or">1.8</span>
            </h1>

            <p className="mx-auto mt-5.5 max-w-[56ch] text-[clamp(16.5px,2vw,20px)] text-balance text-gris">
              Aucun cooldown d’attaque, aucune armure, et un bol de soupe pour se soigner.{' '}
              <b className="font-semibold text-creme">{nombreKits} kits</b> à débloquer en
              jouant, un{' '}
              <b className="font-semibold text-creme">classement remis à zéro chaque lundi</b>,
              et zéro pay to win.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2.75">
              <a
                href={discord}
                target="_blank"
                rel="noopener noreferrer"
                className={classesBouton({
                  variante: 'plein',
                  taille: 'grande',
                  className: 'max-[560px]:w-full',
                })}
              >
                <IconeDiscord className="size-4 shrink-0 fill-current" />
                Rejoindre le Discord
              </a>

              <BoutonIpGeant className="max-[560px]:w-full max-[560px]:justify-center" />
            </div>

            <EncartOuverture
              ouvertAuRendu={ouvertAuRendu}
              dateOuverture={formaterOuverture(ouverture)}
            />
          </div>
        </Enveloppe>
      </header>

      {/* ══════════════════════════ LES RÈGLES ══════════════════════════ */}
      <GrilleCloisonnee
        pleineLargeur
        colonnes="grid-cols-1 min-[560px]:grid-cols-2 lg:grid-cols-4"
      >
        {REGLES.map((regle) => (
          <CaseCloisonnee key={regle.titre} className="px-gouttiere py-6.5">
            {/*
              Un <p> et non un <h2> : « 0 cooldown » n'introduit pas une
              section, c'est une constante affichée. Quatre h2 de plus ici
              feraient quatre entrées parasites dans le plan du document,
              entre le h1 du hero et le premier vrai titre de section.
            */}
            <p className="font-titre text-[clamp(18px,2.4vw,25px)] leading-tight">
              {regle.zero && <span className="text-oni">0</span>}
              {regle.zero ? ` ${regle.titre}` : regle.titre}
            </p>
            <p className="mt-2.25 font-mono text-[11px] leading-relaxed text-gris">
              {regle.texte}
            </p>
          </CaseCloisonnee>
        ))}
      </GrilleCloisonnee>

      {/* ═════════════════════════ TROIS PILIERS ═════════════════════════ */}
      <Section
        etiquette="Ce qui t’attend"
        titre={
          <>
            Trois raisons de <span className="text-or">rester</span>
          </>
        }
      >
        <div className="grid gap-3.5 lg:grid-cols-3">
          <Pilier
            href="/kits"
            chiffre={String(nombreKits)}
            titre="Kits"
            lien="Voir les kits"
          >
            Du Kangaroo au Kitsune. Tous débloquables en jouant, aucun réservé à la boutique.
          </Pilier>

          <Pilier
            href="/classement"
            chiffre="+10"
            titre="Points par KOTH"
            lien="Voir le classement"
          >
            Chaque kill compte. Le tableau se vide le lundi et les dix premiers repartent
            avec des coins.
          </Pilier>

          <Pilier href="/boutique" chiffre="0" titre="Pay to win" lien="Voir la boutique">
            Rien de ce qui se vend ne se gagne à ta place. Ni dégâts, ni stuff, ni coins.
          </Pilier>
        </div>
      </Section>

      {/* ══════════════════════════ CLASSEMENT ══════════════════════════ */}
      {apercuClassement.length > 0 && (
        <Section fond="charbon">
          <div className="grid items-center gap-[clamp(28px,4vw,56px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
            <div>
              <Etiquette>Compétition</Etiquette>
              <h2 className="text-h2 mt-3 font-titre">
                Le tableau se vide
                <br />
                chaque <span className="text-or">lundi</span>
              </h2>
              <p className="mt-3.5 max-w-[46ch] text-gris">
                Un kill vaut un point, une série stoppée en vaut trois, un KOTH remporté dix.
                Les dix premiers de la semaine repartent avec des coins, et le premier garde
                le titre de Champion sept jours.
              </p>
              <LienFleche href="/classement" className="mt-4">
                Classement complet
              </LienFleche>
            </div>

            <CadreTable fond="braise">
              <ol>
                {apercuClassement.map((ligne) => (
                  <li
                    key={ligne.pseudo}
                    className="relative grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-bord px-4.5 py-3.25 last:border-b-0"
                  >
                    {/*
                      La jauge dit la valeur relative au meilleur score.
                      `meilleurScore` ne peut pas être nul ici : la liste est
                      non vide et lireClassements() écarte les zéros.
                    */}
                    <JaugeDeFond pourcentage={(ligne.valeur / meilleurScore) * 100} />

                    <span
                      className={`relative font-mono text-[12.5px] ${
                        ligne.rang === 1 ? 'font-bold text-or' : 'text-gris'
                      }`}
                    >
                      {String(ligne.rang).padStart(2, '0')}
                    </span>

                    <span className="relative truncate text-[15px] font-semibold">
                      {ligne.pseudo}
                    </span>

                    <span className="relative font-mono text-sm font-bold text-soupe">
                      {ligne.valeur}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="border-t border-bord bg-nuit p-2.75 text-center font-mono text-[10.5px] text-gris">
                Cherche ton pseudo sur la page classement
              </p>
            </CadreTable>
          </div>
        </Section>
      )}

      {/* ═════════════════════════════ APPEL ═════════════════════════════ */}
      <BlocFinal
        titre={
          <>
            Le bol est <span className="text-or">plein</span>.
          </>
        }
        chapeau={
          <PhraseOuverture
            ouvertAuRendu={ouvertAuRendu}
            dateEnPhrase={formaterOuvertureEnPhrase(ouverture)}
          />
        }
      >
        <BoutonIpGeant />
        <p className="mt-4 font-mono text-[11.5px] text-gris">
          Clique pour copier · Minecraft Java 1.8 → 1.21+
        </p>
      </BlocFinal>
    </PagePublique>
  )
}

/* -------------------------------------------------------------------------- */
/* Contenu et composants locaux : ils ne servent qu'à cette page.              */
/* -------------------------------------------------------------------------- */

/**
 * Les quatre constantes du soup, telles qu'annoncées en page d'accueil.
 *
 * Ce ne sont pas des réglages mais des règles du jeu : elles ne changeraient
 * que si l'équilibrage du serveur changeait. `zero` isole le « 0 » initial
 * pour le colorer en oni sans découper la chaîne à l'affichage.
 */
const REGLES = [
  {
    zero: true,
    titre: 'cooldown',
    texte: 'Tu cliques, ça touche. Le combat 1.8 intégral.',
  },
  {
    zero: true,
    titre: 'armure',
    texte: 'Cinq cœurs, pour tout le monde, sans exception.',
  },
  {
    zero: false,
    titre: 'Clic droit',
    texte: 'La soupe soigne. Gérer son stock fait partie du duel.',
  },
  {
    zero: false,
    titre: 'Knockback 1.8',
    texte: 'Le recul d’époque, réglé à la main. Le combo repart.',
  },
]

function Pilier({
  href,
  chiffre,
  titre,
  lien,
  children,
}: {
  href: string
  chiffre: string
  titre: string
  lien: string
  children: React.ReactNode
}) {
  return (
    <CarteLien href={href} className="p-6.5">
      <span className="font-titre text-[clamp(28px,3.6vw,38px)] leading-none text-or">
        {chiffre}
      </span>
      <h3 className="mt-3.5 font-titre text-[17px] tracking-[-.01em]">{titre}</h3>
      <p className="mt-2.75 flex-1 text-[14.5px] text-gris">{children}</p>
      <span className="mt-4.5 font-mono text-[11px] font-bold tracking-[.12em] text-soupe uppercase">
        {lien} <span aria-hidden="true">→</span>
      </span>
    </CarteLien>
  )
}
