/**
 * Authentification des tâches planifiées.
 *
 * Quand la variable d'environnement CRON_SECRET est définie, Vercel ajoute
 * automatiquement l'en-tête « Authorization: Bearer <CRON_SECRET> » à chaque
 * appel de cron. On vérifie donc simplement cet en-tête : sans le secret, la
 * route reste publique en apparence mais ne fait rien d'utile.
 *
 * En l'absence de secret configuré, on REFUSE par défaut : mieux vaut un cron
 * qui ne tourne pas qu'une route ouverte à tous.
 */
export function requeteCronAutorisee(requete: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return requete.headers.get('authorization') === `Bearer ${secret}`
}
