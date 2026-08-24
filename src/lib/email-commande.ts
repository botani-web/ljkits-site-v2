/**
 * Le gabarit des notifications de commande, à la direction artistique du site.
 *
 * Trois contraintes propres à l'e-mail, qui expliquent le style du code :
 *
 *  1. Mise en page en <table>, pas en flex ni grid : Outlook rend le HTML avec
 *     le moteur de Word, qui ignore la plupart des dispositions modernes.
 *  2. Styles EN LIGNE : Gmail supprime les <style> dans certains contextes.
 *  3. Polices système. Bungee et Outfit sont chargées par next/font sur le
 *     site, mais aucun client mail ne téléchargera une police distante — on
 *     donne donc une pile système, en gardant la graisse et la casse qui font
 *     l'identité LJKITS.
 */
import { formaterEuros, formaterNumeroCommande } from '@/lib/format'

/** La palette du site, reprise de globals.css. */
const C = {
  nuit: '#0e061f',
  charbon: '#171029',
  bord: '#2e2245',
  soupe: '#fe9301',
  or: '#fdc003',
  creme: '#f2e8d9',
  gris: '#9e93ac',
  vert: '#5be06b',
  rouge: '#e05b5b',
}

const PILE_TITRE =
  "'Trebuchet MS', 'Segoe UI', Tahoma, sans-serif"
const PILE_CORPS = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const PILE_MONO = "'Consolas', 'SF Mono', Menlo, monospace"

export type LigneCourriel = {
  libelle: string
  type: string
  prixCentimes: number
}

export type CommandeCourriel = {
  id: string
  numero: number
  pseudoMinecraft: string
  montantTotalCentimes: number
  statut: string
  createdAt: Date
  transactionTebex: string | null
  lignes: LigneCourriel[]
}

/** Date et heure en français, fuseau de Paris — celui du serveur de jeu. */
function dateHeure(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(date)
}

