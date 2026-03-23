/*
  Warnings:

  - You are about to drop the column `subject` on the `Course` table. All the data in the column will be lost.
  - Added the required column `subjectId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dob` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dob` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hireDate` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobTitle` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maritalStatus` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nrcNumber` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED');

-- CreateEnum
CREATE TYPE "TeacherStatus" AS ENUM ('ACTIVE', 'ONLEAVE', 'RESIGNED', 'TERMINATED');

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "subject",
ADD COLUMN     "subjectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "address" TEXT,
ADD COLUMN     "dob" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "motherName" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "currentAddress" TEXT,
ADD COLUMN     "dob" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "exitDate" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "hireDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "jobTitle" TEXT NOT NULL,
ADD COLUMN     "maritalStatus" "MaritalStatus" NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "nrcNumber" TEXT NOT NULL,
ADD COLUMN     "parmentAddress" TEXT,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "status" "TeacherStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "yearOfService" INTEGER;

-- DropEnum
DROP TYPE "Subject";

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
