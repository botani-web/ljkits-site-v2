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

export const revalidate = 3600 // une heure

export const metadata: Metadata = {
  title: 'Les kits',
  description:
    'Les kits de LJKITS : capacités, cooldowns, prix en coins. Aucune armure, que du skill.',
  openGraph: {
    title: 'Les kits — LJKITS',
    description: 'Leurs capacités et leurs cooldowns. Tout se débloque en jouant.',
    images: IMAGE_OG,
  },
}

/** Les quatre repères de jeu affichés sous le titre. */
const REGLES_DU_JEU = reperes('soupe', 'epee', 'cooldown', 'knockback')

export default async function PageKits() {
  const kits = await prisma.kit.findMany({
    where: { visible: true },
    orderBy: { ordre: 'asc' },
    select: {
      slug: true,
      nom: true,
      kanji: true,
      role: true,
      descriptionCourte: true,
      prixCoins: true,
      prixEurosCentimes: true,
      type: true,
      bientot: true,
      kitDeDepart: true,
      caracteristiques: {
        orderBy: { ordre: 'asc' },
        select: { libelle: true, valeur: true },
      },
    },
  })

  const exclusifs = kits.filter((kit) => kit.type === 'EXCLUSIF')
  const nombreClassiques = kits.length - exclusifs.length

  return (
    <PagePublique>
      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <header className="halo-hero-gauche pt-[clamp(52px,7vw,86px)] pb-[clamp(34px,4vw,46px)]">
        <Enveloppe>
          <Etiquette>
            {kits.length} kits · 0 armure · 0 niveau
          </Etiquette>

          <h1 className="text-h1 mt-4 font-titre">
            Choisis <span className="text-or">ta lame</span>
          </h1>

          <p className="mt-5 max-w-[56ch] text-[clamp(16px,1.8vw,18.5px)] text-gris">
            Il n’y a ni stuff à farmer ni niveau à monter. Tout le monde sort du spawn avec
            une épée en pierre, un inventaire de soupes et{' '}
            <b className="font-semibold text-creme">une seule capacité</b>. C’est elle qui
            décide de ta façon de jouer.
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
      <GrilleKits kits={kits} />

      {/* ═══════════════════════ LES EXCLUSIFS ═══════════════════════ */}
      {exclusifs.length > 0 && (
        <Section>
          <div
            className="hachures grid items-center gap-[clamp(26px,4vw,50px)] rounded-bloc border border-oni/40 p-[clamp(30px,5vw,52px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]"
          >
            <div>
              <Etiquette className="text-oni">
                {exclusifs.length === 1
                  ? 'L’exclusif'
                  : `Les ${exclusifs.length} exclusifs`}
              </Etiquette>
              <h2 className="text-h2 mt-3 font-titre">
                Ils ne frappent pas plus fort.
                <br />
                Ils jouent <span className="text-oni">autrement</span>.
              </h2>
              <p className="mt-4 max-w-[56ch] text-[15.5px] text-gris">
                Ces kits ont été écrits de zéro pour LJKITS — tu ne les trouveras nulle part
                ailleurs. Ils coûtent plus cher en coins parce qu’ils sont plus longs à
                maîtriser, pas parce qu’ils gagnent les combats à ta place.{' '}
                <b className="font-semibold text-creme">
                  Chacun s’obtient en jouant, exactement comme les {nombreClassiques} autres.
                </b>{' '}
                L’option payante ne fait que raccourcir le grind, et fait tourner le serveur.
              </p>
            </div>

            {/*
              La grille de kanji ne montre que les exclusifs qui en ont un.
              Un kanji manquant en base n'affiche pas de case vide : il retire
              simplement la sienne.
            */}
            <ul className="grid grid-cols-3 gap-2">
              {exclusifs
                .filter((kit) => kit.kanji)
                .map((kit) => (
                  <li key={kit.slug}>
                    <Link
                      href={`/kits/${kit.slug}`}
                      className="flex min-h-11 flex-col items-center justify-center rounded-controle border border-bord bg-nuit px-2.5 py-4 text-center transition-colors hover:border-oni"
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
 * Les quatre sources de coins.
 *
 * Aucune source en base : ce sont des règles d'économie du serveur, pas des
 * données. Les valeurs sont celles déjà en ligne — la maquette annonçait
 * « 5 000 · Le Totem » là où le site dit « 500 · Le KOTH », et je n'ai pas
 * tranché un écart de règle du jeu tout seul.
 */
const SOURCES_DE_COINS = [
  {
    valeur: '~20',
    titre: 'Par kill',
    texte:
      'Une base de 10, plus les bonus de série, le premier sang doublé et les primes sur les joueurs en série.',
  },
  {
    valeur: '+50',
    titre: 'Tous les 10 kills',
    texte:
      'Un palier de session qui tombe tout seul, en plus des gains de chaque kill.',
  },
  {
    valeur: '500',
    titre: 'Le KOTH',
    texte:
      'Tiens la zone assez longtemps sans te faire déloger et la récompense est à toi.',
  },
  {
    valeur: '1 000',
    titre: 'Lier son Discord',
    texte:
      'Une seule fois : /discord en jeu, puis le code dans le salon de vérification.',
  },
]
