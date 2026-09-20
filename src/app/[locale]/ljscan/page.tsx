import type { Metadata } from 'next'

import { PagePublique } from '@/components/public/PagePublique'
import { classesBouton } from '@/components/ui/Bouton'
import { Enveloppe } from '@/components/ui/Enveloppe'
import { Etiquette } from '@/components/ui/TeteSection'
import { estLocale, LANGUE_DEFAUT, t, type Locale } from '@/lib/i18n'
import { lireOutilScan } from '@/lib/scan'

/**
 * LA PAGE DE TÉLÉCHARGEMENT DU SCREENSHARE (LJScan).
 *
 * ── POURQUOI ELLE EXISTE ──────────────────────────────────────────────────
 * Quand le staff demande un screenshare, le joueur doit récupérer l'outil
 * quelque part. Jusqu'ici le fichier ne vivait que dans le panel, derrière un
 * mot de passe : le staff devait le renvoyer à la main, par Discord, à chaque
 * fois. Cette page est l'adresse qu'on donne en jeu.
 *
 * ── LE FICHIER N'EST PAS DANS CE DÉPÔT ────────────────────────────────────
 * L'exécutable pèse 67 Mo. Il est servi par le panel
 * (panel.ljkits.eu/telechargement/ljscan), qui le tient à jour à chaque
 * compilation. Le site ne fait que pointer dessus et afficher sa version, sa
 * taille et son empreinte — lues au chargement de la page.
 *
 * ── L'EMPREINTE EST LÀ POUR UNE RAISON ────────────────────────────────────
 * L'exécutable n'est pas signé : Windows et les antivirus vont râler. Un
 * joueur méfiant a le droit de vérifier que ce qu'il a téléchargé est bien ce
 * que le serveur annonce, sans nous croire sur parole : c'est à ça que sert le
 * SHA-256 affiché, comparable avec Get-FileHash.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const titre = t(locale, 'meta.telechargement-titre')
  const description = t(locale, 'meta.telechargement-desc')

  return {
    title: titre,
    description,
    alternates: { languages: { en: `/en/telechargement`, fr: `/fr/telechargement` } },
    openGraph: { title: `${titre} — LJKITS`, description },
  }
}

/** La version et l'empreinte viennent du panel : elles changent sans déploiement. */
export const revalidate = 300

