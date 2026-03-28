-- Remove deprecated dynamic role management tables.
-- Guarded to avoid shadow-db and partial-state failures.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'UserRoleAssignment'
      AND constraint_name = 'UserRoleAssignment_roleId_fkey'
  ) THEN
    ALTER TABLE "UserRoleAssignment" DROP CONSTRAINT "UserRoleAssignment_roleId_fkey";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'UserRoleAssignment'
      AND constraint_name = 'UserRoleAssignment_userId_fkey'
  ) THEN
    ALTER TABLE "UserRoleAssignment" DROP CONSTRAINT "UserRoleAssignment_userId_fkey";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'Role'
      AND constraint_name = 'Role_schoolId_fkey'
  ) THEN
    ALTER TABLE "Role" DROP CONSTRAINT "Role_schoolId_fkey";
  END IF;
END $$;

DROP INDEX IF EXISTS "UserRoleAssignment_userId_roleId_key";
DROP INDEX IF EXISTS "UserRoleAssignment_roleId_idx";
DROP INDEX IF EXISTS "Role_schoolId_name_key";
DROP INDEX IF EXISTS "Role_schoolId_idx";

DROP TABLE IF EXISTS "UserRoleAssignment";
DROP TABLE IF EXISTS "Role";
