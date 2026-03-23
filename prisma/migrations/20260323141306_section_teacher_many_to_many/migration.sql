/*
  Warnings:

  - You are about to drop the column `teacherId` on the `Section` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_teacherId_fkey";

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "teacherId";

-- CreateTable
CREATE TABLE "SectionTeacher" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "SectionTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SectionTeacher_sectionId_idx" ON "SectionTeacher"("sectionId");

-- CreateIndex
CREATE INDEX "SectionTeacher_teacherId_idx" ON "SectionTeacher"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionTeacher_sectionId_teacherId_key" ON "SectionTeacher"("sectionId", "teacherId");

-- AddForeignKey
ALTER TABLE "SectionTeacher" ADD CONSTRAINT "SectionTeacher_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionTeacher" ADD CONSTRAINT "SectionTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
