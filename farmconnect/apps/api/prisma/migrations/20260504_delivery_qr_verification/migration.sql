-- AlterTable
ALTER TABLE "orders"
ADD COLUMN "deliveryVerificationToken" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3);
