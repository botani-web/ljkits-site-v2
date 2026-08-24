-- CreateEnum
CREATE TYPE "TypeAppareil" AS ENUM ('MOBILE', 'TABLETTE', 'BUREAU');

-- CreateTable
CREATE TABLE "VuePage" (
    "id" TEXT NOT NULL,
    "chemin" TEXT NOT NULL,
    "visiteId" TEXT NOT NULL,
    "dureeMs" INTEGER,
    "source" TEXT,
    "appareil" "TypeAppareil" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VuePage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VuePage_createdAt_idx" ON "VuePage"("createdAt");

-- CreateIndex
CREATE INDEX "VuePage_chemin_createdAt_idx" ON "VuePage"("chemin", "createdAt");

-- CreateIndex
CREATE INDEX "VuePage_visiteId_idx" ON "VuePage"("visiteId");

