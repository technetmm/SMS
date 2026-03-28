-- Remove permission feature artifacts (safe + idempotent)

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RolePermission_roleId_fkey') THEN
    ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RolePermission_permissionId_fkey') THEN
    ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";
  END IF;
END $$;

DROP INDEX IF EXISTS "RolePermission_permissionId_idx";
DROP INDEX IF EXISTS "Permission_key_key";

DROP TABLE IF EXISTS "RolePermission";
DROP TABLE IF EXISTS "Permission";
