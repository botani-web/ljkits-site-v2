-- ══════════════════════════════════════════════════════════════════════════
--  UN PARTENAIRE EST PAYÉ PAR PERSONNE, PAS PAR COMPTE
--
--  Ce qui a été observé : des joueurs se connectaient avec deux ou trois
--  comptes — connexion, déconnexion, compte suivant — pour faire monter le
--  compteur d'un partenaire. Une seule personne valait ainsi trois joueurs
--  amenés, donc trois fois 0,25 €.
--
--  `doublon` marque une provenance dont un AUTRE compte de la même connexion
--  est déjà venu. La ligne est écrite quand même : les sessions de ce compte
--  doivent rester rattachées à l'hôte, et l'historique doit rester relisible.
--  Seul le DÉCOMPTE PAYÉ l'ignore.
--
--  Qui décide : le serveur de jeu (LJRank) au moment de la toute première
--  connexion du compte, en demandant à LJAdmin — seul détenteur du journal
--  des adresses — si cette connexion a déjà amené quelqu'un. Aucune adresse
--  n'est écrite ici ni ailleurs : LJAdmin n'en garde qu'une empreinte.
--
--  LES LIGNES DÉJÀ EN BASE RESTENT À `false`. On ne récrit pas le passé :
--  les doublons antérieurs ont déjà été comptés, et les rattraper après coup
--  changerait des montants qu'un partenaire a peut-être déjà lus.
-- ══════════════════════════════════════════════════════════════════════════

-- AlterTable
ALTER TABLE "joueur_source" ADD COLUMN "doublon" BOOLEAN NOT NULL DEFAULT false;

-- Le décompte payé filtre là-dessus : un index partiel suffit et reste petit.
CREATE INDEX "idx_joueur_source_doublon" ON "joueur_source" ("hote") WHERE "doublon" = false;

-- Le rôle du serveur de jeu écrit déjà dans cette table (voir la migration du
-- 17/09) : le GRANT porte sur la table, pas sur la colonne, il n'y a donc rien
-- à redonner. Le bloc reste défensif si le rôle n'existait pas encore.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ljrank_serveur') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "joueur_source" TO "ljrank_serveur";
  END IF;
END
$$;
