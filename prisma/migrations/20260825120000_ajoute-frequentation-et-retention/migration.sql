-- CreateTable
CREATE TABLE "statistique_jour" (
    "jour" DATE NOT NULL,
    "vues" INTEGER NOT NULL,
    "visiteurs" INTEGER NOT NULL,
    "dureeMoyenneMs" INTEGER,

    CONSTRAINT "statistique_jour_pkey" PRIMARY KEY ("jour")
);

-- CreateTable
CREATE TABLE "echantillon_frequentation" (
    "id" TEXT NOT NULL,
    "releveLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enLigne" BOOLEAN NOT NULL,
    "joueurs" INTEGER NOT NULL,
    "maxJoueurs" INTEGER NOT NULL,

    CONSTRAINT "echantillon_frequentation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "echantillon_frequentation_releveLe_idx" ON "echantillon_frequentation"("releveLe");
