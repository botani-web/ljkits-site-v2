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
| `TEBEX_PUBLIC_TOKEN` | Public Token Tebex — création des paniers (API Headless) |
| `TEBEX_WEBHOOK_SECRET` | Secret Key du webhook Tebex — vérification de signature |

### 3. Créer les tables et peupler la base

```bash
npm run db:migrate # crée les tables via prisma/migrations
npm run db:seed    # 29 kits, 3 grades, 1 pack, 7 sections, compte admin
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
| `npm run db:migrate:status` | Où en est la base par rapport aux migrations |
| `npm run db:migrate:new -- <nom>` | Crée une migration à partir du schéma (refuse les DROP) |
| `npm run db:migrate` | Applique les migrations en attente |
| `npm run db:diff` | Affiche l'écart entre la base et le schéma, sans rien exécuter |
| `npm run db:seed` | (Re)peuple **tout** le contenu de référence — idempotent |
| `npm run db:seed:boutique` | Peuple **uniquement** grades et packs, sans toucher aux kits ni au règlement |
| `npm run db:seed:prix` | Écrit **uniquement** le prix en euros et la mise en vente des kits — aucun texte touché |
| `npm run db:studio` | Interface graphique Prisma sur la base |

> ⚠ `db:seed` **réécrit** le contenu de référence : les 29 kits, leur ordre et
> les 7 sections de règlement listés dans `prisma/seed.ts` reprennent leurs
> valeurs d'origine. Les kits que tu as créés depuis l'admin ne sont pas touchés.
>
> Sur une base **déjà en service**, préfère un seed partiel :
>
> - `npm run db:seed:boutique` ne crée que les grades et les packs, et laisse
>   les kits et le règlement tels quels ;
> - `npm run db:seed:prix` n'écrit que `prixEurosCentimes` et `achetable` de
>   chaque kit. C'est ce qu'il faut lancer
>   pour mettre les 21 kits classiques en vente à 2 € : aucune description,
>   aucun nom, aucune caractéristique n'est réécrit. Le script signale à la fin
>   combien de kits en vente n'ont pas encore d'identifiant de package Tebex.
>
> Un piège à connaître : l'upsert se fait sur le **slug**. Si tu as renommé un
> kit d'origine depuis l'admin (`archer` → `archer-longue-portee`), le seed ne le
> retrouve plus et en **recrée un** sous l'ancien slug — tu te retrouves avec les
> deux. Sur une base déjà utilisée, vérifie la liste après un seed.

---

## Organisation du code

```
prisma/
  schema.prisma      Kit, Grade, Pack, Commande, Joueur (lecture seule)…
  migrations/        les migrations SQL versionnées
  seed.ts            contenu de référence (29 kits, 3 grades, 1 pack, règlement)

src/
  app/               les routes (App Router)
    page.tsx         /             accueil
    kits/            /kits et /kits/[slug]
    classement/      /classement — lecture seule de la table joueur
    reglement/       /reglement
    connexion/       formulaire de connexion admin
    admin/           panneau d'administration (protégé)
    api/auth/        point d'entrée NextAuth
    api/webhooks/    webhook de paiement Tebex

  actions/           Server Actions — toute écriture en base passe par là
    garde.ts         exigerAdmin() — appelé en 1ʳᵉ ligne de chaque action
    kits.ts          créer / modifier / supprimer / déplacer / basculer un kit
    reglement.ts     idem pour les sections du règlement
    auth.ts          connexion et déconnexion

  components/
    public/          composants du site visible
    admin/           composants du panneau d'administration

  lib/
    site.ts          constantes de code (API tierces, image OG, repères de jeu)
    reglages.ts      IP, Discord, URL de vote — modifiables depuis /admin/reglages
    prisma.ts        client Prisma partagé
    auth.ts          configuration NextAuth
    markdown.ts      Markdown → HTML, HTML brut échappé
    validations.ts   schémas zod
    format.ts        formatage des prix, dates et ratios
    classement.ts    lecture du classement (table joueur)
    tebex.ts         panier Headless et signature des webhooks
