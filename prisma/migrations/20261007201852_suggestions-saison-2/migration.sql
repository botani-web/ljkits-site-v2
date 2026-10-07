-- CreateTable
CREATE TABLE "suggestion" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "categorie" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "raisons" TEXT[],
    "pseudo" TEXT,
    "discord" TEXT,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "empreinte" TEXT NOT NULL,
    "traite_at" TIMESTAMPTZ(6),
    "note_admin" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suggestion_numero_key" ON "suggestion"("numero");

-- CreateIndex
CREATE INDEX "idx_suggestion_date" ON "suggestion"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_suggestion_empreinte" ON "suggestion"("empreinte");

