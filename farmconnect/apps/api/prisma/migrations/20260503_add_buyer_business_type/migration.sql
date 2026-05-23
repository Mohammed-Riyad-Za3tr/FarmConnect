-- CreateEnum
CREATE TYPE "BuyerBusinessType" AS ENUM ('INDIVIDUAL', 'RESTAURANT', 'HOTEL', 'WHOLESALE', 'RETAIL', 'OTHER');

-- AlterTable
ALTER TABLE "buyer_profiles" ADD COLUMN "businessType" "BuyerBusinessType";
