DO $$
BEGIN
  IF to_regtype('"PaymentStatus"') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE lower(t.typname) = lower('PaymentStatus')
        AND e.enumlabel = 'PARTIAL'
    ) THEN
    ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIAL';
  END IF;
END $$;

ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "originalAmount" DECIMAL(65,30),
  ADD COLUMN IF NOT EXISTS "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "finalAmount" DECIMAL(65,30),
  ADD COLUMN IF NOT EXISTS "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

UPDATE "Invoice"
SET
  "originalAmount" = COALESCE("originalAmount", "amount"),
  "finalAmount" = COALESCE("finalAmount", "amount"),
  "paidAmount" = CASE
    WHEN "status" = 'PAID' THEN COALESCE("finalAmount", "amount")
    ELSE COALESCE("paidAmount", 0)
  END;

ALTER TABLE "Invoice"
  ALTER COLUMN "originalAmount" SET NOT NULL,
  ALTER COLUMN "finalAmount" SET NOT NULL;

ALTER TABLE "Invoice"
  DROP COLUMN IF EXISTS "amount";

DROP TABLE IF EXISTS "Refund";
DROP TABLE IF EXISTS "Payment";

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "method" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Refund" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Refund_tenantId_idx" ON "Refund"("tenantId");
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

ALTER TABLE "Refund"
  ADD CONSTRAINT "Refund_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Refund"
  ADD CONSTRAINT "Refund_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
