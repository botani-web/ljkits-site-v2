import type { Metadata } from 'next'

import { DerniersCombats } from '@/components/classement/DerniersCombats'
import { TableauElo } from '@/components/classement/TableauElo'
import { PagePublique } from '@/components/public/PagePublique'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { EtatVide } from '@/components/ui/EtatVide'
import { Section } from '@/components/ui/Section'
import {
  PALIERS,
  lireChiffresSaison,
  lireClassementElo,
  lireDerniersCombats,
  lireSaisonCourante,
} from '@/lib/elo'
import { IMAGE_OG } from '@/lib/site'
import { estLocale, LANGUE_DEFAUT, lien, t, champ, champOptionnel, type Locale } from '@/lib/i18n'

/**
 * Le classement Elo de la saison.
 *
 * Rendu statique avec une revalidation courte : les chiffres viennent du
 * serveur Minecraft et bougent en continu, mais une page régénérée toutes les
 * minutes suffit — inutile de frapper la base à chaque visite.
 *
 * ⚠ LECTURE SEULE : les tables `elo_*` appartiennent au plugin LJElo. Cette
 * page ne fait que des lectures.
 */
/*
 * 15 s et non 60 : avec 60, le CDN servait à l'arrivée une page vieille de
 * plusieurs minutes (`age: 199` constaté le 02/09/2026), puisqu'en trafic
 * faible la régénération n'est déclenchée que par la visite qui reçoit la
 * version périmée. Le hook corrige le tableau dès le montage, mais le
 * premier rendu doit rester crédible.
 */
export const revalidate = 15

/** Le montant annoncé. Il doit rester en accord avec LJElo/config.yml. */
const CASHPRIZE = '150€'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const titre = t(locale, 'meta.classement-titre')
  const description = t(locale, 'meta.classement-desc')

  return {
    title: titre,
    description,
    // hreflang : c'est ce qui dit aux moteurs que les deux adresses sont
    // la même page dans deux langues, plutôt que du contenu dupliqué.
    alternates: {
      languages: { en: `/en/classement`, fr: `/fr/classement` },
    },
    openGraph: { title: `${titre} — LJKITS`, description, images: IMAGE_OG },
  }
}

export default async function PageClassement({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT

  const saison = await lireSaisonCourante()

  // Aucune saison ouverte : le serveur n'a jamais démarré le plugin. On le dit
  // au lieu d'afficher un tableau vide qui laisserait croire à une panne.
  if (!saison) {
    return (
      <PagePublique locale={locale}>
        <Enveloppe className="py-[clamp(60px,8vw,120px)]">
          <EtatVide message={t(locale, 'classement.vide-page')} />
        </Enveloppe>
      </PagePublique>
    )
  }

  const [lignes, chiffres, combats] = await Promise.all([
    lireClassementElo(saison.id),
    lireChiffresSaison(saison.id),
    lireDerniersCombats(saison.id, 10),
  ])

  return (
    <PagePublique locale={locale}>
      <TableauElo
        locale={locale}
        lignes={lignes}
        combats={combats}
        derniereMaj={chiffres.derniereMaj?.toISOString() ?? null}
        saison={saison.nom}
        cashprize={CASHPRIZE}
      />

      {/* ══════════════════════════ LES PALIERS ══════════════════════════ */}
      <Section
        fond="charbon"
        id="paliers"
        etiquette="Les paliers"
        titre={
          <>
            {t(locale, 'classement.paliers-titre')}{' '}
            <span className="text-or">{t(locale, 'classement.paliers-legende')}</span>
          </>
        }
        chapeau={t(locale, 'classement.paliers-chapeau')}
      >
        <div className="grid gap-3 min-[560px]:grid-cols-2 lg:grid-cols-4">
          {PALIERS.map((palier) => (
            <div key={palier.nom} className="rounded-carte border border-bord bg-braise p-5.5">
              <p
                className="font-titre text-[clamp(22px,2.8vw,28px)] leading-none"
                style={{ color: palier.couleur }}
              >
                {palier.nom}
              </p>
              <p className="mt-3 font-mono text-[13px] text-creme">
                {palier.minimum === 0 ? 'moins de 850' : `${palier.minimum} Elo et plus`}
              </p>
            </div>
          ))}
        </div>

        <div className="hachures mt-3.5 flex flex-wrap items-start gap-5 rounded-carte border border-oni/40 p-6">
          <h3 className="shrink-0 font-titre text-base text-oni">Anti-farm</h3>
          <p className="flex-1 basis-[380px] text-[14.5px] text-gris">
            {t(locale, 'classement.antifarm-1')}{' '}
            <b className="font-semibold text-creme">{t(locale, 'classement.antifarm-gras1')}</b>
            {t(locale, 'classement.antifarm-2')}{' '}
            <b className="font-semibold text-creme">{t(locale, 'classement.antifarm-gras2')}</b>{' '}
            {t(locale, 'classement.antifarm-3')}
          </p>
        </div>
      </Section>

      <DerniersCombats combatsInitiaux={combats} joueurs={chiffres.joueurs} />
    </PagePublique>
  )
}
