-- AlterTable
ALTER TABLE "producer_profiles" ADD COLUMN "nis" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "producer_profiles_nis_key" ON "producer_profiles"("nis");
