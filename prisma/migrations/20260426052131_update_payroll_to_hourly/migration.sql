-- AlterTable
ALTER TABLE "Staff" RENAME COLUMN "ratePerSection" TO "ratePerHour";

-- AlterTable
ALTER TABLE "Payroll" RENAME COLUMN "totalSections" TO "totalHours";