/** Empêche qu'un pseudo contenant des chevrons ne casse le HTML de l'e-mail. */
function echapper(texte: string): string {
  return texte
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Le bandeau de statut : couleur et libellé. */
function apparenceStatut(statut: string): { libelle: string; couleur: string } {
  switch (statut) {
    case 'LIVREE':
      return { libelle: 'Payée et livrée', couleur: C.vert }
    case 'PAYEE':
      return { libelle: 'Payée', couleur: C.vert }
    case 'EN_ATTENTE':
      return { libelle: 'En attente de paiement', couleur: C.soupe }
    case 'ECHOUEE':
      return { libelle: 'Paiement échoué', couleur: C.rouge }
    case 'REMBOURSEE':
      return { libelle: 'Remboursée', couleur: C.rouge }
    case 'LITIGE':
      return { libelle: 'Litige ouvert', couleur: C.rouge }
    default:
      return { libelle: statut, couleur: C.gris }
  }
}

function ligneInfo(intitule: string, valeur: string, mono = false): string {
  return `
    <tr>
      <td style="padding:7px 0;border-bottom:1px solid ${C.bord};color:${C.gris};font-size:13px;font-family:${PILE_CORPS};">${intitule}</td>
      <td style="padding:7px 0;border-bottom:1px solid ${C.bord};color:${C.creme};font-size:14px;text-align:right;font-family:${mono ? PILE_MONO : PILE_CORPS};">${valeur}</td>
    </tr>`
}

/**
 * Construit le courriel d'une commande.
 *
 * `nouvelle` distingue les deux moments : la commande vient d'être créée
 * (panier validé, pas encore payé), ou son paiement vient d'aboutir. Le corps
 * est le même — c'est le titre et le sujet qui changent, pour que la boîte de
 * réception reste lisible d'un coup d'œil.
 */
export function courrielDeCommande(
  commande: CommandeCourriel,
  nouvelle: boolean,
  urlSite: string,
) {
  const numero = formaterNumeroCommande(commande.numero)
  const statut = apparenceStatut(commande.statut)
  const pseudo = echapper(commande.pseudoMinecraft)
  const total = formaterEuros(commande.montantTotalCentimes)

  const titre = nouvelle ? 'Nouvelle commande' : 'Paiement confirmé'
  const sujet = nouvelle
    ? `${numero} · nouvelle commande de ${commande.pseudoMinecraft} — ${total}`
    : `${numero} · paiement confirmé de ${commande.pseudoMinecraft} — ${total}`

  const articles = commande.lignes
    .map(
      (ligne) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid ${C.bord};font-family:${PILE_CORPS};">
          <span style="color:${C.creme};font-size:14px;">${echapper(ligne.libelle)}</span>
          <span style="color:${C.gris};font-size:11px;letter-spacing:1px;text-transform:uppercase;font-family:${PILE_MONO};"> &nbsp;${ligne.type}</span>
        </td>
        <td style="padding:9px 0;border-bottom:1px solid ${C.bord};color:${C.gris};font-size:14px;text-align:right;font-family:${PILE_MONO};">${formaterEuros(ligne.prixCentimes)}</td>
      </tr>`,
    )
    .join('')

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titre} ${numero}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.nuit};">
  <!-- Texte d'aperçu : ce que la boîte de réception affiche sous le sujet. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${pseudo} · ${total} · ${statut.libelle}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.nuit};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${C.charbon};border:1px solid ${C.bord};border-radius:14px;overflow:hidden;">

          <!-- Bandeau -->
          <tr>
            <td style="padding:22px 26px 18px;border-bottom:1px solid ${C.bord};">
              <p style="margin:0 0 4px;font-family:${PILE_MONO};font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:${C.soupe};">LJKITS</p>
              <h1 style="margin:0;font-family:${PILE_TITRE};font-size:23px;font-weight:bold;letter-spacing:.5px;text-transform:uppercase;color:${C.creme};">${titre}</h1>
              <p style="margin:8px 0 0;font-family:${PILE_MONO};font-size:13px;color:${C.gris};">
                ${numero}
                &nbsp;·&nbsp;
                <span style="color:${statut.couleur};font-weight:bold;">${statut.libelle}</span>
              </p>
            </td>
          </tr>

          <!-- Montant -->
          <tr>
            <td style="padding:22px 26px 6px;" align="center">
              <p style="margin:0;font-family:${PILE_TITRE};font-size:38px;font-weight:bold;color:${C.or};">${total}</p>
              <p style="margin:4px 0 0;font-family:${PILE_CORPS};font-size:14px;color:${C.gris};">
                pour <strong style="color:${C.creme};">${pseudo}</strong>
              </p>
            </td>
          </tr>

          <!-- Informations -->
          <tr>
            <td style="padding:20px 26px 0;">
              <p style="margin:0 0 6px;font-family:${PILE_MONO};font-size:10px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:${C.gris};">Informations</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${ligneInfo('Pseudo Minecraft', pseudo, true)}
                ${ligneInfo('Date et heure', dateHeure(commande.createdAt))}
                ${ligneInfo('Numéro', numero, true)}
                ${
                  commande.transactionTebex
                    ? ligneInfo('Transaction Tebex', echapper(commande.transactionTebex), true)
                    : ''
                }
              </table>
            </td>
          </tr>

          <!-- Articles -->
          <tr>
            <td style="padding:20px 26px 0;">
              <p style="margin:0 0 6px;font-family:${PILE_MONO};font-size:10px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;color:${C.gris};">Contenu · ${commande.lignes.length} article${commande.lignes.length > 1 ? 's' : ''}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${articles}
                <tr>
                  <td style="padding:12px 0 0;font-family:${PILE_CORPS};font-size:14px;color:${C.gris};">Total</td>
                  <td style="padding:12px 0 0;font-family:${PILE_TITRE};font-size:19px;font-weight:bold;color:${C.or};text-align:right;">${total}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bouton -->
          <tr>
            <td style="padding:26px;" align="center">
              <a href="${urlSite}/admin/commandes/${commande.id}"
                 style="display:inline-block;padding:13px 26px;background-color:${C.soupe};color:${C.nuit};font-family:${PILE_MONO};font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:8px;">
                Ouvrir dans l’admin
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 26px 24px;" align="center">
              <p style="margin:0;font-family:${PILE_CORPS};font-size:12px;color:${C.gris};line-height:1.5;">
                ${
                  nouvelle
                    ? 'La commande n’est pas encore payée. Tu recevras un second message si le paiement aboutit.'
                    : 'Le contenu a été remis au joueur par le plugin Tebex.'
                }
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:16px 0 0;font-family:${PILE_CORPS};font-size:11px;color:${C.gris};">
          Notification automatique de ${urlSite.replace(/^https?:\/\//, '')}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const texte = [
    `${titre.toUpperCase()} — ${numero}`,
    '',
    `Statut  : ${statut.libelle}`,
    `Pseudo  : ${commande.pseudoMinecraft}`,
    `Date    : ${dateHeure(commande.createdAt)}`,
    `Total   : ${total}`,
    commande.transactionTebex ? `Tebex   : ${commande.transactionTebex}` : null,
    '',
    `Contenu (${commande.lignes.length}) :`,
    ...commande.lignes.map(
      (l) => `  - ${l.libelle} [${l.type}] ${formaterEuros(l.prixCentimes)}`,
    ),
    '',
    `Admin : ${urlSite}/admin/commandes/${commande.id}`,
  ]
    .filter((ligne) => ligne !== null)
    .join('\n')

  return { sujet, html, texte }
}
