CREATE TABLE "favorite_products" (
  "id" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "favorite_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "favorite_producers" (
  "id" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "producerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "favorite_producers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favorite_products_buyerId_productId_key" ON "favorite_products"("buyerId", "productId");
CREATE INDEX "favorite_products_buyerId_idx" ON "favorite_products"("buyerId");
CREATE INDEX "favorite_products_productId_idx" ON "favorite_products"("productId");

CREATE UNIQUE INDEX "favorite_producers_buyerId_producerId_key" ON "favorite_producers"("buyerId", "producerId");
CREATE INDEX "favorite_producers_buyerId_idx" ON "favorite_producers"("buyerId");
CREATE INDEX "favorite_producers_producerId_idx" ON "favorite_producers"("producerId");

ALTER TABLE "favorite_products" ADD CONSTRAINT "favorite_products_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite_products" ADD CONSTRAINT "favorite_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite_producers" ADD CONSTRAINT "favorite_producers_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite_producers" ADD CONSTRAINT "favorite_producers_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "producer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