```

---

## Les migrations

La base est gérée par **Prisma Migrate**, pas par `prisma db push`.

`db push` synchronise la base sur le schéma en **supprimant tout ce qu'il n'y
trouve pas**. Sur une base partagée avec le serveur Minecraft, c'est une bombe :
il a déjà détruit la table `joueur`. La commande a donc été retirée du
`package.json` — si tu la lances un jour à la main, tu sais ce que tu fais.

Une migration, à l'inverse, est un fichier SQL versionné : elle ne fait que ce
qui y est écrit, et ne touche jamais à ce qu'elle ne connaît pas.

### Le quotidien

```bash
npm run db:migrate:status          # où en est la base
npm run db:migrate:new -- mon-nom  # crée une migration à partir du schéma
npm run db:migrate                 # applique les migrations en attente
```

Cycle type quand tu modifies `prisma/schema.prisma` :

1. `npm run db:migrate:new -- ajoute-champ-machin`
   → écrit `prisma/migrations/<horodatage>_ajoute-champ-machin/migration.sql`
   et affiche le SQL ;
2. **relis le SQL** ;
3. `npm run db:migrate` pour l'appliquer ;
4. commite le dossier de migration avec le reste.

### Le garde-fou

`db:migrate:new` **refuse** d'écrire une migration contenant `DROP TABLE`,
`DROP COLUMN`, `DROP INDEX` ou `DROP CONSTRAINT` :

```
⛔ MIGRATION DESTRUCTRICE — rien n'a été écrit.
Opérations détectées : DROP TABLE
```

Dans neuf cas sur dix, ce message ne veut pas dire « je veux supprimer », mais
**« un objet de la base manque au schéma »** — une table ou un index créé par
skript-db. Vérifie d'abord, et n'utilise `--force` que si la suppression est
réellement voulue.

### Pourquoi pas `prisma migrate dev`

`migrate dev` a besoin d'une *shadow database* qu'il crée et détruit lui-même.
Neon ne l'autorise pas sur l'endpoint mutualisé. `db:migrate:new` compare donc
directement la base au schéma, ce qui ne demande aucune base supplémentaire.

Conséquence : le SQL produit décrit l'écart avec la base **telle qu'elle est**.
Elle doit être à jour de toutes les migrations précédentes — lance
`npm run db:migrate` avant, en cas de doute.

### La migration de référence

`prisma/migrations/0_init/` décrit la base entière au moment de la bascule. Elle
a été **marquée comme déjà appliquée** en production
(`prisma migrate resolve --applied 0_init`) : les tables existaient déjà, elle
n'a rien exécuté.

Sur une base **vierge** (une branche Neon de développement, par exemple), elle
crée tout, `joueur` comprise. Si tu montes un environnement de développement,
applique-la **avant** de brancher le serveur Minecraft dessus : si skript-db
crée `joueur` en premier, `migrate deploy` échouera sur un « relation already
exists ».

### Sur Vercel

Le build ne lance **pas** les migrations : `npm run build` se limite à
`prisma generate && next build`. C'est délibéré — une migration qui part toute
seule pendant un déploiement, sur une base partagée avec le serveur Minecraft,
est exactement ce qu'on cherche à éviter.

Applique-les à la main depuis ta machine, pointée sur la production :

```bash
npm run db:migrate:status   # vérifier
npm run db:migrate          # appliquer
```

Fais-le **avant** de pousser le code qui en dépend, sinon le site déployé
interrogera des colonnes qui n'existent pas encore.

---

## ⚠ La table `joueur` appartient au serveur Minecraft

`joueur` est créée et alimentée par **skript-db**, côté serveur Minecraft. Le
site ne fait que la lire. Elle est pourtant déclarée dans `prisma/schema.prisma`,
et c'est délibéré :

> **`prisma db push` SUPPRIME toute table de la base qui n'apparaît pas dans le
> schéma.** Sans le modèle `Joueur`, un `db push` détruit la table et ses
> données. C'est déjà arrivé une fois.

Le modèle reproduit la table **à l'identique** — types, valeurs par défaut,
précision du `timestamptz`, et les trois index descendants des classements
(`idx_kills`, `idx_hebdo`, `idx_mensuel`). Toute divergence ferait proposer un
`ALTER TABLE` ou un `DROP INDEX` sur une table dont le serveur est propriétaire.

### Les trois règles

1. **Ne rien écrire dedans depuis le site.** Aucune Server Action, aucune route
   ne doit faire de `create` / `update` / `delete` sur `Joueur`. Lecture seule.
2. **Ne pas modifier le modèle** sans que la vraie table ait changé.
3. **Si skript-db fait évoluer la table**, réintrospecter plutôt que d'écrire à
   la main :
   ```bash
   cp prisma/schema.prisma /tmp/introspect.prisma
   npx prisma db pull --schema=/tmp/introspect.prisma
   ```
   puis recopier le modèle obtenu, en gardant les `@map` et le `@@map`.

### Toujours regarder le SQL avant d'appliquer

`npm run db:migrate:new` affiche le SQL qu'il vient d'écrire, et refuse tout
net les opérations destructrices. `npm run db:diff` montre l'écart sans rien
écrire ni exécuter.

Si tu vois un `DROP TABLE`, un `DROP INDEX` ou un `DROP COLUMN` que tu n'as pas
demandé, c'est qu'un objet de la base manque au schéma.

### Vérifier qu'aucune table n'est laissée sans protection

Après toute évolution côté serveur Minecraft, compare les tables réelles à
celles du schéma :

```sql
SELECT c.relname
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;
```

Toute table absente de `prisma/schema.prisma` disparaîtra au prochain `db push`.

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
   des couples `{type, slug}` ; le nom et le prix sont relus en
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

## Les réglages du site

**`/admin/reglages`** — tout ce qui change au fil du temps sans mériter un
déploiement :

| Réglage | Où il apparaît |
|---|---|
| Adresse du serveur | Barre de navigation, accueil, kits, classement, boutique, pied de page — partout où l'IP est affichée ou copiable |
| Lien Discord | Navigation, pied de page, boutique, pages de commande, et le règlement via `{discord}` |
| Recrutement ouvert | Formulaire de `/recrutement` |

Avant, ces valeurs étaient en dur dans `src/lib/site.ts` : les changer
demandait une modification de code et un déploiement.

### Comment ça marche

La table `reglages` n'a **qu'une seule ligne**, d'id `1`, toujours upsertée sur
cet id. Si elle n'existe pas — base fraîche, seed pas encore lancé — le site
retombe sur les valeurs de `src/lib/site.ts` plutôt que de planter.

Les composants **serveur** appellent `lireReglages()`, dont le `cache()` de
React déduplique l'appel à l'intérieur d'un même rendu. Les composants
**client** (barre de navigation, bouton de copie de l'IP, statut du serveur)
ne peuvent pas interroger la base : ils reçoivent les réglages par le contexte
`FournisseurReglages`, monté une fois dans `<PagePublique>`.

### La revalidation

L'IP et le Discord apparaissent sur presque toutes les pages, qui sont en rendu
statique. L'action d'enregistrement appelle donc :

```ts
revalidatePath('/', 'layout')
```

Ce qui invalide la mise en page racine **et toutes les pages qui en
descendent** — pas seulement une. Les pages publiques sont à jour dès
l'enregistrement, sans redéploiement.

### Le marqueur `{discord}`

Dans le règlement et les descriptions longues de kits, écris `{discord}` plutôt
que de recopier l'adresse :

```markdown
Ouvre un ticket sur le [Discord]({discord})
```

Il est remplacé par le lien courant au moment de l'affichage : le texte stocké
en base garde le marqueur, jamais l'URL. Changer le lien dans les réglages le
met alors à jour jusque dans le texte du règlement, sans rouvrir chaque section.
L'aperçu de l'éditeur Markdown fait la même substitution : ce que tu vois est ce
qui sera publié.

### Ce qui reste dans le code

`src/lib/site.ts` garde ce qui ne se modifie pas sans toucher au code de toute
façon : le nom du site, l'URL des API tierces (mcstatus.io, mc-heads.net),
l'image Open Graph, les repères de jeu, et `SITE.ouverture` — la date
d'ouverture du serveur, avec son décalage horaire écrit en toutes lettres.

`SITE.url` vient de `NEXT_PUBLIC_SITE_URL` et sert aux métadonnées Open Graph
absolues : c'est une variable d'environnement, pas un réglage.

---

## Le classement des joueurs

`/classement` lit la table `joueur` du serveur Minecraft. Trois onglets :
**Semaine** (`hebdo_points`), **Mois** (`mensuel_points`), **À vie** (`kills`,
avec ratio K/D et record de série).

La page est statique, régénérée au plus toutes les **60 secondes**. Les trois
classements sont envoyés ensemble au navigateur : changer d'onglet ne provoque
aucun aller-retour.

**Lecture seule.** Ni la page ni aucune action n'écrit dans `joueur` ou dans
`config_classement`. Les seules écritures viennent du serveur Minecraft.

Seuls les joueurs dont la valeur est **supérieure à zéro** sont classés : une
liste de cinquante zéros en début de semaine n'apprend rien. Si personne n'a
encore marqué, la page affiche « Aucun joueur classé pour le moment ».

### Ce que le serveur Minecraft doit écrire

Le compte à rebours affiché sur les onglets Semaine et Mois lit la table
`config_classement`, créée par Prisma mais **alimentée par skript-db**. Deux
lignes, avec un timestamp unix en **secondes** :

| `cle` | `valeur` |
|---|---|
| `hebdo_fin` | date de la prochaine remise à zéro hebdomadaire |
| `mensuel_fin` | date de la prochaine remise à zéro du cycle de 30 jours |

À chaque remise à zéro, le serveur repousse la date correspondante :

```sql
INSERT INTO config_classement (cle, valeur)
VALUES ('mensuel_fin', extract(epoch from now())::bigint + 30 * 86400)
ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur;
```

Le nom de table est en minuscules (`@@map("config_classement")`) précisément
pour que ce SQL fonctionne sans guillemets.

### Si les dates sont absentes

Le site ne plante pas et n'affiche pas d'erreur, il calcule une valeur par
défaut :

| Clé manquante | Valeur calculée |
|---|---|
| `hebdo_fin` | prochain **lundi 00:00 UTC** |
| `mensuel_fin` | **maintenant + 30 jours** (cycle glissant, pas le 1er du mois) |

Si la date stockée est **déjà passée** — le serveur ne l'a pas repoussée — le
compte à rebours affiche « imminente » plutôt qu'un décompte négatif.

### Deux classements, à ne pas confondre

- **`/classement`** : les joueurs, alimenté par le serveur Minecraft. Réel.
- **Section « Les meilleurs votants » de l'accueil** : les votes.
  ⚠ **Données factices** — aucun système de vote n'est encore installé.
  L'avertissement est en tête de `src/components/public/ClassementVotes.tsx`.

---

## Du paiement à la livraison

Le site ne parle jamais au serveur Minecraft, et n'exécute aucune commande
console. Il **vend** ; c'est le **plugin Tebex**, installé sur le serveur, qui
livre en jeu. Le port RCON n'est donc jamais exposé, et il n'y a ni file
d'attente ni bot à faire tourner.

Conséquence directe : `payment.completed` fait passer la commande en **LIVREE**,
pas en PAYEE. Du point de vue du site, payer et livrer sont simultanés — le
plugin s'occupe du reste de son côté.

```
  Joueur                Site                      Tebex          Plugin serveur
    │                     │                         │                   │
    ├─ valide le panier ─▶│                         │                   │
    │                     ├─ crée la commande       │                   │
    │                     │  (EN_ATTENTE)           │                   │
    │                     ├─ POST /baskets ────────▶│                   │
    │                     │  username + custom      │                   │
    │                     │  {commandeId}           │                   │
    │                     │◀─ ident + checkout ─────┤                   │
    │◀─ modale ou onglet ─┤                         │                   │
    │                                               │                   │
    ├─ paie ──────────────────────────────────────▶ │                   │
    │                     │◀─ webhook ──────────────┤                   │
    │                     │  payment.completed      │                   │
    │                     ├─ signature vérifiée     │                   │
    │                     ├─ statut LIVREE          │                   │
    │                     │  payeeAt + livreeAt     │                   │
    │                     │                         ├─ livre en jeu ───▶│
    │                     │                         │                   │
