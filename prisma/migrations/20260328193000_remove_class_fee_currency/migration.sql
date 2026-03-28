-- Remove class fee currency to enforce MMK-only pricing.
ALTER TABLE "Class"
DROP COLUMN IF EXISTS "feeCurrency";
