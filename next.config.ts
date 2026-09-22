import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Les images distantes utilisées par le site : les têtes et corps de skins
  // Minecraft servis par mc-heads.net (bento d'accueil, podium du classement).
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'mc-heads.net' }],
  },

  /*
    La page des kits a été supprimée le 22/09/2026 : le serveur se présente
    par son ranked, pas par son FFA. Ses adresses ont circulé sur Discord et
    en jeu — elles renvoient vers l'accueil plutôt que sur un 404.

    Ces redirections passent AVANT le middleware de langue : la forme sans
    préfixe est donc traitée ici aussi, sinon le middleware l'enverrait vers
    /en/kits, qui n'existe plus.
  */
  async redirects() {
    return [
      { source: '/kits', destination: '/', permanent: true },
      { source: '/kits/:chemin*', destination: '/', permanent: true },
      { source: '/:langue(en|fr)/kits', destination: '/:langue', permanent: true },
      { source: '/:langue(en|fr)/kits/:chemin*', destination: '/:langue', permanent: true },
    ]
  },
}

export default nextConfig
