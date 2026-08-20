-- CreateTable
CREATE TABLE "reglages" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "ip" TEXT NOT NULL,
    "discord" TEXT NOT NULL,
    "urlServeurPrive" TEXT NOT NULL DEFAULT '',
    "urlTopServeurs" TEXT NOT NULL DEFAULT '',
    "urlServeursMinecraft" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reglages_pkey" PRIMARY KEY ("id")
);

