/**
 * Crée une nouvelle migration à partir de l'écart entre la base et le schéma.
 *
 *   npm run db:migrate:new -- ajoute-champ-machin
 *
 * Pourquoi ce script plutôt que `prisma migrate dev` : `migrate dev` a besoin
 * d'une « shadow database » qu'il crée et détruit lui-même, ce que Neon
 * n'autorise pas sur l'endpoint mutualisé. On compare donc directement la base
 * au schéma, ce qui ne demande aucune base supplémentaire.
 *
 * Conséquence à connaître : le SQL produit décrit l'écart avec la base
 * ACTUELLE. Elle doit donc être à jour de toutes les migrations précédentes —
 * lance `npm run db:migrate` avant, si tu as un doute.
 *
 * GARDE-FOU : le script REFUSE d'écrire une migration destructrice (DROP TABLE,
 * DROP COLUMN, DROP INDEX) sans `--force`. C'est exactement ce type d'opération
 * qui avait supprimé la table `joueur`.
 */
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const arguments_ = process.argv.slice(2)
const force = arguments_.includes('--force')
const nom = arguments_.find((a) => !a.startsWith('--'))

if (!nom) {
  console.error('Nom de migration manquant.\n  npm run db:migrate:new -- ajoute-champ-machin')
  process.exit(1)
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(nom)) {
  console.error(`Nom invalide : « ${nom} ». Minuscules, chiffres et tirets uniquement.`)
  process.exit(1)
}

/* ---- l'écart entre la base et le schéma ---- */
let sql
try {
  // Commande entièrement littérale : aucune donnée utilisateur n'y entre.
  sql = execSync(
    'npx prisma migrate diff' +
      ' --from-schema-datasource prisma/schema.prisma' +
      ' --to-schema-datamodel prisma/schema.prisma' +
      ' --script',
    { encoding: 'utf8' },
  )
} catch (erreur) {
  console.error('Impossible de calculer l’écart avec la base :')
  console.error(erreur.stdout || erreur.message)
  process.exit(1)
}

if (sql.includes('This is an empty migration')) {
  console.log('La base est déjà conforme au schéma : aucune migration à créer.')
  process.exit(0)
}

/* ---- garde-fou anti-destruction ---- */
const destructrices = ['DROP TABLE', 'DROP COLUMN', 'DROP INDEX', 'DROP CONSTRAINT']
const trouvees = destructrices.filter((motif) => sql.toUpperCase().includes(motif))

if (trouvees.length > 0 && !force) {
  console.error('\n⛔ MIGRATION DESTRUCTRICE — rien n’a été écrit.\n')
  console.error(`Opérations détectées : ${trouvees.join(', ')}\n`)
  console.error(sql)
  console.error(
    '\nSi c’est bien ce que tu veux, relance avec --force :\n' +
      `  npm run db:migrate:new -- ${nom} --force\n\n` +
      'Avant ça, vérifie qu’aucun objet de la base ne manque au schéma : une\n' +
      'table ou un index géré par le serveur Minecraft et absent de\n' +
      'prisma/schema.prisma apparaîtrait ici comme un DROP.',
  )
  process.exit(1)
}

/* ---- écriture ---- */
const horodatage = new Date()
  .toISOString()
  .replace(/[-:T]/g, '')
  .slice(0, 14)

const dossier = join('prisma', 'migrations', `${horodatage}_${nom}`)
mkdirSync(dossier, { recursive: true })
writeFileSync(join(dossier, 'migration.sql'), sql, 'utf8')

console.log(`Migration écrite : ${join(dossier, 'migration.sql')}\n`)
console.log(sql)
console.log('Relis ce SQL, puis applique-le avec :\n  npm run db:migrate')
