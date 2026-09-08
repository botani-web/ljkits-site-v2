import type { Metadata } from 'next'
import Link from 'next/link'

import { BoutonIpGeant } from '@/components/public/CopieIp'
import { GrilleKits } from '@/components/public/GrilleKits'
import { PagePublique } from '@/components/public/PagePublique'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { BandeauChiffres } from '@/components/ui/GrilleCloisonnee'
import { BlocFinal, Section } from '@/components/ui/Section'
import { Etiquette } from '@/components/ui/TeteSection'
import { prisma } from '@/lib/prisma'
import { IMAGE_OG, reperes } from '@/lib/site'
import { estLocale, LANGUE_DEFAUT, lien, t, champ, champOptionnel, type Locale } from '@/lib/i18n'

export const revalidate = 3600 // une heure

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const titre = t(locale, 'meta.kits-titre')
  const description = t(locale, 'meta.kits-desc')

  return {
    title: titre,
    description,
    // hreflang : c'est ce qui dit aux moteurs que les deux adresses sont
    // la même page dans deux langues, plutôt que du contenu dupliqué.
    alternates: {
      languages: { en: `/en/kits`, fr: `/fr/kits` },
    },
    openGraph: { title: `${titre} — LJKITS`, description, images: IMAGE_OG },
  }
}

/** Les quatre repères de jeu affichés sous le titre. */
const REGLES_DU_JEU = reperes('soupe', 'epee', 'cooldown', 'knockback')

