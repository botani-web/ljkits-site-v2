import type { Metadata, Viewport } from 'next'
import { Bungee, Outfit, JetBrains_Mono } from 'next/font/google'

import { SuiviAudience } from '@/components/public/SuiviAudience'
import { SITE } from '@/lib/site'
import './globals.css'

/**
 * Les trois polices des maquettes, servies par next/font depuis notre propre
 * domaine : pas de requête vers Google au chargement, et pas de saut de texte.
 * Chacune expose une variable CSS consommée par le bloc @theme de globals.css.
 */
const bungee = Bungee({
  subsets: ['latin'],
  weight: '400',
  variable: '--police-titre',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--police-corps',
  display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--police-mono',
  display: 'swap',
})

/*
  L'ANGLAIS EST LA LANGUE PAR DÉFAUT : ces valeurs servent de repli pour
  /admin et /connexion, et pour tout ce qui ne vit pas sous [locale]. Les
  pages publiques les remplacent avec generateMetadata, et le composant
  LangueDuDocument corrige `lang` sur les pages françaises.
*/
export const metadata: Metadata = {
  // Sert de base aux URL relatives des métadonnées Open Graph des sous-pages.
  metadataBase: new URL(SITE.url),
  title: {
    default: 'LJKITS — Competitive Soup PvP',
    // Les pages filles n'ont qu'à définir leur titre court.
    template: '%s — LJKITS',
  },
  description:
    'Soup PvP server on Minecraft Java 1.7 and 1.8. Ranked 1v1, one global Elo, a monthly cashprize. No pay-to-win.',
  // 16/10/2026 : la tête du logo officiel (masque doré) en icône partout.
  icons: {
    icon: [
      { url: '/marque/icone-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/marque/icone-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/marque/icone-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/marque/icone-180.png', sizes: '180x180' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'LJKITS',
    url: SITE.url,
    images: [{ url: '/marque/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export const viewport: Viewport = {
  themeColor: '#0E061F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bungee.variable} ${outfit.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        {children}
        {/*
          Le suivi d'audience n'affiche rien. Il est monté ici plutôt que dans
          PagePublique pour couvrir aussi les pages qui ne s'en servent pas —
          il s'exclut lui-même de /admin.
        */}
        <SuiviAudience />
      </body>
    </html>
  )
}
