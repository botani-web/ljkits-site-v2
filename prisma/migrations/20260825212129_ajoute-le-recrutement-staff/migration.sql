-- CreateEnum
CREATE TYPE "TypeQuestion" AS ENUM ('TEXTE_COURT', 'TEXTE_LONG', 'NOMBRE', 'OUI_NON', 'CHOIX_UNIQUE');

-- CreateEnum
CREATE TYPE "StatutCandidature" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

-- AlterTable
ALTER TABLE "reglages" ADD COLUMN     "recrutementMessageFerme" TEXT NOT NULL DEFAULT 'Le recrutement est fermé pour le moment. Les ouvertures sont annoncées sur le Discord — passe y jeter un œil.',
ADD COLUMN     "recrutementOuvert" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SectionRecrutement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionRecrutement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionRecrutement" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "aide" TEXT,
    "type" "TypeQuestion" NOT NULL DEFAULT 'TEXTE_COURT',
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "obligatoire" BOOLEAN NOT NULL DEFAULT true,
    "minimum" INTEGER,
    "maximum" INTEGER,
    "ordre" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionRecrutement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidature" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "pseudoMinecraft" TEXT NOT NULL,
    "pseudoDiscord" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "statut" "StatutCandidature" NOT NULL DEFAULT 'EN_ATTENTE',
    "noteAdmin" TEXT,
    "decideeAt" TIMESTAMP(3),
    "consentementAt" TIMESTAMP(3) NOT NULL,
    "consentementTexte" TEXT NOT NULL,
    "webhookEnvoyeAt" TIMESTAMP(3),
    "webhookErreur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supprimeeAt" TIMESTAMP(3),

    CONSTRAINT "Candidature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReponseCandidature" (
    "id" TEXT NOT NULL,
    "candidatureId" TEXT NOT NULL,
    "questionId" TEXT,
    "libelleFige" TEXT NOT NULL,
    "typeFige" "TypeQuestion" NOT NULL,
    "sectionFigee" TEXT NOT NULL,
    "ordreFige" INTEGER NOT NULL,
    "valeur" TEXT NOT NULL,

    CONSTRAINT "ReponseCandidature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativeRecrutement" (
    "id" TEXT NOT NULL,
    "empreinte" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativeRecrutement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SectionRecrutement_actif_ordre_idx" ON "SectionRecrutement"("actif", "ordre");

-- CreateIndex
CREATE INDEX "SectionRecrutement_ordre_idx" ON "SectionRecrutement"("ordre");

-- CreateIndex
CREATE INDEX "QuestionRecrutement_sectionId_ordre_idx" ON "QuestionRecrutement"("sectionId", "ordre");

-- CreateIndex
CREATE INDEX "QuestionRecrutement_actif_ordre_idx" ON "QuestionRecrutement"("actif", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "Candidature_numero_key" ON "Candidature"("numero");

-- CreateIndex
CREATE INDEX "Candidature_statut_createdAt_idx" ON "Candidature"("statut", "createdAt");

-- CreateIndex
CREATE INDEX "Candidature_supprimeeAt_createdAt_idx" ON "Candidature"("supprimeeAt", "createdAt");

-- CreateIndex
CREATE INDEX "Candidature_pseudoMinecraft_createdAt_idx" ON "Candidature"("pseudoMinecraft", "createdAt");

-- CreateIndex
CREATE INDEX "Candidature_createdAt_idx" ON "Candidature"("createdAt");

-- CreateIndex
CREATE INDEX "ReponseCandidature_candidatureId_ordreFige_idx" ON "ReponseCandidature"("candidatureId", "ordreFige");

-- CreateIndex
CREATE INDEX "ReponseCandidature_questionId_idx" ON "ReponseCandidature"("questionId");

-- CreateIndex
CREATE INDEX "TentativeRecrutement_empreinte_createdAt_idx" ON "TentativeRecrutement"("empreinte", "createdAt");

-- CreateIndex
CREATE INDEX "TentativeRecrutement_createdAt_idx" ON "TentativeRecrutement"("createdAt");

-- AddForeignKey
ALTER TABLE "QuestionRecrutement" ADD CONSTRAINT "QuestionRecrutement_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "SectionRecrutement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReponseCandidature" ADD CONSTRAINT "ReponseCandidature_candidatureId_fkey" FOREIGN KEY ("candidatureId") REFERENCES "Candidature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReponseCandidature" ADD CONSTRAINT "ReponseCandidature_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionRecrutement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

