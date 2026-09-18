-- ══════════════════════════════════════════════════════════════════════════
--  LA RÉMUNÉRATION D'UN PARTENAIRE
--
--  Un partenaire est payé au NOUVEAU joueur amené : 0,25 € par défaut, soit
--  `partenaire.taux_centimes = 25`. En centimes et jamais en flottant — un
--  décompte de paie ne peut pas se permettre un arrondi silencieux.
--
--  `paiement_partenaire` est un JOURNAL, pas un solde. Quand le partenaire
--  confirme avoir été payé, on écrit une ligne : la période réglée, le nombre
--  de joueurs FIGÉ ce jour-là, le taux appliqué et le montant. Le compteur
--  affiché repart alors de zéro, parce qu'il ne compte plus que les joueurs
--  arrivés APRÈS `fin`.
--
--  ⚠ AUCUN JOUEUR N'EST EFFACÉ. `joueur_source` n'est pas touchée : le
--  « reset » est un simple déplacement de borne. L'historique complet reste
--  lisible, et deux personnes qui relisent la même période six mois plus tard
--  retombent sur les mêmes chiffres.
--
--  Tables tenues par le SITE (rôle propriétaire) : le plugin Minecraft n'a
--  rien à faire ici, d'où l'absence de GRANT à `ljrank_serveur`.
-- ══════════════════════════════════════════════════════════════════════════

-- AlterTable
ALTER TABLE "partenaire" ADD COLUMN     "taux_centimes" INTEGER NOT NULL DEFAULT 25;

-- CreateTable
CREATE TABLE "paiement_partenaire" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "debut" TIMESTAMPTZ(6) NOT NULL,
    "fin" TIMESTAMPTZ(6) NOT NULL,
    "joueurs" INTEGER NOT NULL,
    "taux_centimes" INTEGER NOT NULL,
    "montant_centimes" INTEGER NOT NULL,
    "confirme_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiement_partenaire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Deux clics simultanés sur « j'ai été payé » calculent le même `debut` :
-- le second insert est refusé ici, plutôt que par un verrou applicatif.
CREATE UNIQUE INDEX "paiement_partenaire_slug_debut_key" ON "paiement_partenaire"("slug", "debut");

-- CreateIndex
CREATE INDEX "idx_paiement_partenaire_slug_fin" ON "paiement_partenaire"("slug", "fin");

-- AddForeignKey
ALTER TABLE "paiement_partenaire" ADD CONSTRAINT "paiement_partenaire_slug_fkey" FOREIGN KEY ("slug") REFERENCES "partenaire"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

