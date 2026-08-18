import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Les images distantes utilisées par le site : les têtes et corps de skins
  // Minecraft servis par mc-heads.net (bento d'accueil, podium du classement).
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'mc-heads.net' }],
  },
}

export default nextConfig
