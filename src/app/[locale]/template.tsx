/**
 * LA TRANSITION ENTRE LES PAGES (refonte S2, 16/10/2026).
 *
 * Un template, contrairement à un layout, est recréé à chaque navigation : son
 * enveloppe rejoue donc l'entrée du contenu (`.transition-page main`, globals.css)
 * à chaque page ouverte. La barre de navigation, hors du <main>, ne bouge pas.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="transition-page">{children}</div>
}