```

### La signature du webhook

Tebex signe chaque webhook dans l'en-tête `X-Signature` :

```
signature = HMAC_SHA256( clé = TEBEX_WEBHOOK_SECRET,
                         message = SHA256_hex(corps brut) )
```

Deux pièges, tous deux traités dans `src/lib/tebex.ts` :

1. le message du HMAC est la représentation **hexadécimale** du condensat du
   corps, pas ses octets bruts ;
2. il faut le corps **brut**. La route lit `await requete.text()` et jamais
   `requete.json()` : re-sérialiser changerait les octets et ferait échouer la
   vérification.

### Les évènements traités

| Évènement Tebex | Effet |
|---|---|
| `validation.webhook` | Répond `{ "id": … }` — c'est ce qui valide l'endpoint dans Tebex. **Ne se coche pas** dans la liste des types : Tebex l'envoie de lui-même à l'enregistrement |
| `payment.completed` | Statut `LIVREE`, `payeeAt` et `livreeAt` posés, `transactionTebex` enregistré |
| `payment.declined` | Statut `ECHOUEE`. Sans ce cas, la commande resterait `EN_ATTENTE` et pèserait sur le garde-fou anti-abus |
| `payment.refunded` | Statut `REMBOURSEE`. `livreeAt` n'est pas effacé : il reste la trace de la livraison |
| `payment.dispute.won` | Retour en `LIVREE` : le paiement tient |
| `payment.dispute.lost` | Idem remboursement |
| `payment.dispute.opened` | Statut `LITIGE`, **rien n'est retiré** : l'arbitrage n'est pas tranché |

**Idempotence.** Chaque webhook traité est enregistré dans `EvenementTebex`,
avec l'id fourni par Tebex en clé primaire. Un même évènement reçu deux fois
échoue à l'insertion et repart en 200 sans rien refaire. C'est bien l'id du
webhook qui sert de clé — une commande reçoit plusieurs évènements légitimes
(paiement, puis éventuellement remboursement).

### Relier le catalogue à Tebex

Chaque kit, grade et pack vendu doit porter le `tebexPackageId` du package
correspondant chez Tebex. Sans lui, l'article est refusé à la mise au panier
avec un message clair, et l'admin le signale en rouge dans la liste.

Ce que le joueur reçoit réellement en jeu se configure **sur le package, dans
le tableau de bord Tebex** — pas dans cette admin. Le site ne connaît que le
prix, le libellé et l'identifiant du package.

## Déploiement sur Vercel

1. Renseigner les variables d'environnement dans *Settings → Environment
   Variables* : `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`,
   `TEBEX_PUBLIC_TOKEN`, `TEBEX_WEBHOOK_SECRET`.
2. `npm run build` lance `prisma generate` : rien d'autre à configurer.
3. **Appliquer les migrations AVANT de pousser** le code qui en dépend, depuis
   ta machine pointée sur la production :
   ```bash
   npm run db:migrate:status
   npm run db:migrate
   ```
   Le build Vercel ne les lance pas : une migration déclenchée automatiquement
   sur une base partagée avec le serveur Minecraft est précisément ce qu'on
   cherche à éviter.
4. Le compte admin se crée en lançant le seed une fois avec `ADMIN_EMAIL` et
   `ADMIN_MOT_DE_PASSE` renseignés, depuis la machine locale pointée sur la
   base de production.

---

## Les maquettes

`_maquettes/` contient les fichiers HTML statiques d'origine qui ont défini la
direction artistique. Ils ne sont pas déployés et ne sont plus la source de
vérité — ils servent de référence visuelle.

---

## À faire après l'ouverture

Dettes assumées pendant la refonte visuelle, à solder une fois le serveur
lancé et stabilisé. Aucune n'est bloquante ; toutes sont des nettoyages ou des
fonctionnalités reportées faute de données.

### Supprimer les colonnes de vote

Le serveur n'a pas de système de vote et n'en aura pas : récompenser des clics
sur des sites tiers contredirait le positionnement « rien ne s'achète ». La
surface publique et le formulaire d'administration ont été retirés, mais trois
colonnes subsistent :

1. Retirer `urlServeurPrive`, `urlTopServeurs` et `urlServeursMinecraft` du
   modèle `Reglages` dans `prisma/schema.prisma`, puis `npm run db:migrate:new`.
2. Retirer les trois clés de `schemaReglages` dans `src/lib/validations.ts`,
   ainsi que le validateur `urlFacultative` qui ne servira plus.
3. Retirer les trois `formData.get(…)` de `enregistrerReglages` dans
   `src/actions/reglages.ts`.

Dans cet ordre : le code cesse d'écrire les colonnes avant qu'elles ne
disparaissent. En attendant, elles sont réécrites à la chaîne vide à chaque
enregistrement des réglages — sans effet, elles valent déjà `''`.

### Rétablir « Comment le jouer / Comment le contrer »

La fiche kit avait ces deux listes en maquette. Elles ont été retirées : la
seule source disponible était `descriptionLongue`, et l'en extraire par
convention de titres Markdown se serait cassé silencieusement au premier
`##Comment le jouer` sans espace.

