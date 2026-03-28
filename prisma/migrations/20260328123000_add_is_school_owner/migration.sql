-- Add explicit owner marker for school admins.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isSchoolOwner" BOOLEAN NOT NULL DEFAULT false;

-- Backfill exactly one owner per school (earliest SCHOOL_ADMIN wins).
WITH ranked_school_admins AS (
  SELECT
    u."id",
    ROW_NUMBER() OVER (
      PARTITION BY u."schoolId"
      ORDER BY u."createdAt" ASC, u."id" ASC
    ) AS rn
  FROM "User" u
  WHERE u."schoolId" IS NOT NULL
    AND u."role" = 'SCHOOL_ADMIN'::"UserRole"
)
UPDATE "User" u
SET "isSchoolOwner" = (r.rn = 1)
FROM ranked_school_admins r
WHERE u."id" = r."id";

-- Non-school-admin users cannot be marked owner.
UPDATE "User"
SET "isSchoolOwner" = false
WHERE "role" <> 'SCHOOL_ADMIN'::"UserRole";
