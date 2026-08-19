-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TypeKit" AS ENUM ('GRATUIT', 'EXCLUSIF');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('EN_ATTENTE', 'PAYEE', 'LIVREE', 'ECHOUEE', 'REMBOURSEE', 'LITIGE');

-- CreateEnum
CREATE TYPE "TypeArticle" AS ENUM ('KIT', 'GRADE', 'PACK');

-- CreateEnum
CREATE TYPE "StatutLigneLivraison" AS ENUM ('EN_ATTENTE', 'EXECUTEE', 'ECHOUEE');

-- CreateEnum
CREATE TYPE "TypeLivraison" AS ENUM ('LIVRAISON', 'RETRAIT');

-- CreateTable
CREATE TABLE "Kit" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "kanji" TEXT,
    "role" TEXT NOT NULL,
    "descriptionCourte" TEXT NOT NULL,
    "descriptionLongue" TEXT NOT NULL,
    "prixCoins" INTEGER NOT NULL DEFAULT 0,
    "prixEurosCentimes" INTEGER,
    "type" "TypeKit" NOT NULL DEFAULT 'GRATUIT',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "achetable" BOOLEAN NOT NULL DEFAULT false,
    "bientot" BOOLEAN NOT NULL DEFAULT false,
    "kitDeDepart" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commandeLivraison" TEXT NOT NULL DEFAULT '',
    "commandeRetrait" TEXT NOT NULL DEFAULT '',
    "tebexPackageId" INTEGER,

    CONSTRAINT "Kit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaracteristiqueKit" (
    "id" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "CaracteristiqueKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionReglement" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "publie" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionReglement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "kanji" TEXT,
    "sousTitre" TEXT,
    "etiquette" TEXT,
    "prixEurosCentimes" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "achetable" BOOLEAN NOT NULL DEFAULT true,
    "heriteDuPrecedent" BOOLEAN NOT NULL DEFAULT false,
    "commandeLivraison" TEXT NOT NULL DEFAULT '',
    "commandeRetrait" TEXT NOT NULL DEFAULT '',
    "tebexPackageId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvantageGrade" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "AvantageGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prixEurosCentimes" INTEGER NOT NULL,
    "prixBarreCentimes" INTEGER,
    "ordre" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "achetable" BOOLEAN NOT NULL DEFAULT true,
    "commandeLivraison" TEXT NOT NULL DEFAULT '',
    "commandeRetrait" TEXT NOT NULL DEFAULT '',
    "tebexPackageId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commande" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "pseudoMinecraft" TEXT NOT NULL,
    "montantTotalCentimes" INTEGER NOT NULL,
    "statut" "StatutCommande" NOT NULL DEFAULT 'EN_ATTENTE',
    "referenceExterne" TEXT,
    "transactionTebex" TEXT,
    "derniereErreur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payeeAt" TIMESTAMP(3),
    "livreeAt" TIMESTAMP(3),

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneCommande" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "type" "TypeArticle" NOT NULL,
    "kitId" TEXT,
    "gradeId" TEXT,
    "packId" TEXT,
    "libelle" TEXT NOT NULL,
    "prixCentimes" INTEGER NOT NULL,
    "commandeLivraison" TEXT NOT NULL,
    "commandeRetrait" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "LigneCommande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneLivraison" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "type" "TypeLivraison" NOT NULL DEFAULT 'LIVRAISON',
    "commande" TEXT NOT NULL,
    "statut" "StatutLigneLivraison" NOT NULL DEFAULT 'EN_ATTENTE',
    "tentatives" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executeeAt" TIMESTAMP(3),
    "derniereErreur" TEXT,

    CONSTRAINT "LigneLivraison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvenementTebex" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "commandeId" TEXT,
    "recuLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvenementTebex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "joueur" (
    "uuid" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "morts" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "record_serie" INTEGER NOT NULL DEFAULT 0,
    "hebdo_points" INTEGER NOT NULL DEFAULT 0,
    "mensuel_points" INTEGER NOT NULL DEFAULT 0,
    "derniere_maj" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "joueur_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "_KitToPack" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KitToPack_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kit_slug_key" ON "Kit"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Kit_tebexPackageId_key" ON "Kit"("tebexPackageId");

-- CreateIndex
CREATE INDEX "Kit_visible_ordre_idx" ON "Kit"("visible", "ordre");

-- CreateIndex
CREATE INDEX "Kit_ordre_idx" ON "Kit"("ordre");

-- CreateIndex
CREATE INDEX "CaracteristiqueKit_kitId_ordre_idx" ON "CaracteristiqueKit"("kitId", "ordre");

-- CreateIndex
CREATE INDEX "SectionReglement_publie_ordre_idx" ON "SectionReglement"("publie", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_slug_key" ON "Grade"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_tebexPackageId_key" ON "Grade"("tebexPackageId");

-- CreateIndex
CREATE INDEX "Grade_visible_ordre_idx" ON "Grade"("visible", "ordre");

-- CreateIndex
CREATE INDEX "Grade_ordre_idx" ON "Grade"("ordre");

-- CreateIndex
CREATE INDEX "AvantageGrade_gradeId_ordre_idx" ON "AvantageGrade"("gradeId", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "Pack_slug_key" ON "Pack"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Pack_tebexPackageId_key" ON "Pack"("tebexPackageId");

-- CreateIndex
CREATE INDEX "Pack_visible_ordre_idx" ON "Pack"("visible", "ordre");

-- CreateIndex
CREATE INDEX "Pack_ordre_idx" ON "Pack"("ordre");

-- CreateIndex
CREATE UNIQUE INDEX "Commande_numero_key" ON "Commande"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Commande_referenceExterne_key" ON "Commande"("referenceExterne");

-- CreateIndex
CREATE INDEX "Commande_statut_createdAt_idx" ON "Commande"("statut", "createdAt");

-- CreateIndex
CREATE INDEX "Commande_pseudoMinecraft_statut_createdAt_idx" ON "Commande"("pseudoMinecraft", "statut", "createdAt");

-- CreateIndex
CREATE INDEX "LigneCommande_commandeId_idx" ON "LigneCommande"("commandeId");

-- CreateIndex
CREATE INDEX "LigneLivraison_statut_tentatives_createdAt_idx" ON "LigneLivraison"("statut", "tentatives", "createdAt");

-- CreateIndex
CREATE INDEX "LigneLivraison_commandeId_idx" ON "LigneLivraison"("commandeId");

-- CreateIndex
CREATE INDEX "EvenementTebex_commandeId_idx" ON "EvenementTebex"("commandeId");

-- CreateIndex
CREATE INDEX "idx_kills" ON "joueur"("kills" DESC);

-- CreateIndex
CREATE INDEX "idx_hebdo" ON "joueur"("hebdo_points" DESC);

-- CreateIndex
CREATE INDEX "idx_mensuel" ON "joueur"("mensuel_points" DESC);

-- CreateIndex
CREATE INDEX "_KitToPack_B_index" ON "_KitToPack"("B");

-- AddForeignKey
ALTER TABLE "CaracteristiqueKit" ADD CONSTRAINT "CaracteristiqueKit_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvantageGrade" ADD CONSTRAINT "AvantageGrade_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneLivraison" ADD CONSTRAINT "LigneLivraison_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KitToPack" ADD CONSTRAINT "_KitToPack_A_fkey" FOREIGN KEY ("A") REFERENCES "Kit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KitToPack" ADD CONSTRAINT "_KitToPack_B_fkey" FOREIGN KEY ("B") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

