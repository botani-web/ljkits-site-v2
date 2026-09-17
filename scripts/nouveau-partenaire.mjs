/**
 * Crée (ou met à jour) un partenaire / streameur et son mot de passe.
 *
 *   node --env-file=.env scripts/nouveau-partenaire.mjs <slug> "<Nom>" <hote>
 *   node --env-file=.env scripts/nouveau-partenaire.mjs sixela "Sixela" sixela.ljkits.eu --ecrire
 *
 * Options :
 *   --ecrire          applique (sans lui, le script montre seulement ce qu'il ferait)
 *   --mot-de-passe=…  impose un mot de passe au lieu d'en tirer un au hasard
 *   --desactiver      ferme l'accès du partenaire (les chiffres restent en base)
 *   --activer         le rouvre
 *
 * LE MOT DE PASSE N'EST AFFICHÉ QU'UNE FOIS. Seul son hash bcrypt part en
 * base : personne, pas même l'admin, ne peut le relire ensuite. Perdu =
 * relancer ce script pour en tirer un nouveau.
 *
 * ⚠ Il faut un compte qui a le droit d'écrire dans `partenaire`, donc le
 * DATABASE_URL du site (neondb_owner) — pas celui du serveur Minecraft.
 *
 * Après création, l'espace du partenaire est sur :
 *   https://ljkits.eu/fr/partenaire/<slug>   (et /en/… en anglais)
 * et il reste à faire pointer <hote> sur l'IP du serveur, côté DNS.
 */
import { randomInt } from 'node:crypto'

import { hash } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const arguments_ = process.argv.slice(2)
const option = (nom) => arguments_.find((a) => a.startsWith(`--${nom}=`))?.split('=').slice(1).join('=')
const drapeau = (nom) => arguments_.includes(`--${nom}`)
const positionnels = arguments_.filter((a) => !a.startsWith('--'))

const ECRIRE = drapeau('ecrire')
const [slug, nom, hote] = positionnels

if (!slug || !nom || !hote) {
  console.error(
    'Usage : node --env-file=.env scripts/nouveau-partenaire.mjs <slug> "<Nom>" <hote> [--ecrire]',
  )
  process.exit(1)
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error(`Slug invalide : « ${slug} ». Minuscules, chiffres et tirets uniquement.`)
  process.exit(1)
}

/**
 * Un mot de passe lisible à l'oral : pas de I/l/0/O, quatre groupes de quatre.
 * ~62 bits d'entropie, largement assez pour une page de consultation protégée
 * par ailleurs contre le bourrage de tentatives.
 */
function motDePasseAuHasard() {
  const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
  const groupe = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  return [groupe(), groupe(), groupe(), groupe()].join('-')
}

const motDePasse = option('mot-de-passe') ?? motDePasseAuHasard()
const actif = drapeau('desactiver') ? false : true

console.log(`Partenaire : ${nom}  (slug « ${slug} », hôte « ${hote} », ${actif ? 'actif' : 'désactivé'})`)

if (!ECRIRE) {
  console.log('\nAperçu seulement : rien n’a été écrit. Relance avec --ecrire.')
  await prisma.$disconnect()
  process.exit(0)
}

const motDePasseHash = await hash(motDePasse, 10)

await prisma.partenaire.upsert({
  where: { slug },
  update: { nom, hote, motDePasseHash, actif },
  create: { slug, nom, hote, motDePasseHash, actif },
})

console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║  MOT DE PASSE — affiché une seule fois, note-le maintenant.  ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log(`\n    ${motDePasse}\n`)
console.log(`Espace : /fr/partenaire/${slug}  ·  /en/partenaire/${slug}`)

await prisma.$disconnect()
