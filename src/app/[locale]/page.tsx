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
import { lireClassementElo, lireSaisonCourante, nomPalier, palierDe } from '@/lib/elo'
import { formaterOuverture, formaterOuvertureEnPhrase } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import { lireReglages } from '@/lib/reglages'
import { SITE } from '@/lib/site'
import { estLocale, LANGUE_DEFAUT, lien, t, champ, champOptionnel, type Locale } from '@/lib/i18n'

// Page statique, régénérée au plus toutes les heures. Les Server Actions de
// l'admin appellent revalidatePath('/') dès qu'un kit change, pour que le
// nombre de kits affiché plus bas reste juste.
export const revalidate = 3600 // une heure

/** Combien de joueurs l'aperçu du classement montre. */
const TAILLE_APERCU = 5

export default async function Accueil({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT

  const [nombreKits, saison, reglages] = await Promise.all([
    // Le nombre de kits est lu en base plutôt qu'écrit en dur : la maquette
    // annonçait « 29 kits » à un endroit et « 15 » à un autre.
    prisma.kit.count({ where: { visible: true } }),
    lireSaisonCourante(),
    lireReglages(),
  ])

  // Hors saison ouverte, l'aperçu disparaît au lieu d'afficher un cadre vide.
  const classementElo = saison ? await lireClassementElo(saison.id) : []

  const { discord } = reglages

  /*
    L'aperçu reprend le TOP ELO de la saison en cours.

    Tant que personne n'est classé — avant l'ouverture, ou juste après une
    remise à zéro mensuelle — la liste est vide et la section entière
    disparaît, plutôt que d'afficher un cadre creux.

    La jauge se mesure sur l'écart au plancher (800) et non sur l'Elo brut :
    sinon la barre du cinquième serait déjà presque pleine et ne dirait plus
    rien de l'écart réel.

    Note : cet aperçu peut avoir jusqu'à une heure de retard sur /classement,
    qui revalide toutes les 60 secondes. C'est une vitrine, pas le tableau.
  */
  const apercuClassement = classementElo.slice(0, TAILLE_APERCU)
  const PLANCHER_ELO = 800
  const meilleurScore = Math.max(1, (apercuClassement[0]?.elo ?? PLANCHER_ELO) - PLANCHER_ELO)

  const ouverture = new Date(SITE.ouverture)
  /*
    L'état au moment de la génération de la page. Il sert de valeur initiale
    aux deux composants d'ouverture, qui le corrigent dès le montage côté
    client : au pire, un visiteur voit l'ancien état pendant une fraction de
    seconde.
  */
  const ouvertAuRendu = Date.now() >= ouverture.getTime()

  return (
    <PagePublique locale={locale}>
      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <header id="haut" className="halo-hero pt-[clamp(56px,8vw,104px)] pb-[clamp(48px,6vw,76px)] text-center">
        <Enveloppe>
          <div className="mx-auto max-w-[900px]">
            <h1 className="text-h1 font-titre text-balance">
              {t(locale, 'accueil.h1-1')}
              <br />
              <span className="text-oni">{t(locale, 'accueil.h1-2')}</span>{' '}
              {t(locale, 'accueil.h1-3')} <span className="text-or">1.8</span>
            </h1>

            <p className="mx-auto mt-5.5 max-w-[56ch] text-[clamp(16.5px,2vw,20px)] text-balance text-gris">
              {t(locale, 'accueil.chapo-1')}{' '}
              <b className="font-semibold text-creme">
                {nombreKits} {t(locale, 'accueil.chapo-kits')}
              </b>{' '}
              {t(locale, 'accueil.chapo-2')}{' '}
              <b className="font-semibold text-creme">{t(locale, 'accueil.chapo-classement')}</b>
              {t(locale, 'accueil.chapo-3')}
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
                {t(locale, 'commande.rejoindre-discord')}
              </a>

              <BoutonIpGeant className="max-[560px]:w-full max-[560px]:justify-center" />
            </div>

            <EncartOuverture
              ouvertAuRendu={ouvertAuRendu}
              dateOuverture={formaterOuverture(ouverture, locale)}
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
          <CaseCloisonnee key={regle.cleTitre} className="px-gouttiere py-6.5">
            {/*
              Un <p> et non un <h2> : « 0 cooldown » n'introduit pas une
              section, c'est une constante affichée. Quatre h2 de plus ici
              feraient quatre entrées parasites dans le plan du document,
              entre le h1 du hero et le premier vrai titre de section.
            */}
            <p className="font-titre text-[clamp(18px,2.4vw,25px)] leading-tight">
              {regle.zero && <span className="text-oni">0</span>}
              {regle.zero ? ` ${t(locale, regle.cleTitre)}` : t(locale, regle.cleTitre)}
            </p>
            <p className="mt-2.25 font-mono text-[11px] leading-relaxed text-gris">
              {t(locale, regle.cleTexte)}
            </p>
          </CaseCloisonnee>
        ))}
      </GrilleCloisonnee>

      {/* ═════════════════════════ TROIS PILIERS ═════════════════════════ */}
      <Section
        etiquette={t(locale, 'accueil.piliers-etiquette')}
        titre={
          <>
            {t(locale, 'accueil.piliers-titre-1')}{' '}
            <span className="text-or">{t(locale, 'accueil.piliers-titre-2')}</span>
          </>
        }
      >
        <div className="grid gap-3.5 lg:grid-cols-3">
          <Pilier
            href={lien(locale, '/kits')}
            chiffre={String(nombreKits)}
            titre={t(locale, 'nav.kits')}
            lien={t(locale, 'accueil.pilier-kits-lien')}
          >
            {t(locale, 'accueil.pilier-kits-texte')}
          </Pilier>

          <Pilier
            href={lien(locale, '/classement')}
            chiffre="1000"
            titre={t(locale, 'accueil.pilier-elo-titre')}
            lien={t(locale, 'accueil.pilier-elo-lien')}
          >
            {t(locale, 'accueil.pilier-elo-texte')}
          </Pilier>

          <Pilier
            href={lien(locale, '/boutique')}
            chiffre="0"
            titre={t(locale, 'accueil.pay-to-win')}
            lien={t(locale, 'accueil.pilier-p2w-lien')}
          >
            {t(locale, 'accueil.pilier-p2w-texte')}
          </Pilier>
        </div>
      </Section>

      {/* ══════════════════════════ CLASSEMENT ══════════════════════════ */}
      {apercuClassement.length > 0 && (
        <Section fond="charbon">
          <div className="grid items-center gap-[clamp(28px,4vw,56px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
            <div>
              <Etiquette>{t(locale, 'accueil.competition')}</Etiquette>
              <h2 className="text-h2 mt-3 font-titre">
                {t(locale, 'accueil.un-classement')}
                <br />
                {t(locale, 'accueil.qui-se')}{' '}
                <span className="text-or">{t(locale, 'accueil.competition-titre-2')}</span>
              </h2>
              <p className="mt-3.5 max-w-[46ch] text-gris">
                {t(locale, 'accueil.competition-long')}
              </p>
              <LienFleche href={lien(locale, '/classement')} className="mt-4">
                {t(locale, 'classement.complet')}
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
                      La jauge dit l'écart au meilleur, mesuré depuis le
                      plancher de 800 : c'est là que commence vraiment
                      l'échelle.
                    */}
                    <JaugeDeFond
                      pourcentage={((ligne.elo - PLANCHER_ELO) / meilleurScore) * 100}
                    />

                    <span
                      className={`relative font-mono text-[12.5px] ${
                        ligne.rang === 1 ? 'font-bold text-or' : 'text-gris'
                      }`}
                    >
                      {String(ligne.rang).padStart(2, '0')}
                    </span>

                    <span className="relative min-w-0 truncate">
                      <span className="block truncate text-[15px] font-semibold">
                        {ligne.pseudo}
                      </span>
                      <span
                        className="block font-mono text-[10.5px]"
                        style={{ color: palierDe(ligne.elo).couleur }}
                      >
                        {nomPalier(palierDe(ligne.elo), locale)}
                      </span>
                    </span>

                    <span className="relative font-mono text-sm font-bold text-soupe">
                      {ligne.elo}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="border-t border-bord bg-nuit p-2.75 text-center font-mono text-[10.5px] text-gris">
                {t(locale, 'accueil.cherche-pseudo')}
              </p>
            </CadreTable>
          </div>
        </Section>
      )}

      {/* ═════════════════════════════ APPEL ═════════════════════════════ */}
      <BlocFinal
        titre={
          <>
            {t(locale, 'accueil.final-1')}{' '}
            <span className="text-or">{t(locale, 'accueil.final-2')}</span>.
          </>
        }
        chapeau={
          <PhraseOuverture
            ouvertAuRendu={ouvertAuRendu}
            dateEnPhrase={formaterOuvertureEnPhrase(ouverture, locale)}
          />
        }
      >
        <BoutonIpGeant />
        <p className="mt-4 font-mono text-[11.5px] text-gris">
          {t(locale, 'accueil.final-ip')}
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
    cleTitre: 'accueil.regle.cooldown-titre' as const,
    cleTexte: 'accueil.regle.cooldown' as const,
  },
  {
    zero: true,
    cleTitre: 'accueil.regle.armure-titre' as const,
    cleTexte: 'accueil.regle.armure' as const,
  },
  {
    zero: false,
    cleTitre: 'accueil.regle.clic-droit-titre' as const,
    cleTexte: 'accueil.regle.clic-droit' as const,
  },
  {
    zero: false,
    cleTitre: 'accueil.regle.knockback-titre' as const,
    cleTexte: 'accueil.regle.knockback' as const,
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
