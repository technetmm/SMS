-- Dynamic RBAC + schoolId migration (data-preserving)

-- 1) Keep legacy permission tables under new names to avoid data loss and free table names.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='RolePermission')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='LegacyRolePermission') THEN
    ALTER TABLE "RolePermission" RENAME TO "LegacyRolePermission";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='UserPermission')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='LegacyUserPermission') THEN
    ALTER TABLE "UserPermission" RENAME TO "LegacyUserPermission";
  END IF;
END $$;

-- Rename preserved legacy constraints/indexes to avoid name collisions.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RolePermission_pkey') THEN
    ALTER TABLE "LegacyRolePermission" RENAME CONSTRAINT "RolePermission_pkey" TO "LegacyRolePermission_pkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserPermission_pkey') THEN
    ALTER TABLE "LegacyUserPermission" RENAME CONSTRAINT "UserPermission_pkey" TO "LegacyUserPermission_pkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserPermission_userId_fkey') THEN
    ALTER TABLE "LegacyUserPermission" RENAME CONSTRAINT "UserPermission_userId_fkey" TO "LegacyUserPermission_userId_fkey";
  END IF;
END $$;

ALTER INDEX IF EXISTS "RolePermission_role_permission_key" RENAME TO "LegacyRolePermission_role_permission_key";
ALTER INDEX IF EXISTS "UserPermission_userId_permission_key" RENAME TO "LegacyUserPermission_userId_permission_key";

-- Detach legacy tables from enums that will be replaced.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='LegacyRolePermission' AND column_name='role') THEN
    ALTER TABLE "LegacyRolePermission" ALTER COLUMN "role" TYPE TEXT USING "role"::text;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='LegacyRolePermission' AND column_name='permission') THEN
    ALTER TABLE "LegacyRolePermission" ALTER COLUMN "permission" TYPE TEXT USING "permission"::text;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='LegacyUserPermission' AND column_name='permission') THEN
    ALTER TABLE "LegacyUserPermission" ALTER COLUMN "permission" TYPE TEXT USING "permission"::text;
  END IF;
END $$;

-- 2) tenantId -> schoolId (column rename, no table recreation)
DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User','Branch','Subscription','Staff','Student','Subject','Course','CourseSubject','Class',
    'StaffAttendance','Timetable','Payroll','Section','Enrollment','Attendance','Progress',
    'Invoice','Payment','Refund','AuditLog'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=t AND column_name='tenantId'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=t AND column_name='schoolId'
    ) THEN
      EXECUTE format('ALTER TABLE "%s" RENAME COLUMN "tenantId" TO "schoolId"', t);
    END IF;
  END LOOP;
END $$;

-- 3) Prepare role conversion context before shrinking UserRole enum.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "legacyRole" TEXT;
UPDATE "User"
SET "legacyRole" = "role"::text
WHERE "legacyRole" IS NULL;

-- 4) Convert UserRole enum to SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='UserRole_new') THEN
    CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT');
  END IF;
END $$;

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE "role"::text
      WHEN 'STAFF' THEN 'TEACHER'
      WHEN 'ADMIN' THEN 'SCHOOL_ADMIN'
      ELSE "role"::text
    END::"UserRole_new"
  );

DROP TYPE IF EXISTS "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT 'SCHOOL_ADMIN'::"UserRole";

-- Drop legacy enum type so table "Permission" can be created.
DROP TYPE IF EXISTS "Permission";

