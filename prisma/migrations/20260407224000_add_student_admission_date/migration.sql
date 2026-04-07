ALTER TABLE "Student"
ADD COLUMN "admissionDate" TIMESTAMP(3);

UPDATE "Student"
SET "admissionDate" = "createdAt"
WHERE "admissionDate" IS NULL;

ALTER TABLE "Student"
ALTER COLUMN "admissionDate" SET NOT NULL;
