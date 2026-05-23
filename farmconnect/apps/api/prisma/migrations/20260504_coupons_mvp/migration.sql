CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FIXED');

CREATE TABLE "coupons" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "producerId" TEXT NOT NULL,
  "type" "CouponType" NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "usageLimit" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");
CREATE INDEX "coupons_producerId_idx" ON "coupons"("producerId");
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

ALTER TABLE "coupons" ADD CONSTRAINT "coupons_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "producer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders"
ADD COLUMN "couponCode" TEXT,
ADD COLUMN "discountAmount" DECIMAL(10,2);
