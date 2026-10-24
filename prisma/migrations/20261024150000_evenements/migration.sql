-- Événements (24/10/2026, tournoi HG Run) : la table des événements seulement.
-- Écrite à la main : le diff automatique voulait aussi supprimer les tables hgrun_* du plugin LJHG.
CREATE TABLE "evenement" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nom_en" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "description_en" TEXT NOT NULL DEFAULT '',
    "jeu" TEXT NOT NULL DEFAULT 'hgrun',
    "debut" TIMESTAMPTZ(6) NOT NULL,
    "fin" TIMESTAMPTZ(6) NOT NULL,
    "cashprize" TEXT NOT NULL DEFAULT '',
    "prix" TEXT NOT NULL DEFAULT '',
    "prix_en" TEXT NOT NULL DEFAULT '',
    "points" INTEGER[] DEFAULT ARRAY[20, 15, 12, 10, 8, 6, 5, 4, 3, 2, 1, 1, 1, 1, 1]::INTEGER[],
    "points_kill" INTEGER NOT NULL DEFAULT 2,
    "exclues" BIGINT[] DEFAULT ARRAY[]::BIGINT[],
    "publie" BOOLEAN NOT NULL DEFAULT true,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maj_le" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evenement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "evenement_slug_key" ON "evenement"("slug");
