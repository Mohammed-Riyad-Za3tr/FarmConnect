-- CreateEnum
CREATE TYPE "ProductUnit" AS ENUM ('KG', 'PIECE', 'BOX');

-- CreateEnum
CREATE TYPE "ProductLogType" AS ENUM ('WATERING', 'HARVEST', 'FERTILIZE', 'OTHER');

-- AlterTable
ALTER TABLE "products"
ADD COLUMN "harvestDate" TIMESTAMP(3),
ADD COLUMN "harvestWindowStart" TIMESTAMP(3),
ADD COLUMN "harvestWindowEnd" TIMESTAMP(3),
ADD COLUMN "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "seasonStartMonth" INTEGER,
ADD COLUMN "seasonEndMonth" INTEGER;

-- Add unit enum column with cast from existing values
ALTER TABLE "products" ADD COLUMN "unit_new" "ProductUnit" NOT NULL DEFAULT 'KG';

UPDATE "products"
SET "unit_new" = CASE
  WHEN lower("unit") = 'piece' THEN 'PIECE'::"ProductUnit"
  WHEN lower("unit") = 'box' THEN 'BOX'::"ProductUnit"
  ELSE 'KG'::"ProductUnit"
END;

ALTER TABLE "products" DROP COLUMN "unit";
ALTER TABLE "products" RENAME COLUMN "unit_new" TO "unit";

-- CreateTable
CREATE TABLE "product_logs" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "type" "ProductLogType" NOT NULL,
  "note" TEXT NOT NULL,
  "happenedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_logs_productId_happenedAt_idx" ON "product_logs"("productId", "happenedAt");

-- AddForeignKey
ALTER TABLE "product_logs" ADD CONSTRAINT "product_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
