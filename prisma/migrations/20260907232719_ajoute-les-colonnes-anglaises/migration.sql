-- AlterTable
ALTER TABLE "AvantageGrade" ADD COLUMN     "texteEn" TEXT;

-- AlterTable
ALTER TABLE "CaracteristiqueKit" ADD COLUMN     "libelleEn" TEXT,
ADD COLUMN     "valeurEn" TEXT;

-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "etiquetteEn" TEXT,
ADD COLUMN     "sousTitreEn" TEXT;

-- AlterTable
ALTER TABLE "Kit" ADD COLUMN     "descriptionCourteEn" TEXT,
ADD COLUMN     "descriptionLongueEn" TEXT,
ADD COLUMN     "roleEn" TEXT;

-- AlterTable
ALTER TABLE "Pack" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "nomEn" TEXT;

-- AlterTable
ALTER TABLE "QuestionRecrutement" ADD COLUMN     "aideEn" TEXT,
ADD COLUMN     "libelleEn" TEXT;

-- AlterTable
ALTER TABLE "SectionRecrutement" ADD COLUMN     "nomEn" TEXT;

-- AlterTable
ALTER TABLE "SectionReglement" ADD COLUMN     "contenuEn" TEXT,
ADD COLUMN     "titreEn" TEXT;

