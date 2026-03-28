/*
  Warnings:

  - You are about to drop the column `legacyRole` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `LegacyRolePermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LegacyUserPermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LegacyUserPermission" DROP CONSTRAINT "LegacyUserPermission_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "legacyRole";

-- DropTable
DROP TABLE "LegacyRolePermission";

-- DropTable
DROP TABLE "LegacyUserPermission";
