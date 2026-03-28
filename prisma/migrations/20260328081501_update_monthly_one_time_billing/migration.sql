-- Guarded alter for environments where discountValue may not exist yet.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Enrollment'
      AND column_name = 'discountValue'
  ) THEN
    ALTER TABLE "Enrollment"
    ALTER COLUMN "discountValue" TYPE DECIMAL(65,30);
  END IF;
END $$;
