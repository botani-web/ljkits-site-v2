-- DropForeignKey
ALTER TABLE "LigneLivraison" DROP CONSTRAINT "LigneLivraison_commandeId_fkey";

-- AlterTable
ALTER TABLE "Grade" DROP COLUMN "commandeLivraison",
DROP COLUMN "commandeRetrait";

-- AlterTable
ALTER TABLE "Kit" DROP COLUMN "commandeLivraison",
DROP COLUMN "commandeRetrait";

-- AlterTable
ALTER TABLE "LigneCommande" DROP COLUMN "commandeLivraison",
DROP COLUMN "commandeRetrait";

-- AlterTable
ALTER TABLE "Pack" DROP COLUMN "commandeLivraison",
DROP COLUMN "commandeRetrait";

-- DropTable
DROP TABLE "LigneLivraison";

-- DropEnum
DROP TYPE "StatutLigneLivraison";

-- DropEnum
DROP TYPE "TypeLivraison";