export default async function PageTelechargement({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: brut } = await params
  const locale: Locale = estLocale(brut) ? brut : LANGUE_DEFAUT
  const outil = await lireOutilScan()

  const questions = [
    { q: t(locale, 'dl.q1'), r: t(locale, 'dl.r1') },
    { q: t(locale, 'dl.q2'), r: t(locale, 'dl.r2') },
    { q: t(locale, 'dl.q3'), r: t(locale, 'dl.r3') },
    { q: t(locale, 'dl.q4'), r: t(locale, 'dl.r4') },
  ]

  const etapes = [
    { n: '1', titre: t(locale, 'dl.etape1-titre'), texte: t(locale, 'dl.etape1-texte') },
    { n: '2', titre: t(locale, 'dl.etape2-titre'), texte: t(locale, 'dl.etape2-texte') },
    { n: '3', titre: t(locale, 'dl.etape3-titre'), texte: t(locale, 'dl.etape3-texte') },
  ]

  return (
    <PagePublique locale={locale}>
      <header className="halo-hero border-b border-bord py-[clamp(48px,6vw,80px)] text-center">
        <Enveloppe>
          <div className="mx-auto max-w-lecture">
            <Etiquette>{t(locale, 'dl.etiquette')}</Etiquette>

            <h1 className="text-h1 mt-4 font-titre">
              {t(locale, 'dl.h1-1')} <span className="text-or">{t(locale, 'dl.h1-2')}</span>
            </h1>

            <p className="mx-auto mt-4.5 max-w-[54ch] text-gris">{t(locale, 'dl.chapo')}</p>

            <div className="mt-7 flex flex-col items-center gap-3">
              <a
                href={outil.lien}
                className={classesBouton({ variante: 'plein' })}
                download
              >
                {t(locale, 'dl.bouton')}
                {outil.version ? ` — ${outil.version}` : ''}
              </a>

              <p className="font-mono text-[11.5px] text-gris">
                {t(locale, 'dl.windows')}
                {outil.taille > 0
                  ? ` · ${Math.round(outil.taille / 1024 / 1024)} Mo`
                  : ''}
              </p>
            </div>
          </div>
        </Enveloppe>
      </header>

      <main className="py-section">
        <Enveloppe>
          <div className="mx-auto max-w-lecture">
            {/* ── LES TROIS ÉTAPES ─────────────────────────────────────── */}
            <ol className="grid gap-3.5 sm:grid-cols-3">
              {etapes.map((e) => (
                <li key={e.n} className="rounded-carte border border-bord bg-charbon p-5">
                  <span className="font-mono text-[11px] font-bold tracking-[.18em] text-soupe">
                    {e.n}
                  </span>
                  <p className="mt-2 font-titre text-[15.5px]">{e.titre}</p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-gris">{e.texte}</p>
                </li>
              ))}
            </ol>

            {/* ── EN CLAIR, CE QU'IL FAIT ──────────────────────────────────
                Quelqu'un qui s'apprête à lancer un .exe qu'on lui a donné en
                jeu mérite une explication en français courant, avant les
                listes. C'est le bloc le plus important de la page. */}
            <section className="mt-3.5 rounded-carte border border-bord bg-charbon p-5.5">
              <h2 className="font-titre text-[17px]">{t(locale, 'dl.clair-titre')}</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-gris">
                {t(locale, 'dl.clair-1')}
              </p>
              <p className="mt-2.5 text-[14px] leading-relaxed text-gris">
                {t(locale, 'dl.clair-2')}
              </p>
              <p className="mt-2.5 text-[14px] leading-relaxed text-gris">
                {t(locale, 'dl.clair-3')}
              </p>
            </section>

            {/* ── CE QUE L'OUTIL FAIT, ET CE QU'IL NE FAIT PAS ──────────── */}
            <section className="mt-9 grid gap-3.5 sm:grid-cols-2">
              <div className="rounded-carte border border-bord bg-charbon p-5.5">
                <h2 className="font-mono text-[10.5px] font-bold tracking-[.18em] text-soupe uppercase">
                  {t(locale, 'dl.fait-titre')}
                </h2>
                <ul className="mt-3.5 space-y-2.5 text-[13.5px] leading-relaxed text-gris">
                  <li>{t(locale, 'dl.fait-1')}</li>
                  <li>{t(locale, 'dl.fait-2')}</li>
                  <li>{t(locale, 'dl.fait-3')}</li>
                </ul>
              </div>

              <div className="rounded-carte border border-bord bg-charbon p-5.5">
                <h2 className="font-mono text-[10.5px] font-bold tracking-[.18em] text-soupe uppercase">
                  {t(locale, 'dl.pasfait-titre')}
                </h2>
                <ul className="mt-3.5 space-y-2.5 text-[13.5px] leading-relaxed text-gris">
                  <li>{t(locale, 'dl.pasfait-1')}</li>
                  <li>{t(locale, 'dl.pasfait-2')}</li>
                  <li>{t(locale, 'dl.pasfait-3')}</li>
                </ul>
              </div>
            </section>

            {/* ── LES QUESTIONS QU'ON NOUS POSE VRAIMENT ────────────────── */}
            <section className="mt-3.5 rounded-carte border border-bord bg-charbon p-5.5">
              <h2 className="font-mono text-[10.5px] font-bold tracking-[.18em] text-soupe uppercase">
                {t(locale, 'dl.questions-titre')}
              </h2>
              <dl className="mt-3.5">
                {questions.map((q) => (
                  <div
                    key={q.q}
                    className="border-t border-bord py-3 first:border-t-0 first:pt-0"
                  >
                    <dt className="text-[14px] font-semibold text-creme">{q.q}</dt>
                    <dd className="mt-1.5 text-[13.5px] leading-relaxed text-gris">{q.r}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* ── L'ANTIVIRUS ET L'EMPREINTE ────────────────────────────── */}
            <section className="mt-3.5 rounded-carte border border-bord bg-braise p-5.5">
              <h2 className="font-mono text-[10.5px] font-bold tracking-[.18em] text-soupe uppercase">
                {t(locale, 'dl.verif-titre')}
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-gris">
                {t(locale, 'dl.verif-texte')}
              </p>

              {outil.sha256 && (
                <>
                  <p className="mt-4 font-mono text-[11.5px] text-gris">
                    Get-FileHash .\{outil.nom} -Algorithm SHA256
                  </p>
                  <p className="mt-2 font-mono text-[11px] break-all text-creme">{outil.sha256}</p>
                </>
              )}
            </section>

            {!outil.present && (
              <p className="mt-3.5 rounded-carte border border-bord bg-charbon p-5.5 text-[13.5px] text-gris">
                {t(locale, 'dl.indisponible')}
              </p>
            )}
          </div>
        </Enveloppe>
      </main>
    </PagePublique>
  )
}
