-- CreateTable
CREATE TABLE "avis" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "pseudo" TEXT,
    "note" INTEGER NOT NULL,
    "priorite" TEXT NOT NULL,
    "freins" TEXT[],
    "cashprize" TEXT NOT NULL,
    "message" TEXT,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "empreinte" TEXT NOT NULL,
    "traite_at" TIMESTAMPTZ(6),
    "note_admin" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "avis_numero_key" ON "avis"("numero");

-- CreateIndex
CREATE INDEX "idx_avis_date" ON "avis"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_avis_empreinte" ON "avis"("empreinte");

