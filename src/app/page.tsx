import Image from 'next/image'
import Link from 'next/link'

import { Classement } from '@/components/public/Classement'
import { BoutonCopieIp } from '@/components/public/CopieIp'
import { IconeDiscord } from '@/components/public/IconeDiscord'
import { PagePublique } from '@/components/public/PagePublique'
import { StatutServeur } from '@/components/public/StatutServeur'
import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/site'

// Page statique, régénérée au plus toutes les heures. Les Server Actions de
// l'admin appellent revalidatePath('/') dès qu'un kit change, pour que le
// nombre de kits affiché plus bas reste juste.
export const revalidate = 3600 // une heure

export default async function Accueil() {
  // Le nombre de kits est lu en base plutôt qu'écrit en dur : la maquette
  // annonçait « 15 kits » à un endroit et « 21 » à un autre.
  const nombreKits = await prisma.kit.count({ where: { visible: true } })

  return (
    <PagePublique>
      {/* ------------------------------- HERO ------------------------------- */}
      <header id="top" className="halo-hero mx-auto max-w-contenu px-6 pt-[150px] pb-15">
        <div className="mb-11 text-center">
          <h1 className="font-titre text-[clamp(34px,5.6vw,66px)] leading-[1.06] uppercase">
            Le meilleur serveur
            <br />
            <span className="texte-accent">PvP Soup</span>
          </h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
          {/* --- grande carte « jouer maintenant » --- */}
          <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[18px] border border-bord bg-linear-[155deg] from-[#47101F] via-[#260921] to-[#150726] p-9.5 pb-8.5">
            {/* quadrillage discret, en fondu vers le bas */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
                backgroundSize: '38px 38px',
                maskImage: 'linear-gradient(200deg, #000 20%, transparent 70%)',
              }}
            />
            {/* halo rouge en bas à droite */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-15 -bottom-20 size-[340px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(233,40,19,.26), transparent 65%)',
              }}
            />

            <div className="relative">
              <h2 className="mb-2.5 font-titre text-3xl uppercase">Jouer maintenant</h2>
              <p className="max-w-[330px] text-[16.5px] text-gris">
                Choisis ton kit, saute dans l’arène et écris ta légende.
              </p>
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-6.5 bottom-0 hidden items-end gap-0.5 sm:flex"
            >
              <Image
                src="https://mc-heads.net/body/MHF_Steve/230"
                alt=""
                width={115}
                height={230}
                unoptimized
                className="h-[180px] w-auto drop-shadow-[0_14px_22px_rgba(0,0,0,.55)] [image-rendering:pixelated] xl:h-[230px]"
              />
              <Image
                src="https://mc-heads.net/body/MHF_Alex/196"
                alt=""
                width={98}
                height={196}
                unoptimized
                className="h-[152px] w-auto translate-y-6.5 -scale-x-100 opacity-90 drop-shadow-[0_14px_22px_rgba(0,0,0,.55)] [image-rendering:pixelated] xl:h-[196px]"
              />
            </div>

            <BoutonCopieIp
              aria-label={`Copier l’adresse du serveur, ${SITE.ip}`}
              className="relative z-2 inline-flex items-center gap-3 self-start rounded-xl bg-linear-[135deg] from-soupe to-or px-6.5 py-3.5 font-mono text-[17px] font-bold text-[#1A1005] shadow-[0_6px_26px_rgba(254,147,1,.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_34px_rgba(254,147,1,.55)]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2.2"
                stroke="#1A1005"
                aria-hidden="true"
                className="size-4.5"
              >
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
              {SITE.ip}
            </BoutonCopieIp>
          </div>

          {/* --- colonne de tuiles --- */}
          <div className="flex flex-col gap-5">
            <Tuile
              href="/#vote"
              titre="Voter"
              sousTitre="+250 coins par vote, récompenses quotidiennes"
              className="flex-1 bg-linear-[135deg] from-soupe to-or text-[#1A1005] shadow-[0_10px_34px_rgba(254,147,1,.22)]"
              icone={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1A1005"
                  strokeWidth="2"
                  aria-hidden="true"
                  className="size-6"
                >
                  <path d="m9 12 2 2 5-5" />
                  <path d="M5 8h14l-1.5 12.5a1.5 1.5 0 0 1-1.5 1.3h-8a1.5 1.5 0 0 1-1.5-1.3L5 8Z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
              }
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Tuile
                href={SITE.discord}
                externe
                titre="Discord"
                sousTitre="Rejoins la Marmite"
                className="bg-discord text-white"
                icone={<IconeDiscord className="size-6 fill-white" />}
              />
              <Tuile
                href="/#classement"
                titre="Classement"
                sousTitre="Top votants du mois"
                className="border border-or/40 bg-charbon text-creme"
                icone={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FDC003"
                    strokeWidth="2"
                    aria-hidden="true"
                    className="size-6"
                  >
                    <path d="M8 21h8M12 17v4M6 3h12v6a6 6 0 0 1-12 0V3Z" />
                    <path d="M6 5H3v2a4 4 0 0 0 3 3.87M18 5h3v2a4 4 0 0 1-3 3.87" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>

        {/* --- rangée statut + bannière --- */}
        <div className="mt-5 grid gap-5 md:grid-cols-[0.5fr_1.5fr]">
          <StatutServeur />

          <div className="relative flex items-center gap-6.5 overflow-hidden rounded-[18px] border border-bord bg-charbon px-8 py-4.5">
            <Image
              src="https://mc-heads.net/body/MHF_Steve/112"
              alt=""
              width={56}
              height={112}
              unoptimized
              aria-hidden="true"
              className="hidden h-28 w-auto self-end drop-shadow-[0_8px_14px_rgba(0,0,0,.5)] [image-rendering:pixelated] sm:block"
            />
            <div>
              <h2 className="text-[21px] font-extrabold">
                Prêt à tremper ta <span className="text-soupe">soupe</span> ?
              </h2>
              <p className="text-[15px] text-gris">
                Le soup français comme en 2014 — sans cooldown, sans pay-to-win.
              </p>
            </div>
            <Image
              src="/soupe.png"
              alt=""
              width={66}
              height={66}
              aria-hidden="true"
              className="ml-auto hidden size-16.5 shrink-0 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,.45)] lg:block"
            />
          </div>
        </div>
      </header>

      {/* --------------------------- VAGUE DE SOUPE -------------------------- */}
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="relative z-2 mt-12 block h-[90px] w-full"
      >
        <path
          d="M0,55 C180,20 300,85 480,60 C660,35 760,80 940,55 C1120,30 1260,75 1440,45 L1440,90 L0,90 Z"
          fill="#171029"
        />
        <path
          d="M0,60 C180,28 300,88 480,64 C660,40 760,84 940,60 C1120,36 1260,78 1440,50"
          fill="none"
          stroke="#FE9301"
          strokeWidth="3"
          opacity=".85"
        />
      </svg>

      {/* --------------------------- COMMENT JOUER -------------------------- */}
      <section id="jouer" className="bg-charbon px-6 pt-[70px] pb-24">
        <div className="mx-auto max-w-contenu">
          <EnTeteSection surtitre="Comment jouer" titre="En jeu en 60 secondes" />

          <div className="grid gap-5.5 md:grid-cols-3">
            <Etape numero={1} titre="Lance Minecraft Java">
              <p>
                N’importe quelle version fonctionne. Pour le meilleur ressenti PvP, on
                recommande la 1.8.9.
              </p>
              <span className="mt-4 inline-block rounded-lg border border-vert/25 bg-vert/8 px-3 py-1.5 text-xs font-bold tracking-wide text-vert">
                1.8 → 1.21+ acceptées
              </span>
            </Etape>

            <Etape numero={2} titre="Ajoute le serveur">
              <p>
                Multijoueur → Ajouter un serveur → colle l’adresse{' '}
                <code className="rounded-md bg-braise px-2 py-0.5 font-mono text-sm text-or">
                  {SITE.ip}
                </code>{' '}
                et rejoins.
              </p>
            </Etape>

            <Etape numero={3} titre="Choisis ton kit">
              <p>
                Clic droit sur le papier, prends un kit, saute dans l’arène. Gagne des coins
                à chaque kill pour débloquer les{' '}
                <Link href="/kits" className="text-or underline underline-offset-2">
                  {nombreKits} kits
                </Link>
                .
              </p>
            </Etape>
          </div>
        </div>
      </section>

      {/* -------------------------------- VOTE ------------------------------- */}
      <section id="vote" className="mx-auto max-w-contenu px-6 py-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <div className="mb-3.5 text-xs font-bold tracking-[3px] text-oni uppercase [text-shadow:0_0_18px_rgba(233,40,19,.35)]">
              Soutenir le serveur
            </div>
            <h2 className="font-titre text-[clamp(26px,4vw,42px)] leading-[1.1] uppercase">
              Vote &amp; gagne des coins
            </h2>
            <p className="my-5 text-gris">
              Chaque vote fait monter LJKITS dans les classements et fait venir de nouveaux
              adversaires. En échange, tu reçois des{' '}
              <b className="text-creme">coins directement en jeu</b> — connecté ou non.
            </p>
            <div className="flex items-center gap-3.5 rounded-2xl border border-bord bg-charbon px-5 py-4.5">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-8.5 shrink-0">
                <circle cx="12" cy="12" r="9" fill="#FDC003" />
                <circle cx="12" cy="12" r="6.5" fill="#FE9301" />
                <path
                  d="M12 8.5v7M9.5 11h5"
                  stroke="#1A1005"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[15px] text-gris">
                <b className="text-or">+250 coins</b> par vote, cumulables sur les 3 sites,
                toutes les 2 heures.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {SITE.sitesDeVote.map((site) => {
              // Tant que l'URL vaut '#', le serveur n'est pas encore inscrit :
              // le bouton reste affiché mais devient inerte.
              const inscrit = site.url !== '#'

              return (
                <div
                  key={site.cle}
                  className="flex items-center justify-between gap-4.5 rounded-2xl border border-bord bg-charbon px-6 py-5 transition-colors hover:border-[#43305E]"
                >
                  <div className="flex items-center gap-4">
                    <div
                      aria-hidden="true"
                      className="flex size-11 items-center justify-center rounded-xl bg-braise font-titre text-base text-soupe"
                    >
                      {site.sigle}
                    </div>
                    <div>
                      <div className="text-[16.5px] font-bold">{site.nom}</div>
                      <div className="font-mono text-[13.5px] text-gris">
                        {inscrit ? 'Disponible' : 'Bientôt'}
                      </div>
                    </div>
                  </div>

                  {inscrit ? (
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[10px] bg-linear-[135deg] from-soupe to-or px-6 py-2.5 text-[14.5px] font-bold whitespace-nowrap text-[#1A1005] transition-all hover:-translate-y-px hover:shadow-[0_5px_20px_rgba(254,147,1,.4)]"
                    >
                      Voter
                    </a>
                  ) : (
                    <span className="rounded-[10px] bg-braise px-6 py-2.5 text-[14.5px] font-bold whitespace-nowrap text-gris">
                      Bientôt
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------- CLASSEMENT ---------------------------- */}
      <section id="classement" className="bg-charbon px-6 py-24">
        <div className="mx-auto max-w-contenu">
          <EnTeteSection
            surtitre="Classement du mois"
            titre="Les meilleurs votants"
            sousTitre="Le top 3 de chaque mois est immortalisé au spawn — et repart avec un bonus de coins."
          />
          <Classement />
          <p className="mt-5.5 text-center text-sm text-gris">
            Le classement se réinitialise le 1ᵉʳ de chaque mois.
          </p>
        </div>
      </section>
    </PagePublique>
  )
}

/* -------------------------------------------------------------------------- */
/* Petits composants locaux : ils ne servent qu'à cette page.                  */
/* -------------------------------------------------------------------------- */

function Tuile({
  href,
  externe = false,
  titre,
  sousTitre,
  icone,
  className,
}: {
  href: string
  externe?: boolean
  titre: string
  sousTitre: string
  icone: React.ReactNode
  className: string
}) {
  const contenu = (
    <>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden="true"
        className="absolute top-5 right-5 size-5 opacity-55"
      >
        <path d="M7 17 17 7M9 7h8v8" />
      </svg>
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-black/18">
        {icone}
      </div>
      <h2 className="text-[21px] font-extrabold">{titre}</h2>
      <div className="text-[14.5px] font-medium opacity-85">{sousTitre}</div>
    </>
  )

  const classes = `relative block overflow-hidden rounded-[18px] px-7 py-6.5 transition-all hover:-translate-y-0.5 hover:brightness-105 ${className}`

  if (externe) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {contenu}
      </a>
    )
  }

  return (
    <Link href={href} className={classes}>
      {contenu}
    </Link>
  )
}

function EnTeteSection({
  surtitre,
  titre,
  sousTitre,
}: {
  surtitre: string
  titre: string
  sousTitre?: string
}) {
  return (
    <div className="mb-15 text-center">
      <div className="mb-3.5 text-xs font-bold tracking-[3px] text-oni uppercase [text-shadow:0_0_18px_rgba(233,40,19,.35)]">
        {surtitre}
      </div>
      <h2 className="font-titre text-[clamp(26px,4vw,42px)] leading-[1.1] uppercase">
        {titre}
      </h2>
      {sousTitre && <p className="mx-auto mt-4 max-w-[520px] text-gris">{sousTitre}</p>}
    </div>
  )
}

function Etape({
  numero,
  titre,
  children,
}: {
  numero: number
  titre: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-bord bg-charbon px-7 py-8.5 transition-all hover:-translate-y-1 hover:border-[#43305E]">
      <div className="mb-5.5 flex size-9.5 items-center justify-center rounded-[10px] bg-linear-[135deg] from-soupe to-or font-titre text-[15px] text-nuit">
        {numero}
      </div>
      <h3 className="mb-2.5 text-[19px] font-bold">{titre}</h3>
      <div className="text-[15.5px] text-gris">{children}</div>
    </div>
  )
}