export default async function PageKits({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT

  const kitsBruts = await prisma.kit.findMany({
    where: { visible: true },
    orderBy: { ordre: 'asc' },
    select: {
      slug: true,
      nom: true,
      kanji: true,
      role: true,
      roleEn: true,
      descriptionCourte: true,
      descriptionCourteEn: true,
      prixCoins: true,
      prixEurosCentimes: true,
      type: true,
      bientot: true,
      kitDeDepart: true,
      caracteristiques: {
        orderBy: { ordre: 'asc' },
        select: { libelle: true, valeur: true, libelleEn: true, valeurEn: true },
      },
    },
  })

  // LA LANGUE EST RÉSOLUE ICI, PAS DANS LE COMPOSANT.
  //
  // La grille est un composant client : lui envoyer les deux langues
  // doublerait la charge utile pour n'en afficher qu'une. On choisit donc
  // avant de franchir la frontière, et la carte reste inchangée.
  const kits = kitsBruts.map((kit) => ({
    ...kit,
    role: champ(locale, kit.role, kit.roleEn),
    descriptionCourte: champ(locale, kit.descriptionCourte, kit.descriptionCourteEn),
    caracteristiques: kit.caracteristiques.map((c) => ({
      libelle: champ(locale, c.libelle, c.libelleEn),
      valeur: champ(locale, c.valeur, c.valeurEn),
    })),
  }))

  const exclusifs = kits.filter((kit) => kit.type === 'EXCLUSIF')
  const nombreClassiques = kits.length - exclusifs.length

  return (
    <PagePublique locale={locale}>
      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <header className="halo-hero-gauche pt-[clamp(52px,7vw,86px)] pb-[clamp(34px,4vw,46px)]">
        <Enveloppe>
          <Etiquette>
            {kits.length} {t(locale, 'kits.etiquette')}
          </Etiquette>

          <h1 className="text-h1 mt-4 font-titre">
            {t(locale, 'kits.h1-avant')}{' '}
            <span className="text-or">{t(locale, 'kits.h1-apres')}</span>
          </h1>

          <p className="mt-5 max-w-[56ch] text-[clamp(16px,1.8vw,18.5px)] text-gris">
            {t(locale, 'kits.chapo-1')}{' '}
            <b className="font-semibold text-creme">{t(locale, 'kits.chapo-gras')}</b>
            {t(locale, 'kits.chapo-2')}
          </p>

          <BandeauChiffres
            className="mt-[clamp(32px,4vw,44px)]"
            colonnes="grid-cols-2 lg:grid-cols-4"
            reperes={REGLES_DU_JEU.map((regle) => ({
              valeur: regle.valeur,
              label: regle.label,
              // Le seul repère qui dit une absence passe en rouge.
              ton: regle.cle === 'cooldown' ? ('oni' as const) : ('or' as const),
            }))}
          />
        </Enveloppe>
      </header>

      {/* ════════════════════ BARRE D'OUTILS ET GRILLE ════════════════════ */}
      <GrilleKits kits={kits} locale={locale} />

      {/* ═══════════════════════ LES EXCLUSIFS ═══════════════════════ */}
      {exclusifs.length > 0 && (
        <Section>
          {/*
            Bloc en COLONNE, et non en deux colonnes côte à côte.
            Avec seize exclusifs, la grille de kanji faisait six rangées
            serrées dans 320 px à droite du texte : le bloc paraissait
            déséquilibré et les idéogrammes illisibles. Ils passent donc
            dessous, sur toute la largeur, alignés à droite.
          */}
          <div className="hachures rounded-bloc border border-oni/40 p-[clamp(30px,5vw,52px)]">
            <div>
              <Etiquette className="text-oni">
                {exclusifs.length === 1
                  ? t(locale, 'kits.exclusif-un')
                  : `${t(locale, 'kits.exclusifs-les')} ${exclusifs.length} ${t(locale, 'kits.exclusifs-n')}`}
              </Etiquette>
              <h2 className="text-h2 mt-3 font-titre">
                {t(locale, 'kits.exclusifs-h2-1')}
                <br />
                {t(locale, 'kits.exclusifs-h2-2')}{' '}
                <span className="text-oni">{t(locale, 'kits.exclusifs-h2-3')}</span>.
              </h2>
              <p className="mt-4 max-w-[56ch] text-[15.5px] text-gris">
                {t(locale, 'kits.exclusifs-texte')}{' '}
                <b className="font-semibold text-creme">
                  {t(locale, 'kits.exclusifs-gras').replace('{n}', String(nombreClassiques))}
                </b>{' '}
                {t(locale, 'kits.exclusifs-fin')}
              </p>
            </div>

            {/*
              La grille de kanji ne montre que les exclusifs qui en ont un.
              Un kanji manquant en base n'affiche pas de case vide : il retire
              simplement la sienne.

              Quatre colonnes sur mobile, huit sur grand écran : seize kits
              tiennent alors en deux rangées, quel que soit le nombre exact.
            */}
            <ul className="mt-[clamp(26px,4vw,44px)] ml-auto grid w-full max-w-[min(100%,720px)] grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {exclusifs
                .filter((kit) => kit.kanji)
                .map((kit) => (
                  <li key={kit.slug}>
                    <Link
                      href={`/kits/${kit.slug}`}
                      className="flex min-h-11 flex-col items-center justify-center rounded-controle border border-bord bg-nuit px-2 py-3.5 text-center transition-colors hover:border-oni"
                    >
                      <span className="text-2xl leading-none text-oni" aria-hidden="true">
                        {kit.kanji}
                      </span>
                      <span className="mt-2 font-mono text-[10px] tracking-[.08em] text-gris">
                        {kit.nom}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </Section>
      )}

      {/* ══════════════════════ GAGNER DES COINS ══════════════════════ */}
      <Section
        fond="charbon"
        etiquette="La monnaie"
        titre={
          <>
            Comment on remplit <span className="text-or">sa bourse</span>
          </>
        }
        chapeau="Aucun kit ne se paie obligatoirement. Voici tout ce qui rapporte des coins, sans sortir la carte bleue."
      >
        <div className="grid gap-3 min-[560px]:grid-cols-2 lg:grid-cols-4">
          {SOURCES_DE_COINS.map((source) => (
            <div
              key={source.titre}
              className="rounded-carte border border-bord bg-braise p-5.5"
            >
              <p className="font-mono text-[clamp(26px,3.4vw,34px)] leading-none font-bold text-soupe">
                {source.valeur}
              </p>
              <h3 className="mt-3.5 font-titre text-[15px]">{source.titre}</h3>
              <p className="mt-2.25 text-sm text-gris">{source.texte}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═════════════════════════════ APPEL ═════════════════════════════ */}
      <BlocFinal
        etiquette="Rien à débourser pour commencer"
        titre={
          <>
            Le premier kit est <span className="text-or">gratuit</span>.
          </>
        }
        chapeau="Connecte-toi, prends le PvP, vise le suivant. Un quart d’heure suffit pour le débloquer."
      >
        <BoutonIpGeant />
      </BlocFinal>
    </PagePublique>
  )
}

/* -------------------------------------------------------------------------- */
/* Contenu local                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Les sources de coins.
 *
 * Aucune source en base : ce sont des règles d'économie du serveur, pas des
 * données.
 *
 * ⚠ Le serveur a DEUX événements, et tous deux rapportent des coins ET des
 * points de classement. Ne pas répéter l'ancienne confusion, qui réservait le
 * KOTH aux points et le totem aux coins :
 *   KOTH  — 500 coins au vainqueur, et +5 points (+10 en Semaine et Mois).
 *   Totem — une part d'une cagnotte de 2 500 coins, et +5 points
 *           (+10 en Semaine et Mois).
 * Le barème de points est détaillé sur /classement.
 */
const SOURCES_DE_COINS = [
  {
    valeur: '~20',
    titre: 'Par kill',
    texte:
      'Le gain dépend de la série de ta cible : plus elle enchaînait, plus elle vaut cher.',
  },
  {
    valeur: '+50',
    titre: 'Tous les 10 kills',
    texte: 'Un palier de session qui tombe tout seul, en plus des gains de chaque kill.',
  },
  {
    valeur: '500',
    titre: 'Le KOTH',
    texte:
      'Tiens la zone assez longtemps sans te faire déloger et la récompense est à toi.',
  },
  {
    valeur: '2 500',
    titre: 'Le Totem',
    texte: 'La cagnotte de l’événement, répartie entre les joueurs qui l’ont fait tomber.',
  },
  {
    valeur: '1 000',
    titre: 'Lier son Discord',
    texte:
      'Une seule fois : /discord en jeu, puis le code dans le salon de vérification.',
  },
]
