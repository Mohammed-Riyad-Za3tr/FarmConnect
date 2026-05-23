CREATE TYPE "DeliveryMethod" AS ENUM ('PICKUP', 'DELIVERY');

ALTER TABLE "producer_profiles"
ADD COLUMN "producerOffersDelivery" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "orders"
ADD COLUMN "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'PICKUP',
ADD COLUMN "deliveryFee" DECIMAL(10,2);
