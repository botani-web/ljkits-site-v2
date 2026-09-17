-- ══════════════════════════════════════════════════════════════════════════
--  AJOUTE LE SUIVI DES PARTENAIRES / STREAMEURS
--
--  Trois tables pour savoir combien de joueurs un streameur amène :
--    partenaire     — le partenaire, son hôte et son mot de passe de lecture ;
--    joueur_source  — à qui un joueur doit sa PREMIÈRE venue (premier contact) ;
--    session_joueur — chaque passage sur le serveur, avec sa durée.
--
--  Le plugin Minecraft (rôle `ljrank_serveur`) ÉCRIT dans joueur_source et
--  session_joueur ; le site ne fait que les lire. D'où le GRANT en fin de
--  fichier : sans lui, le plugin voit les tables comme absentes, exactement
--  comme pour les tables elo_*.
--
--  Aucune adresse IP, aucune donnée personnelle : l'hôte stocké est celui du
--  serveur (sixela.ljkits.eu), pas celui du joueur.
-- ══════════════════════════════════════════════════════════════════════════

-- CreateTable
CREATE TABLE "partenaire" (
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "hote" TEXT NOT NULL,
    "mot_de_passe_hash" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partenaire_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "joueur_source" (
    "uuid" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "hote" TEXT NOT NULL,
    "premiere_connexion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "joueur_source_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "session_joueur" (
    "id" BIGSERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "hote" TEXT NOT NULL,
    "debut" TIMESTAMPTZ(6) NOT NULL,
    "fin" TIMESTAMPTZ(6),
    "secondes" INTEGER,
    "nouveau" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "session_joueur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partenaire_hote_key" ON "partenaire"("hote");

-- CreateIndex
CREATE INDEX "idx_joueur_source_hote" ON "joueur_source"("hote");

-- CreateIndex
CREATE INDEX "idx_session_joueur_hote_debut" ON "session_joueur"("hote", "debut");

-- CreateIndex
CREATE INDEX "idx_session_joueur_uuid" ON "session_joueur"("uuid");


-- ══════════════════════════════════════════════════════════════════════════
--  DROITS DU PLUGIN MINECRAFT
--
--  Le serveur se connecte avec un rôle à lui, qui n'a aucun droit CREATE : il
--  ne peut donc pas créer ces tables, et sans GRANT il ne les voit même pas.
--  Le DO ... IF EXISTS permet de rejouer la migration sur une base où ce rôle
--  n'existe pas (environnement de test, base vierge) sans la faire échouer.
-- ══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ljrank_serveur') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "partenaire", "joueur_source", "session_joueur" TO "ljrank_serveur";
    GRANT USAGE, SELECT ON SEQUENCE "session_joueur_id_seq" TO "ljrank_serveur";
  END IF;
END
$$;
