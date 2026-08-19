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
  /** Commande console de livraison, avec {pseudo} comme marqueur. */
  commandeLivraison: z.string().trim().max(2000, 'Commande de livraison trop longue.'),
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

/* -------------------------------------------------------------------------- */
/* BOUTIQUE                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Prix en euros saisi dans l'admin, converti en centimes.
 * La conversion est faite en amont par eurosVersCentimes() ; ici on ne fait
 * que valider le résultat (NaN = saisie illisible).
 */
const prixCentimesObligatoire = z
  .number({ error: 'Le prix est invalide.' })
  .int('Le prix doit être un nombre entier de centimes.')
  .min(0, 'Le prix ne peut pas être négatif.')

export const schemaGrade = z.object({
  slug,
  nom: z.string().trim().min(1, 'Le nom est obligatoire.').max(40, 'Nom trop long.'),
  kanji: texteFacultatif.pipe(z.string().max(6, 'Kanji trop long.').nullable()),
  sousTitre: texteFacultatif.pipe(z.string().max(60, 'Sous-titre trop long.').nullable()),
  etiquette: texteFacultatif.pipe(
    z.string().max(30, 'Étiquette trop longue (30 caractères maximum).').nullable(),
  ),
  prixEurosCentimes: prixCentimesObligatoire,
  visible: z.boolean(),
  achetable: z.boolean(),
  heriteDuPrecedent: z.boolean(),
  commandeLivraison: z.string().trim().max(2000, 'Commande de livraison trop longue.'),
  avantages: z
    .array(z.string().trim().min(1, 'Un avantage vide n’a pas de sens.').max(120))
    .max(12, 'Douze avantages au maximum par grade.'),
})

export type DonneesGrade = z.infer<typeof schemaGrade>

export const schemaPack = z.object({
  slug,
  nom: z.string().trim().min(1, 'Le nom est obligatoire.').max(60, 'Nom trop long.'),
  description: z
    .string()
    .trim()
    .min(1, 'La description est obligatoire.')
    .max(300, 'Description trop longue.'),
  prixEurosCentimes: prixCentimesObligatoire,
  prixBarreCentimes: z
    .number({ error: 'Le prix barré est invalide.' })
    .int()
    .min(0, 'Le prix barré ne peut pas être négatif.')
    .nullable(),
  visible: z.boolean(),
  achetable: z.boolean(),
  commandeLivraison: z.string().trim().max(2000, 'Commande de livraison trop longue.'),
  /// Les ids des kits inclus, cochés dans le formulaire.
  kitIds: z.array(z.string().min(1)).max(30, 'Trente kits au maximum par pack.'),
})

export type DonneesPack = z.infer<typeof schemaPack>

/**
 * Le formulaire public de commande.
 *
 * C'est la seule entrée non authentifiée du site : elle est donc la plus
 * strictement validée. Le panier ne transporte QUE des identifiants, les prix
 * sont relus en base (cf. src/actions/commandes.ts).
 */
export const schemaCommande = z.object({
  pseudoMinecraft: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9_]{3,16}$/,
      'Pseudo invalide : 3 à 16 caractères, lettres, chiffres et _ uniquement.',
    ),
  articles: z
    .array(
      z.object({
        type: z.enum(['KIT', 'GRADE', 'PACK'], { error: 'Type d’article inconnu.' }),
        slug,
      }),
    )
    .min(1, 'Ton panier est vide.')
    .max(10, 'Dix articles au maximum par commande.'),
})

export type DonneesCommande = z.infer<typeof schemaCommande>
