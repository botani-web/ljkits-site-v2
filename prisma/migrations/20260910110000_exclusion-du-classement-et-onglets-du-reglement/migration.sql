-- ══════════════════════════════════════════════════════════════════════════
--  EXCLUSION DU CLASSEMENT, ET ONGLETS DU RÈGLEMENT
--
--  Deux choses, la même journée :
--
--  1. `elo_exclusion` — la table qui dit qui ne concourt plus pour le
--     cashprize. Elle est écrite par le plugin LJElo (/rankedban, et le
--     miroir automatique des bannissements serveur) et LUE PAR LE SITE :
--     le classement public doit appliquer exactement le même filtre que le
--     jeu, sinon les deux divergent et c'est précisément l'accusation
--     qu'on cherche à rendre impossible.
--
--     LES DROITS COMPTENT ICI. Les tables elo_* appartiennent à
--     neondb_owner ; le compte du serveur Minecraft (ljrank_serveur) n'a
--     pas CREATE et ne peut donc pas se créer cette table lui-même. Sans
--     le GRANT ci-dessous, le plugin la verrait comme absente et refuserait
--     d'enregistrer la moindre sanction — ce qui est le comportement voulu,
--     mais il faut évidemment lui donner les droits.
--
--  2. `categorie` sur les sections du règlement, pour les onglets de
--     gauche. La valeur par défaut range tout dans "serveur" ; le contenu
--     est reclassé juste après par le script de contenu.
--
--  TOUT EST EN « IF NOT EXISTS » : rejouable sans effet.
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "elo_exclusion" (
    "uuid"      TEXT           NOT NULL,
    "origine"   TEXT           NOT NULL,
    "pseudo"    TEXT,
    "raison"    TEXT,
    "staff"     TEXT,
    "cree_le"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "levee_le"  TIMESTAMPTZ(6),
    "levee_par" TEXT,
    "actif"     BOOLEAN        NOT NULL DEFAULT true,
    CONSTRAINT "elo_exclusion_pkey" PRIMARY KEY ("uuid", "origine")
);

-- Le classement filtre sur `actif` à chaque affichage : sans cet index, la
-- table serait parcourue en entier à chaque fois. Elle est minuscule
-- aujourd'hui, elle ne le restera pas forcément.
CREATE INDEX IF NOT EXISTS "idx_exclusion_actif" ON "elo_exclusion" ("actif");

-- Les mêmes droits que sur les quatre autres tables elo_*.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "elo_exclusion" TO "ljrank_serveur";

-- ---------------------------------------------------------------------------
--  LES ONGLETS DU RÈGLEMENT
-- ---------------------------------------------------------------------------

ALTER TABLE "SectionReglement"
    ADD COLUMN IF NOT EXISTS "categorie" TEXT NOT NULL DEFAULT 'serveur';

DROP INDEX IF EXISTS "SectionReglement_publie_ordre_idx";
CREATE INDEX IF NOT EXISTS "SectionReglement_publie_categorie_ordre_idx"
    ON "SectionReglement" ("publie", "categorie", "ordre");
