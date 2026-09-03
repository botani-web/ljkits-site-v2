-- Les packs de coins.
--
-- La boutique ne vend plus de kits : ils s'obtiennent tous en jouant.
-- Restent les grades, et des coins qui raccourcissent le grind. Un pack
-- porte donc désormais une quantité de coins.
--
-- Colonne NULLABLE : les packs existants (aucun aujourd'hui, mais la
-- migration doit pouvoir se rejouer sur une base restaurée) gardent NULL,
-- ce qui veut dire « ce pack ne donne pas de coins ».
ALTER TABLE "Pack" ADD COLUMN IF NOT EXISTS "coins" INTEGER;
