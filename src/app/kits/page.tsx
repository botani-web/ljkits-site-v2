import type { Metadata } from 'next'

import { BoutonCopieIp } from '@/components/public/CopieIp'
import { GrilleKits } from '@/components/public/GrilleKits'
import { PagePublique } from '@/components/public/PagePublique'
import { prisma } from '@/lib/prisma'
import { lireReglages } from '@/lib/reglages'
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

/** Les quatre chiffres clés affichés par la maquette d'origine. */
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

  const nombreExclusifs = kits.filter((kit) => kit.type === 'EXCLUSIF').length
  const { ip } = await lireReglages()

  return (
    <PagePublique>
      <header className="halo-hero overflow-hidden px-6 pt-[150px] pb-8.5">
        <div className="mx-auto max-w-contenu text-center">
          <p className="mb-3.5 font-mono text-xs font-bold tracking-[3px] text-oni uppercase [text-shadow:0_0_18px_rgba(233,40,19,.35)]">
            {kits.length} kits · 0 armure
          </p>
          <h1 className="font-titre text-[clamp(30px,5vw,54px)] leading-[1.05] uppercase">
            Choisis ta <span className="texte-accent">lame</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[17px] text-gris">
            Pas de stuff, pas de niveaux : juste une épée en pierre, un inventaire de soupes
            et une capacité qui change tout.
          </p>

          <div className="mx-auto mt-9.5 grid max-w-[860px] grid-cols-2 gap-px overflow-hidden rounded-xl border border-bord bg-bord md:grid-cols-4">
            {REGLES_DU_JEU.map((regle) => (
              <div key={regle.label} className="bg-charbon px-4 py-4.5 text-center">
                <div className="font-titre text-2xl leading-[1.1] text-or">{regle.valeur}</div>
                <div className="mt-1.5 font-mono text-[10.5px] tracking-[1.2px] text-gris uppercase">
                  {regle.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-contenu px-6">
        <GrilleKits kits={kits} />

        {nombreExclusifs > 0 && (
          <aside className="mt-6.5 flex items-start gap-4 rounded-[10px] border border-[#3a2a55] border-l-[3px] border-l-violet bg-linear-[100deg] from-violet/6 to-transparent px-6 py-5">
            <div className="pt-0.5 font-titre text-[19px] leading-none text-violet" aria-hidden="true">
              ✦
            </div>
            <div>
              <h2 className="mb-1.5 text-[15.5px] font-bold">
                Les kits exclusifs ne frappent pas plus fort
              </h2>
              <p className="text-[14.5px] text-gris">
                Ils sont créés de toutes pièces pour LJKITS et jouent autrement, c’est tout.
                Chacun s’obtient <strong className="font-semibold text-white">en coins comme les autres</strong> —
                l’option payante ne fera que raccourcir le grind, et fera tourner le serveur.
              </p>
            </div>
          </aside>
        )}

        {/* -------------------------- GAGNER DES COINS ------------------------- */}
        <section className="pt-15">
          <h2 className="font-titre text-[clamp(20px,2.6vw,27px)] uppercase">
            Comment on gagne des coins
          </h2>
          <p className="mt-1.5 mb-6 max-w-[640px] text-[15.5px] text-gris">
            Aucun kit ne se paie obligatoirement. Voici tout ce qui remplit ta bourse en
            jouant.
          </p>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <SourceDeCoins valeur="~20" titre="Par kill">
              Base de 10, plus les bonus de série, de premier sang et les primes sur les
              joueurs en série.
            </SourceDeCoins>
            <SourceDeCoins valeur="+50" titre="Tous les 10 kills">
              Un palier de session qui tombe automatiquement, en plus des gains de chaque
              kill.
            </SourceDeCoins>
            <SourceDeCoins valeur="500" titre="Le KOTH">
              Tiens la zone assez longtemps sans te faire déloger et la récompense est à toi.
            </SourceDeCoins>
            <SourceDeCoins valeur="1 000" titre="Lier son Discord">
              Une seule fois : <code className="font-mono text-or">/discord</code> en jeu, le
              code dans le salon de vérification.
            </SourceDeCoins>
          </div>
        </section>

        <div className="my-11 mb-17 rounded-xl border border-dashed border-soupe bg-linear-[100deg] from-soupe/7 to-transparent px-6 py-8.5 text-center">
          <h2 className="font-titre text-[clamp(19px,2.4vw,25px)] uppercase">
            Le premier kit est gratuit
          </h2>
          <p className="mx-auto mt-2 mb-5 max-w-[480px] text-[15px] text-gris">
            Connecte-toi, prends le PvP, et vise le suivant. Une quinzaine de minutes
            suffisent pour le débloquer.
          </p>
          <BoutonCopieIp
            aria-label={`Copier l’adresse du serveur, ${ip}`}
            className="inline-block rounded-lg bg-soupe px-6.5 py-3 font-mono text-[15px] font-bold text-[#1a0f00] transition-all hover:-translate-y-px hover:bg-or"
          >
            {ip}
          </BoutonCopieIp>
        </div>
      </main>
    </PagePublique>
  )
}

function SourceDeCoins({
  valeur,
  titre,
  children,
}: {
  valeur: string
  titre: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[10px] border border-bord bg-braise px-5 py-4.5">
      <div className="font-titre text-[22px] text-soupe">{valeur}</div>
      <h3 className="mt-1 mb-1.5 text-[14.5px] font-bold">{titre}</h3>
      <p className="text-[13.5px] text-gris">{children}</p>
    </div>
  )
}
