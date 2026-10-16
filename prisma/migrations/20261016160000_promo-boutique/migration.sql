-- Promo de la boutique (16/10/2026) : affichage seulement, la réduction est faite par Tebex.
-- Écrite à la main : le diff automatique voulait aussi supprimer les tables hgrun_* du plugin LJHG.
ALTER TABLE "reglages" ADD COLUMN     "promoActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promoBulle" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "promoFin" TIMESTAMP(3),
ADD COLUMN     "promoPourcentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promoRayon" TEXT NOT NULL DEFAULT 'grades',
ADD COLUMN     "promoTexte" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "promoTexteEn" TEXT NOT NULL DEFAULT '';
