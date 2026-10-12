-- CreateTable
CREATE TABLE "saison_joueur" (
    "saison" INTEGER NOT NULL,
    "uuid" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "kills" INTEGER NOT NULL,
    "morts" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL,
    "record_serie" INTEGER NOT NULL,
    "kills_kit" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "saison_joueur_pkey" PRIMARY KEY ("saison","uuid")
);

-- CreateTable
CREATE TABLE "saison_practice" (
    "saison" INTEGER NOT NULL,
    "uuid" TEXT NOT NULL,
    "pseudo" TEXT,
    "ladder" TEXT NOT NULL,
    "ranked" BOOLEAN NOT NULL,
    "matchs" INTEGER NOT NULL,
    "victoires" INTEGER NOT NULL,
    "defaites" INTEGER NOT NULL,
    "nuls" INTEGER NOT NULL,
    "serie" INTEGER NOT NULL,
    "meilleure_serie" INTEGER NOT NULL,
    "soupes" INTEGER NOT NULL,
    "coups" INTEGER NOT NULL,
    "secondes" INTEGER NOT NULL,

    CONSTRAINT "saison_practice_pkey" PRIMARY KEY ("saison","uuid","ladder","ranked")
);

-- CreateTable
CREATE TABLE "saison_archive" (
    "saison" INTEGER NOT NULL,
    "cle" TEXT NOT NULL,
    "donnees" JSONB NOT NULL,
    "cree_le" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saison_archive_pkey" PRIMARY KEY ("saison","cle")
);

-- CreateIndex
CREATE INDEX "idx_saison_joueur_kills" ON "saison_joueur"("saison", "kills" DESC);

-- CreateIndex
CREATE INDEX "idx_saison_practice_mode" ON "saison_practice"("saison", "ladder", "ranked");

