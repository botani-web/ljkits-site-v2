import { Marked, Renderer } from 'marked'

/**
 * Rendu Markdown → HTML pour le règlement et les descriptions longues de kits.
 *
 * Deux règles de sécurité, parce que le résultat est injecté avec
 * dangerouslySetInnerHTML :
 *
 *  1. Le HTML brut n'est JAMAIS interprété. `marked` route les balises
 *     écrites à la main (inline comme bloc) vers le rendu `html` : on
 *     l'écrase pour renvoyer le texte échappé. Taper <script> dans l'admin
 *     affiche donc littéralement "<script>", ça n'exécute rien.
 *
 *  2. Les liens sont limités aux schémas sûrs. Un lien Markdown
 *     [x](javascript:...) est neutralisé.
 *
 * Le compte admin est unique et c'est moi : ces garde-fous sont une
 * ceinture-bretelles, pas une protection contre un attaquant déjà connecté.
 */

/** Échappe les cinq caractères qui ont un sens en HTML. */
function echapper(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Un lien est accepté s'il est relatif, ou s'il utilise http/https/mailto. */
function lienSur(href: string): boolean {
  const nettoye = href.trim().toLowerCase()
  if (nettoye.startsWith('/') || nettoye.startsWith('#')) return true
  return /^(https?:|mailto:)/.test(nettoye)
}

const moteur = new Marked({
  gfm: true, // tableaux, listes de tâches, barré…
  breaks: true, // un simple retour à la ligne devient un <br>
})

moteur.use({
  renderer: {
    // Règle 1 : tout token HTML est recraché en texte échappé.
    html({ text }) {
      return echapper(text)
    },
    /**
     * Un tableau est enveloppé dans un conteneur qui défile.
     *
     * Un tableau Markdown n'a aucune largeur maximale : trois colonnes de
     * texte suffisent à faire déborder un téléphone à 360 px. Le CSS seul ne
     * peut pas régler ça sans casser la mise en page du tableau (`display:
     * block` sur un <table> lui fait perdre son `width: 100%`) — il faut un
     * parent. D'où cette surcharge plutôt qu'une règle dans globals.css.
     *
     * On délègue le rendu du tableau lui-même au renderer d'origine : rien à
     * réimplémenter, et les alignements de colonnes de GFM restent gérés.
     */
    table(token) {
      return `<div class="tableau-defilant">${Renderer.prototype.table.call(this, token)}</div>`
    },
    // Règle 2 : les liens dangereux perdent leur href.
    link({ href, title, tokens }) {
      const contenu = this.parser.parseInline(tokens)
      if (!lienSur(href)) return contenu
      const attrTitre = title ? ` title="${echapper(title)}"` : ''
      const externe = /^https?:/.test(href.trim())
        ? ' target="_blank" rel="noopener noreferrer"'
        : ''
      return `<a href="${echapper(href)}"${attrTitre}${externe}>${contenu}</a>`
    },
  },
})

/**
 * Marqueurs remplacés avant le rendu.
 *
 * Même idée que le {pseudo} des commandes de livraison : le règlement et les
 * descriptions de kits peuvent écrire {discord} plutôt que de recopier l'URL.
 * Changer le lien dans /admin/reglages le met alors à jour partout, sans avoir
 * à rouvrir chaque section.
 */
export type MarqueursMarkdown = { discord?: string }

function appliquerMarqueurs(markdown: string, marqueurs: MarqueursMarkdown): string {
  if (!marqueurs.discord) return markdown
  return markdown.replaceAll('{discord}', marqueurs.discord)
}

/** Convertit du Markdown en HTML prêt à être injecté. */
export function markdownVersHtml(
  markdown: string,
  marqueurs: MarqueursMarkdown = {},
): string {
  return moteur.parse(appliquerMarqueurs(markdown, marqueurs), { async: false })
}
