# LJKITS — site du serveur

Site public + panneau d'administration du serveur Minecraft PvP Soup **LJKITS**
([ljkits.eu](https://ljkits.eu)).

- **Next.js 15** (App Router) · **TypeScript** · **Tailwind CSS v4**
- **Prisma 6** + **PostgreSQL** (Neon)
- **NextAuth v5** (JWT, un seul compte admin)
- **marked** pour le Markdown, **zod** pour la validation
- Déploiement **Vercel**

---

## Démarrer en local

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer le fichier `.env`

Copie `.env.example` en **`.env`** (pas `.env.local` : Prisma ne lit que `.env`,
et Next.js lit les deux — un seul fichier suffit donc pour les deux outils).

```bash
cp .env.example .env
```

Puis remplis les valeurs :

| Variable | À quoi ça sert |
|---|---|
| `DATABASE_URL` | Chaîne de connexion Neon **pooled** (celle qui contient `-pooler`) |
| `AUTH_SECRET` | Signature des jetons de session. Générer avec `npx auth secret` |
| `NEXT_PUBLIC_SITE_URL` | URL publique, pour les métadonnées Open Graph absolues |
| `ADMIN_EMAIL` | E-mail du compte admin (utilisé **uniquement** par le seed) |
| `ADMIN_MOT_DE_PASSE` | Mot de passe du compte admin (utilisé **uniquement** par le seed) |

### 3. Créer les tables et peupler la base

```bash
npm run db:push    # crée les tables d'après prisma/schema.prisma
npm run db:seed    # 21 kits, 3 grades, 1 pack, 7 sections, compte admin
```

### 4. Lancer

```bash
npm run dev        # http://localhost:3000
```

L'administration est sur **`/admin`** — connexion sur `/connexion` avec les
identifiants du seed.

---

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (lance `prisma generate` avant) |
| `npm run start` | Sert le build de production |
| `npm run db:push` | Aligne la base sur `schema.prisma`, sans migration |
| `npm run db:seed` | (Re)peuple **tout** le contenu de référence — idempotent |
| `npm run db:seed:boutique` | Peuple **uniquement** grades et packs, sans toucher aux kits ni au règlement |
| `npm run db:studio` | Interface graphique Prisma sur la base |

> ⚠ `db:seed` **réécrit** le contenu de référence : les 21 kits, leur ordre et
> les 7 sections de règlement listés dans `prisma/seed.ts` reprennent leurs
> valeurs d'origine. Les kits que tu as créés depuis l'admin ne sont pas touchés.
>
> Sur une base **déjà en service**, préfère `npm run db:seed:boutique` : il ne
> crée que les grades et les packs et laisse les kits et le règlement tels quels.
>
> Un piège à connaître : l'upsert se fait sur le **slug**. Si tu as renommé un
> kit d'origine depuis l'admin (`archer` → `archer-longue-portee`), le seed ne le
> retrouve plus et en **recrée un** sous l'ancien slug — tu te retrouves avec les
> deux. Sur une base déjà utilisée, vérifie la liste après un seed.

---

## Organisation du code

```
prisma/
  schema.prisma      modèles Kit, CaracteristiqueKit, SectionReglement, Admin
  seed.ts            contenu de référence (21 kits, règlement, admin)

src/
  app/               les routes (App Router)
    page.tsx         /             accueil
    kits/            /kits et /kits/[slug]
    reglement/       /reglement
    connexion/       formulaire de connexion admin
    admin/           panneau d'administration (protégé)
    api/auth/        point d'entrée NextAuth

  actions/           Server Actions — toute écriture en base passe par là
    garde.ts         exigerAdmin() — appelé en 1ʳᵉ ligne de chaque action
    kits.ts          créer / modifier / supprimer / déplacer / basculer un kit
    reglement.ts     idem pour les sections du règlement
    auth.ts          connexion et déconnexion

  components/
    public/          composants du site visible
    admin/           composants du panneau d'administration

  lib/
    site.ts          IP, Discord, sites de vote — tout ce qui change ici
    prisma.ts        client Prisma partagé
    auth.ts          configuration NextAuth
    markdown.ts      Markdown → HTML, HTML brut échappé
    validations.ts   schémas zod
    format.ts        formatage des prix et des dates
```

---

## Les règles à ne pas casser

### 1. `exigerAdmin()` en tête de chaque Server Action

Une Server Action est **une route HTTP à part entière**. Le fait que le
formulaire qui l'appelle soit rendu sous `/admin` ne protège rien : n'importe
qui peut rejouer la requête sans jamais charger la page. La redirection du
layout `/admin` protège l'affichage, pas les écritures.

Donc : **toute nouvelle Server Action commence par `await exigerAdmin()`**.
Seule exception, et par nécessité : `connecter()` dans `src/actions/auth.ts`,
qui est l'action qui crée la session.

### 2. `revalidatePath()` après chaque écriture

Les pages publiques sont en rendu statique. Sans revalidation, une modification
faite dans l'admin ne serait visible qu'au bout d'une heure.

Les helpers existent déjà : `revaliderPagesKits()` dans `actions/kits.ts`,
`revaliderReglement()` dans `actions/reglement.ts`.

Cas particulier du **renommage de slug** : il faut revalider l'ancien chemin
*et* le nouveau. C'est pour ça que `modifierKit()` relit le kit en base **avant**
de l'écrire — sans ça, `/kits/ancien-slug` continuerait d'être servi depuis le
cache.

---

### 3. `creerCommande` est la seule exception publique

Toutes les Server Actions commencent par `await exigerAdmin()` — sauf deux, et
pour de bonnes raisons :

- `connecter()` dans `src/actions/auth.ts` : c’est elle qui **crée** la session.
- `creerCommande()` dans `src/actions/commandes.ts` : c’est un **visiteur
  anonyme** qui commande.

Ce qui protège `creerCommande` à la place :

1. **Les prix ne viennent jamais du navigateur.** Le panier client n’envoie que
   des couples `{type, slug}` ; nom, prix et commande de livraison sont relus en
   base et le total recalculé côté serveur. Sans ça, le pack s’achèterait à un
   centime.
2. Seuls les articles `visible` **et** `achetable` sont acceptés ; les kits
   `bientot` sont refusés.
3. Le pseudo est revalidé par zod : 3 à 16 caractères, `[A-Za-z0-9_]` uniquement.
4. Panier plafonné à 10 articles, doublons écartés.
5. Garde-fou anti-abus : refus si le même pseudo (à la casse près) a déjà
   3 commandes `EN_ATTENTE` créées dans la dernière heure.

**Si tu ajoutes une action publique un jour, reprends ces cinq points.**

### 4. Limitation de débit à activer côté Vercel

Le garde-fou du point 3 est par pseudo : il ne bloque pas un script qui change
de pseudo à chaque requête. Le complément se règle dans le pare-feu Vercel,
sans code ni dépendance.

*Project → Firewall → Custom Rules → New Rule*

| Champ | Valeur |
|---|---|
| Nom | `Limite commandes boutique` |
| Condition 1 | Request Path — Equals — `/boutique` |
| Condition 2 | Request Method — Equals — `POST` |
| Action | Rate Limit |
| Requêtes / fenêtre | 10 par 60 s |
| Clé | IP Address |
| Dépassement | Deny (ou Challenge pour laisser une chance) |

Les Server Actions sont des `POST` vers l’URL de la page : cette règle couvre
donc la création de commande, et rien d’autre.

> Vérifie que le *rate limiting* est disponible sur ton plan Vercel — les règles
> WAF personnalisées ne le sont pas sur tous. À défaut, le garde-fou en base
> reste actif.

---

## Phase 3 — ce qui est déjà en place

- `src/app/api/webhooks/paiement/route.ts` : emplacement réservé du webhook
  (répond 501). Le fichier documente la séquence attendue — vérification de
  signature, idempotence, passage en `PAYEE`, déclenchement de la livraison.
- `src/lib/livraison.ts` : `construireCommandes()` transforme les lignes d’une
  commande en commandes console avec le pseudo substitué. Déjà utilisé par
  `/admin/commandes/[id]` pour la livraison manuelle ; le worker RCON
  consommera la même fonction.
- `Commande.referenceExterne` est `UNIQUE` : un même paiement ne pourra pas être
  traité deux fois.

⚠ RCON est un protocole TCP : il ne fonctionne pas depuis le runtime Edge et mal
depuis une fonction serverless. La piste la plus sûre est un petit service
tournant à côté du serveur Minecraft, qui vient chercher les commandes à
exécuter — le port RCON n’a alors jamais besoin d’être exposé.

---
## Déploiement sur Vercel

1. Renseigner `DATABASE_URL`, `AUTH_SECRET` et `NEXT_PUBLIC_SITE_URL` dans
   *Settings → Environment Variables*.
2. `npm run build` lance `prisma generate` : rien d'autre à configurer.
3. Le compte admin se crée en lançant le seed une fois avec `ADMIN_EMAIL` et
   `ADMIN_MOT_DE_PASSE` renseignés (depuis la machine locale pointée sur la base
   de production, ou depuis la console Vercel).

---

## Les maquettes

`_maquettes/` contient les fichiers HTML statiques d'origine qui ont défini la
direction artistique. Ils ne sont pas déployés et ne sont plus la source de
vérité — ils servent de référence visuelle.
