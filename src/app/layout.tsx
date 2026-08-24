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

export const metadata: Metadata = {
  // Sert de base aux URL relatives des métadonnées Open Graph des sous-pages.
  metadataBase: new URL(SITE.url),
  title: {
    default: 'LJKITS — Le PvP Soup à l’ancienne',
    // Les pages filles n'ont qu'à définir leur titre court.
    template: '%s — LJKITS',
  },
  description:
    'Serveur Minecraft PvP Soup 1.8. Kits, soupes, knockback d’époque. Sans pay-to-win.',
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'LJKITS',
    url: SITE.url,
    images: [{ url: '/og.png', width: 1080, height: 1080 }],
  },
  twitter: {
    card: 'summary',
  },
}

export const viewport: Viewport = {
  themeColor: '#0E061F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
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
