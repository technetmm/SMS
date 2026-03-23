-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'MMK', 'THB');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "feeCurrency" "Currency" NOT NULL DEFAULT 'MMK';
