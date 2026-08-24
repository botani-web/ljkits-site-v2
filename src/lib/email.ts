/**
 * Envoi d'e-mails, via l'API HTTP de Resend.
 *
 * Pas de SDK : `src/lib/tebex.ts` parle déjà à Tebex en HTTP direct, on garde
 * la même façon de faire. Une dépendance de moins à suivre, et le corps de la
 * requête reste lisible.
 *
 * RÈGLE ABSOLUE : un e-mail qui échoue ne doit JAMAIS faire échouer ce qui l'a
 * déclenché. Un webhook Tebex qui renverrait 500 parce que Resend est en panne
 * ferait réessayer Tebex en boucle, et pire, laisserait la commande dans un
 * état incohérent. Toutes les fonctions d'ici avalent donc leurs erreurs et se
 * contentent de les journaliser.
 */

const URL_API = 'https://api.resend.com/emails'

/**
 * L'expéditeur, déduit du domaine que l'intégration Vercel a provisionné.
 *
 * `RESEND_EMAIL_DOMAIN` est posée automatiquement par l'intégration. Tant que
 * ce domaine n'est pas vérifié chez Resend (enregistrements DKIM et SPF dans
 * le DNS), l'envoi est refusé en 403 — et le domaine de test `resend.dev` ne
 * sauve pas la mise : il n'autorise l'envoi QUE vers l'adresse du compte
 * Resend, pas vers admin@ljkits.eu. La vérification DNS est donc le seul
 * chemin, et une fois faite il n'y a rien d'autre à configurer ici.
 *
 * `EMAIL_EXPEDITEUR` reste disponible pour forcer une autre adresse.
 */
function expediteur(): string {
  const force = process.env.EMAIL_EXPEDITEUR?.trim()
  if (force) return force

  const domaine = process.env.RESEND_EMAIL_DOMAIN?.trim()
  return domaine ? `LJKITS <notifications@${domaine}>` : 'LJKITS <onboarding@resend.dev>'
}

/** Destinataire des notifications d'administration. */
const DESTINATAIRE = process.env.EMAIL_ADMIN ?? 'admin@ljkits.eu'

export type Courriel = {
  sujet: string
  html: string
  /** Version texte, pour les clients qui refusent le HTML et pour l'anti-spam. */
  texte: string
}

/**
 * Envoie un courriel à l'administrateur.
 * Renvoie `true` si Resend l'a accepté, `false` dans tous les autres cas.
 */
export async function envoyerAAdmin(courriel: Courriel): Promise<boolean> {
  const cle = process.env.RESEND_API_KEY

  if (!cle || cle.trim() === '') {
    console.warn('[email] RESEND_API_KEY absente : notification ignorée.')
    return false
  }

  try {
    const reponse = await fetch(URL_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cle.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: expediteur(),
        to: [DESTINATAIRE],
        subject: courriel.sujet,
        html: courriel.html,
        text: courriel.texte,
      }),
    })

    if (!reponse.ok) {
      // Le corps d'erreur de Resend est explicite (domaine non vérifié,
      // destinataire refusé…) : il mérite d'apparaître dans les logs.
      const detail = await reponse.text()
      console.error(`[email] Resend a refusé (HTTP ${reponse.status}) : ${detail.slice(0, 300)}`)
      return false
    }

    return true
  } catch (erreur) {
    console.error('[email] envoi impossible :', erreur)
    return false
  }
}
