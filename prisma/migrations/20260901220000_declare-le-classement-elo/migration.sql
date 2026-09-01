-- ══════════════════════════════════════════════════════════════════════════
--  DÉCLARE LE CLASSEMENT ELO
--
--  Ces quatre tables EXISTENT DÉJÀ : elles ont été créées à la main dans la
--  console Neon, parce que l'utilisateur du serveur Minecraft n'a pas le
--  droit CREATE sur le schéma public.
--
--  Cette migration ne les crée donc pas vraiment : elle les fait connaître à
--  Prisma. Sans elle, `prisma migrate` verrait quatre tables absentes de son
--  historique et proposerait de les supprimer avec la saison en cours.
--
--  TOUT EST EN « IF NOT EXISTS » : la migration doit pouvoir s'appliquer sur
--  une base où les tables sont là (la production, aujourd'hui) comme sur une
--  base vierge (un environnement de test, demain). Elle ne détruit rien et
--  peut être rejouée sans effet.
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "elo_saison" (
    "id"     SERIAL       PRIMARY KEY,
    "nom"    TEXT         NOT NULL,
    "debut"  TIMESTAMPTZ(6) NOT NULL,
    "fin"    TIMESTAMPTZ(6),
    "statut" TEXT         NOT NULL DEFAULT 'en_cours'
);

CREATE TABLE IF NOT EXISTS "elo_joueur" (
    "uuid"         TEXT           NOT NULL,
    "saison"       INTEGER        NOT NULL,
    "pseudo"       TEXT           NOT NULL,
    "elo"          INTEGER        NOT NULL,
    "elo_max"      INTEGER        NOT NULL,
    "combats"      INTEGER        NOT NULL DEFAULT 0,
    "kills"        INTEGER        NOT NULL DEFAULT 0,
    "morts"        INTEGER        NOT NULL DEFAULT 0,
    "serie"        INTEGER        NOT NULL DEFAULT 0,
    "record_serie" INTEGER        NOT NULL DEFAULT 0,
    "derniere_maj" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT "elo_joueur_pkey" PRIMARY KEY ("uuid", "saison")
);

CREATE TABLE IF NOT EXISTS "elo_match" (
    "id"                BIGSERIAL      PRIMARY KEY,
    "saison"            INTEGER        NOT NULL,
    "instant"           TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "tueur"             TEXT           NOT NULL,
    "tueur_pseudo"      TEXT           NOT NULL,
    "victime"           TEXT           NOT NULL,
    "victime_pseudo"    TEXT           NOT NULL,
    "kit_tueur"         TEXT,
    "kit_victime"       TEXT,
    "elo_tueur_avant"   INTEGER        NOT NULL,
    "elo_tueur_apres"   INTEGER        NOT NULL,
    "elo_victime_avant" INTEGER        NOT NULL,
    "elo_victime_apres" INTEGER        NOT NULL,
    "gain"              INTEGER        NOT NULL,
    "perte"             INTEGER        NOT NULL,
    "pv_restants"       DOUBLE PRECISION,
    "facteur_farm"      DOUBLE PRECISION NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "elo_liaison" (
    "uuid"           TEXT           PRIMARY KEY,
    "discord_id"     TEXT           NOT NULL,
    "pseudo_discord" TEXT,
    "liee_le"        TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

-- Les index du plugin, aux mêmes noms. Sans les déclarer ici ET dans le
-- schéma, Prisma les supprimerait au premier `db push` et les classements
-- passeraient en parcours complet de table, sans que rien ne le signale.
CREATE INDEX IF NOT EXISTS "idx_joueur_classement"    ON "elo_joueur" ("saison", "elo" DESC);
CREATE INDEX IF NOT EXISTS "idx_match_saison_instant" ON "elo_match"  ("saison", "instant" DESC);
CREATE INDEX IF NOT EXISTS "idx_match_tueur"          ON "elo_match"  ("tueur", "instant" DESC);
CREATE INDEX IF NOT EXISTS "idx_match_victime"        ON "elo_match"  ("victime", "instant" DESC);
