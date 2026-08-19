/**
 * Construction des commandes console à exécuter pour livrer une commande.
 *
 * Chaque article vendu porte un champ `commandeLivraison`, éditable dans
 * l'admin, qui contient une ou plusieurs commandes — une par ligne — avec
 * `{pseudo}` comme marqueur.
 *
 *   Kit Kenshi        →  kitadmin add {pseudo} kenshi
 *   Grade Ronin       →  lp user {pseudo} parent add ronin
 *   Pack des six kits →  kitadmin add {pseudo} yumi
 *                        kitadmin add {pseudo} kitsune
 *                        …
 *
 * En phase 2, ces commandes sont AFFICHÉES dans le détail d'une commande :
 * on les copie dans la console du serveur, puis on marque la commande comme
 * livrée. En phase 3, le worker RCON consommera exactement cette fonction.
 */

/** Le marqueur remplacé par le pseudo de livraison. */
const MARQUEUR_PSEUDO = '{pseudo}'

/**
 * Un pseudo Minecraft valide ne contient que [A-Za-z0-9_] — c'est vérifié à
 * la création de la commande. Ce garde-fou évite malgré tout qu'un pseudo
 * douteux, arrivé par un autre chemin, ne s'insère dans une commande console.
 */
function pseudoSur(pseudo: string) {
  return /^[A-Za-z0-9_]{3,16}$/.test(pseudo)
}

type LigneLivrable = {
  libelle: string
  commandeLivraison: string
}

/**
 * Renvoie la liste à plat des commandes à exécuter, dans l'ordre des lignes.
 * Les lignes sans commande configurée sont signalées plutôt qu'ignorées :
 * mieux vaut voir « rien à faire » que croire à un oubli.
 */
export function construireCommandes(
  lignes: LigneLivrable[],
  pseudo: string,
): { libelle: string; commandes: string[] }[] {
  if (!pseudoSur(pseudo)) {
    throw new Error(`Pseudo invalide, refus de construire les commandes : ${pseudo}`)
  }

  return lignes.map((ligne) => ({
    libelle: ligne.libelle,
    commandes: ligne.commandeLivraison
      .split('\n')
      .map((commande) => commande.trim())
      .filter((commande) => commande !== '')
      .map((commande) => commande.replaceAll(MARQUEUR_PSEUDO, pseudo)),
  }))
}

/** Toutes les commandes d'une commande client, à la suite, prêtes à copier. */
export function commandesAPlat(lignes: LigneLivrable[], pseudo: string): string[] {
  return construireCommandes(lignes, pseudo).flatMap((ligne) => ligne.commandes)
}
