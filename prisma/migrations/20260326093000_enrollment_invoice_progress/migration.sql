-- Enrollment updates
ALTER TABLE "Enrollment"
  ADD COLUMN "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Enrollment_tenantId_idx" ON "Enrollment"("tenantId");

ALTER TABLE "Enrollment"
  DROP COLUMN IF EXISTS "startDate",
  DROP COLUMN IF EXISTS "endDate";

-- Attendance updates: link attendance to enrollment instead of student+section
ALTER TABLE "Attendance"
  ADD COLUMN IF NOT EXISTS "enrollmentId" TEXT;

UPDATE "Attendance" AS a
SET "enrollmentId" = e."id"
FROM "Enrollment" AS e
WHERE e."studentId" = a."studentId"
  AND e."sectionId" = a."sectionId"
  AND a."enrollmentId" IS NULL;

DELETE FROM "Attendance" WHERE "enrollmentId" IS NULL;

ALTER TABLE "Attendance"
  ALTER COLUMN "enrollmentId" SET NOT NULL;

ALTER TABLE "Attendance"
  DROP CONSTRAINT IF EXISTS "Attendance_studentId_fkey",
  DROP CONSTRAINT IF EXISTS "Attendance_sectionId_fkey";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Attendance_studentId_sectionId_date_key'
  ) THEN
    ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentId_sectionId_date_key";
  END IF;
END $$;

ALTER TABLE "Attendance"
  DROP COLUMN IF EXISTS "studentId",
  DROP COLUMN IF EXISTS "sectionId";

ALTER TABLE "Attendance"
  ADD CONSTRAINT "Attendance_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_enrollmentId_date_key"
  ON "Attendance"("enrollmentId", "date");

DROP INDEX IF EXISTS "Attendance_sectionId_date_idx";
CREATE INDEX IF NOT EXISTS "Attendance_tenantId_date_idx"
  ON "Attendance"("tenantId", "date");
CREATE INDEX IF NOT EXISTS "Attendance_enrollmentId_idx"
  ON "Attendance"("enrollmentId");

-- Progress table
CREATE TABLE IF NOT EXISTS "Progress" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "progress" DOUBLE PRECISION NOT NULL,
  "remark" TEXT,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Progress_enrollmentId_key" ON "Progress"("enrollmentId");
CREATE INDEX IF NOT EXISTS "Progress_tenantId_idx" ON "Progress"("tenantId");
CREATE INDEX IF NOT EXISTS "Progress_enrollmentId_idx" ON "Progress"("enrollmentId");

ALTER TABLE "Progress"
  ADD CONSTRAINT "Progress_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Progress"
  ADD CONSTRAINT "Progress_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invoice table
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "dueDate" TIMESTAMP(3) NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_enrollmentId_key" ON "Invoice"("enrollmentId");
CREATE INDEX IF NOT EXISTS "Invoice_tenantId_idx" ON "Invoice"("tenantId");
CREATE INDEX IF NOT EXISTS "Invoice_studentId_idx" ON "Invoice"("studentId");
CREATE INDEX IF NOT EXISTS "Invoice_enrollmentId_idx" ON "Invoice"("enrollmentId");

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