-- 5) New RBAC tables.
CREATE TABLE IF NOT EXISTS "Role" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Permission" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RolePermission" (
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

CREATE TABLE IF NOT EXISTS "UserRoleAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Role_schoolId_name_key" ON "Role"("schoolId","name");
CREATE INDEX IF NOT EXISTS "Role_schoolId_idx" ON "Role"("schoolId");
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_key_key" ON "Permission"("key");
CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserRoleAssignment_userId_roleId_key" ON "UserRoleAssignment"("userId","roleId");
CREATE INDEX IF NOT EXISTS "UserRoleAssignment_roleId_idx" ON "UserRoleAssignment"("roleId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Role_schoolId_fkey') THEN
    ALTER TABLE "Role" ADD CONSTRAINT "Role_schoolId_fkey"
      FOREIGN KEY ("schoolId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='RolePermission_roleId_fkey') THEN
    ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey"
      FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='RolePermission_permissionId_fkey') THEN
    ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey"
      FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='UserRoleAssignment_userId_fkey') THEN
    ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='UserRoleAssignment_roleId_fkey') THEN
    ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_roleId_fkey"
      FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 6) Seed permission catalog.
INSERT INTO "Permission" ("id", "key", "category", "createdAt", "updatedAt") VALUES
  (md5(random()::text || clock_timestamp()::text), 'user.view', 'User', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'user.create', 'User', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'user.update', 'User', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'user.delete', 'User', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'user.assign_role', 'User', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'student.view', 'Student', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'student.create', 'Student', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'student.update', 'Student', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'student.delete', 'Student', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'staff.view', 'Staff', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'staff.create', 'Staff', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'staff.update', 'Staff', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'staff.delete', 'Staff', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'class.view', 'Class', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'class.create', 'Class', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'class.update', 'Class', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'class.delete', 'Class', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'section.manage', 'Class', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'attendance.view', 'Attendance', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'attendance.mark', 'Attendance', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'attendance.update', 'Attendance', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'fee.view', 'Finance', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'fee.collect', 'Finance', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'fee.update', 'Finance', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'fee.report', 'Finance', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'subject.manage', 'Academic', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'exam.manage', 'Academic', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'result.manage', 'Academic', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'payroll.view', 'Payroll', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'payroll.process', 'Payroll', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'settings.view', 'Settings', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'settings.update', 'Settings', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'role.view', 'Role', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'role.create', 'Role', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'role.update', 'Role', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'role.delete', 'Role', NOW(), NOW()),
  (md5(random()::text || clock_timestamp()::text), 'permission.assign', 'Role', NOW(), NOW())
ON CONFLICT ("key") DO NOTHING;

-- 7) Create default system roles per school.
INSERT INTO "Role" ("id", "name", "schoolId", "isSystem", "createdAt", "updatedAt")
SELECT md5(random()::text || clock_timestamp()::text), role_name, t."id", true, NOW(), NOW()
FROM "Tenant" t
CROSS JOIN (VALUES
  ('Admin Staff'), ('Teacher'), ('HR'), ('Accountant'), ('Receptionist'), ('Student')
) AS r(role_name)
ON CONFLICT ("schoolId","name") DO NOTHING;

-- 8) Grant all permissions to Admin Staff.
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "Role" r
JOIN "Permission" p ON TRUE
WHERE r."name" = 'Admin Staff'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 9) Auto-map legacy users to default roles.
INSERT INTO "UserRoleAssignment" ("id", "userId", "roleId", "createdAt")
SELECT md5(random()::text || clock_timestamp()::text), u."id", r."id", NOW()
FROM "User" u
JOIN "Role" r
  ON r."schoolId" = u."schoolId"
 AND (
   (u."legacyRole" = 'STAFF' AND r."name" = 'Teacher') OR
   (u."legacyRole" = 'STUDENT' AND r."name" = 'Student')
 )
ON CONFLICT ("userId","roleId") DO NOTHING;

-- 10) Backfill system role from profile relationships (safety net).
UPDATE "User" u
SET "role" = 'TEACHER'::"UserRole"
WHERE u."id" IN (SELECT s."userId" FROM "Staff" s WHERE s."userId" IS NOT NULL)
  AND u."role" <> 'SUPER_ADMIN'::"UserRole";

UPDATE "User" u
SET "role" = 'STUDENT'::"UserRole"
WHERE u."id" IN (SELECT s."userId" FROM "Student" s WHERE s."userId" IS NOT NULL)
  AND u."role" <> 'SUPER_ADMIN'::"UserRole";
