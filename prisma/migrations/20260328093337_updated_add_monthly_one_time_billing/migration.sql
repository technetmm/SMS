/*
  Warnings:

  - You are about to alter the column `discountValue` on the `Enrollment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "Enrollment" ALTER COLUMN "discountValue" SET DATA TYPE DECIMAL(65,30);
