import { redirect } from 'next/navigation'

/**
 * L'ancienne page de statistiques a fusionné avec le tableau de bord d'accueil.
 * On garde cette redirection pour ne casser aucun marque-page ni lien existant.
 */
export default function PageStats() {
  redirect('/admin')
}
