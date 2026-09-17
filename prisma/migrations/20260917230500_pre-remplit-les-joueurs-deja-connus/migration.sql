-- ══════════════════════════════════════════════════════════════════════════
--  PRÉ-REMPLIT joueur_source AVEC LES JOUEURS DÉJÀ CONNUS
--
--  Sans ça, le premier retour d'un ancien joueur après la mise en service du
--  suivi le ferait compter comme un NOUVEAU joueur — et l'attribuerait au
--  partenaire par l'adresse duquel il se serait reconnecté ce jour-là. Un
--  streameur hériterait ainsi de toute la communauté existante.
--
--  Ces joueurs reçoivent l'hôte conventionnel « historique » : il ne
--  correspond à aucune ligne de `partenaire`, donc ils ne comptent pour
--  personne. C'est le comportement voulu, et la page le dit au visiteur.
--
--  `premiere_connexion` vaut now() : leur vraie première venue n'est écrite
--  nulle part (la table `joueur` ne garde qu'une `derniere_maj`). La valeur
--  n'est de toute façon jamais lue pour ces lignes, puisqu'aucun partenaire
--  ne porte l'hôte « historique ».
--
--  IDEMPOTENT : ON CONFLICT DO NOTHING. Rejouer la migration ne peut pas
--  écraser une attribution déjà écrite par le plugin.
-- ══════════════════════════════════════════════════════════════════════════
INSERT INTO "joueur_source" ("uuid", "pseudo", "hote", "premiere_connexion")
SELECT "uuid", COALESCE(NULLIF("pseudo", ''), '?'), 'historique', now()
  FROM "joueur"
ON CONFLICT ("uuid") DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════
--  INDEX PARTIEL DES SESSIONS OUVERTES
--
--  Le plugin a un repli : quand il a perdu l'identifiant de la session en
--  cours (redémarrage à chaud), il cherche la dernière session ENCORE OUVERTE
--  du joueur pour la fermer. Cette recherche ne doit pas parcourir toute la
--  table : à une déconnexion près, il n'y a jamais plus d'une poignée de
--  lignes avec `fin IS NULL`.
--
--  ⚠ PRISMA NE SAIT PAS DÉCRIRE UN INDEX PARTIEL. Il est donc invisible dans
--  schema.prisma, et une prochaine `db:migrate:new` proposera de le
--  SUPPRIMER. Le garde-fou anti-destruction du script l'arrêtera : garder cet
--  index, et supprimer le DROP INDEX de la migration proposée.
-- ══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS "idx_session_joueur_ouverte"
    ON "session_joueur" ("uuid")
 WHERE "fin" IS NULL;
