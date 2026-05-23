-- Phase 12B hardening indexes
-- Speeds up buyer order listings and payment gateway/idempotency event lookups.

CREATE INDEX IF NOT EXISTS "orders_buyerId_createdAt_idx"
ON "orders"("buyerId", "createdAt");

CREATE INDEX IF NOT EXISTS "payments_gatewayRef_idx"
ON "payments"("gatewayRef");

CREATE INDEX IF NOT EXISTS "payment_events_createdAt_idx"
ON "payment_events"("createdAt");