À rétablir avec **deux champs dédiés** — `commentJouer` et `commentContrer`,
listes de textes courts sur le modèle de `CaracteristiqueKit` — et leur
édition dans `FormulaireKit`.

### Rétablir le palmarès et la carte « ta position »

Les deux sections existaient en maquette sur `/classement`, sans source :

- **Palmarès** — aucune table n'archive les champions passés. Le serveur
  Minecraft vide `hebdo_points` sans rien conserver. Il faut qu'il écrive une
  ligne d'archive à chaque remise à zéro avant que le site puisse l'afficher.
- **« Ta position »** — suppose de savoir qui visite. Il n'y a pas
  d'authentification joueur sur le site.

### Un K/D par période

Les onglets **Semaine** et **Mois** de `/classement` n'affichent que
Rang · Joueur · Points. L'onglet **À vie** est le seul à porter Kills, Morts,
K/D et Record de série.

Ce n'est pas une limite de requête, c'est une limite de modèle : dans la table
`joueur`, `morts` et `record_serie` sont des compteurs **à vie**. Les afficher
en face de `hebdo_points` donnerait un K/D à vie sur un classement de la
semaine — incohérent, et impossible à défendre auprès des joueurs.

Pour un vrai K/D par période, il faut des compteurs hebdomadaires et mensuels
de morts et de séries, **écrits côté Skript**, comme `hebdo_points` et
`mensuel_points`. Rien ne peut être fait côté site tant qu'ils n'existent pas.

