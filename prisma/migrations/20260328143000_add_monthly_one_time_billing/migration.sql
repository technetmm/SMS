-- Add monthly + one-time billing support.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BillingType') THEN
    CREATE TYPE "BillingType" AS ENUM ('ONE_TIME', 'MONTHLY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvoiceType') THEN
    CREATE TYPE "InvoiceType" AS ENUM ('ONE_TIME', 'MONTHLY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DiscountType') THEN
    CREATE TYPE "DiscountType" AS ENUM ('NONE', 'FIXED', 'PERCENT');
  END IF;
END $$;

ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "billingDayOfMonth" INTEGER NOT NULL DEFAULT 5;

ALTER TABLE "Class"
  ADD COLUMN IF NOT EXISTS "billingType" "BillingType" NOT NULL DEFAULT 'ONE_TIME';

ALTER TABLE "Enrollment"
  ADD COLUMN IF NOT EXISTS "billingType" "BillingType" NOT NULL DEFAULT 'ONE_TIME',
  ADD COLUMN IF NOT EXISTS "billingDayOfMonth" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "monthlyBillingActive" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "monthlyStartYear" INTEGER,
  ADD COLUMN IF NOT EXISTS "monthlyStartMonth" INTEGER,
  ADD COLUMN IF NOT EXISTS "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "discountValue" DECIMAL NOT NULL DEFAULT 0;

-- Initialize enrollment billing metadata from tenant defaults.
UPDATE "Enrollment" e
SET "billingDayOfMonth" = COALESCE(t."billingDayOfMonth", 5)
FROM "Tenant" t
WHERE e."schoolId" = t."id";

ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "invoiceType" "InvoiceType" NOT NULL DEFAULT 'ONE_TIME',
  ADD COLUMN IF NOT EXISTS "billingYear" INTEGER,
  ADD COLUMN IF NOT EXISTS "billingMonth" INTEGER;

-- Backfill invoice period from dueDate for existing rows.
UPDATE "Invoice"
SET
  "billingYear" = EXTRACT(YEAR FROM "dueDate")::int,
  "billingMonth" = EXTRACT(MONTH FROM "dueDate")::int
WHERE "billingYear" IS NULL OR "billingMonth" IS NULL;

DROP INDEX IF EXISTS "Invoice_enrollmentId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_enrollmentId_billingYear_billingMonth_key"
  ON "Invoice"("enrollmentId", "billingYear", "billingMonth");
