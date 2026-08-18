import { z } from 'zod'

/**
 * Schémas de validation zod.
 *
 * Ils sont appliqués DANS les Server Actions, côté serveur : les attributs
 * `required` du HTML sont un confort pour l'utilisateur, pas une sécurité.
 */

/** Un slug d'URL : minuscules, chiffres, tirets simples. */
const slug = z
  .string()
  .trim()
  .min(1, 'Le slug est obligatoire.')
  .max(60, 'Le slug est trop long (60 caractères maximum).')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Le slug ne peut contenir que des minuscules, des chiffres et des tirets.',
  )

/** Champ texte facultatif : une chaîne vide est enregistrée comme null. */
const texteFacultatif = z
  .string()
  .trim()
  .transform((valeur) => (valeur === '' ? null : valeur))

export const schemaKit = z.object({
  slug,
  nom: z.string().trim().min(1, 'Le nom est obligatoire.').max(40, 'Nom trop long.'),
  kanji: texteFacultatif.pipe(
    z.string().max(6, 'Le kanji ne doit faire que quelques caractères.').nullable(),
  ),
  role: z.string().trim().min(1, 'Le rôle est obligatoire.').max(40, 'Rôle trop long.'),
  descriptionCourte: z
    .string()
    .trim()
    .min(1, 'La description courte est obligatoire.')
    .max(300, 'La description courte dépasse 300 caractères.'),
  descriptionLongue: z.string().trim().min(1, 'La description longue est obligatoire.'),
  prixCoins: z
    .number({ error: 'Le prix en coins doit être un nombre.' })
    .int('Le prix en coins doit être un nombre entier.')
    .min(0, 'Le prix en coins ne peut pas être négatif.'),
  prixEurosCentimes: z
    .number({ error: 'Le prix en euros est invalide.' })
    .int()
    .min(0, 'Le prix en euros ne peut pas être négatif.')
    .nullable(),
  type: z.enum(['GRATUIT', 'EXCLUSIF'], { error: 'Type de kit inconnu.' }),
  visible: z.boolean(),
  achetable: z.boolean(),
  bientot: z.boolean(),
  kitDeDepart: z.boolean(),
  /**
   * Les lignes de la fiche technique, déjà appariées libellé/valeur.
   * Les lignes entièrement vides sont écartées en amont (cf. actions/kits.ts) :
   * si une ligne arrive ici, c'est qu'elle est à moitié remplie, donc en erreur.
   */
  caracteristiques: z
    .array(
      z.object({
        libelle: z
          .string()
          .trim()
          .min(1, 'Chaque caractéristique doit avoir un libellé et une valeur.')
          .max(30, 'Libellé trop long (30 caractères maximum).'),
        valeur: z
          .string()
          .trim()
          .min(1, 'Chaque caractéristique doit avoir un libellé et une valeur.')
          .max(60, 'Valeur trop longue (60 caractères maximum).'),
      }),
    )
    .max(8, 'Huit caractéristiques au maximum par kit.'),
})

export type DonneesKit = z.infer<typeof schemaKit>

export const schemaSection = z.object({
  titre: z
    .string()
    .trim()
    .min(1, 'Le titre est obligatoire.')
    .max(120, 'Le titre dépasse 120 caractères.'),
  contenu: z.string().trim().min(1, 'Le contenu est obligatoire.'),
  publie: z.boolean(),
})

export type DonneesSection = z.infer<typeof schemaSection>

export const schemaConnexion = z.object({
  email: z.email('Adresse e-mail invalide.'),
  motDePasse: z.string().min(1, 'Le mot de passe est obligatoire.'),
})
