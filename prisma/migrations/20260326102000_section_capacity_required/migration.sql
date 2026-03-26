UPDATE "Section"
SET "capacity" = 30
WHERE "capacity" IS NULL;

ALTER TABLE "Section"
  ALTER COLUMN "capacity" SET DEFAULT 30,
  ALTER COLUMN "capacity" SET NOT NULL;