Le K/D lui-même est fiable : `/suicide` ne compte ni kill, ni mort, ni coin,
ni point — un drapeau dédié le gère en jeu, et c'est indiqué sur le PNJ d'infos.

### Rassembler les messages de validation du recrutement

Le parcours par étapes de `/recrutement` valide chaque écran côté client avant
de laisser passer à la suite. C'est un **confort** : `soumettreCandidature` et
son schéma zod revalident tout à l'envoi et restent la seule source de vérité.

Pour qu'un candidat ne lise jamais deux formulations du même problème, les
messages sont recopiés à l'identique de `src/lib/recrutement.ts` dans
`src/components/public/FormulaireCandidature.tsx`. Cette duplication est
assumée mais reste une dette : si les deux divergent, le serveur gagne et le
candidat verra son message.

À rassembler dans `src/lib/recrutement-partage.ts`, qui est déjà importé par
les deux côtés et n'embarque ni Prisma ni zod. Des constantes de message et
deux fonctions pures suffisent ; `recrutement.ts` les consommerait dans ses
`ctx.addIssue`.

### Retirer `texte-accent`

L'utilitaire du mot en dégradé or → soupe est marqué transitoire dans
`src/app/globals.css`. Les maquettes validées colorent simplement le mot
accentué en `text-or`. À supprimer quand plus aucune page ne l'appelle.

### Prisma dans le bundle des pages publiques

Environ 55 ko de client Prisma partent dans le bundle des neuf pages
publiques. Correctif reporté à après l'ouverture.
