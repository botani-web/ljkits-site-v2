import { redirect } from 'next/navigation'

/** /admin n'a pas de contenu propre : on entre par la gestion des kits. */
export default function PageAdmin() {
  redirect('/admin/kits')
}
