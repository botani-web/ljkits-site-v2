import type { CleTexte } from '@/lib/i18n'

/**
 * LES ONGLETS DU RÈGLEMENT.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  POURQUOI DES ONGLETS PLUTÔT QU'UNE PAGE QUI DÉFILE
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Un règlement de dix-sept sections lu en défilant, personne ne le lit — et
 * un règlement que personne n'a lu ne protège de rien. Le jour où le premier
 * du classement est écarté, la seule chose qui compte est qu'il ait pu
 * trouver la règle **avant**, en trois secondes, sans faire défiler.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  UN SLUG EN BASE, DEUX LIBELLÉS ICI
 * ═══════════════════════════════════════════════════════════════════════
 *
 * La colonne `categorie` de `SectionReglement` stocke le slug ("ranked"), pas
 * le libellé. La page est bilingue : garder le libellé en base obligerait à
 * une colonne `categorieEn` et à la retraduire à chaque section. Ici, une
 * seule table pour les deux langues.
 *
 * L'ORDRE DE CE TABLEAU EST L'ORDRE DES ONGLETS, et il n'est pas neutre :
 * il va de ce que le joueur vient chercher (comment ça marche, comment on
 * gagne) vers ce qu'il consultera en cas de litige.
 */
export const CATEGORIES_REGLEMENT = [
  { slug: 'ranked', cleTexte: 'reglement.cat.ranked' },
  { slug: 'modes', cleTexte: 'reglement.cat.modes' },
  { slug: 'cashprize', cleTexte: 'reglement.cat.cashprize' },
  { slug: 'integrite', cleTexte: 'reglement.cat.integrite' },
  { slug: 'sanctions', cleTexte: 'reglement.cat.sanctions' },
  { slug: 'serveur', cleTexte: 'reglement.cat.serveur' },
] as const satisfies ReadonlyArray<{ slug: string; cleTexte: CleTexte }>

export type CategorieReglement = (typeof CATEGORIES_REGLEMENT)[number]['slug']

/** Le premier onglet : le repli quand une section porte un slug inconnu. */
export const CATEGORIE_DEFAUT: CategorieReglement = CATEGORIES_REGLEMENT[0].slug

/**
 * Range un slug venu de la base dans un onglet existant.
 *
 * Une valeur inconnue — une catégorie supprimée, une faute de frappe dans
 * l'admin — retombe sur le premier onglet AU LIEU DE DISPARAÎTRE. Une section
 * de règlement invisible est un piège : elle s'applique sans être lisible.
 */
export function categorieValide(brut: string | null | undefined): CategorieReglement {
  const trouvee = CATEGORIES_REGLEMENT.find((c) => c.slug === brut)
  return trouvee ? trouvee.slug : CATEGORIE_DEFAUT
}
