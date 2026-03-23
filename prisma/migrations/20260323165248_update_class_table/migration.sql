/*
  Warnings:

  - You are about to drop the `_CourseToSubject` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CourseToSubject" DROP CONSTRAINT "_CourseToSubject_A_fkey";

-- DropForeignKey
ALTER TABLE "_CourseToSubject" DROP CONSTRAINT "_CourseToSubject_B_fkey";

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "fee" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "_CourseToSubject";

-- CreateTable
CREATE TABLE "CourseSubject" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAttendance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "totalSections" INTEGER NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseSubject_tenantId_idx" ON "CourseSubject"("tenantId");

-- CreateIndex
CREATE INDEX "CourseSubject_courseId_idx" ON "CourseSubject"("courseId");

-- CreateIndex
CREATE INDEX "CourseSubject_subjectId_idx" ON "CourseSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSubject_courseId_subjectId_key" ON "CourseSubject"("courseId", "subjectId");

-- CreateIndex
CREATE INDEX "TeacherAttendance_tenantId_idx" ON "TeacherAttendance"("tenantId");

-- CreateIndex
CREATE INDEX "TeacherAttendance_teacherId_date_idx" ON "TeacherAttendance"("teacherId", "date");

-- CreateIndex
CREATE INDEX "TeacherAttendance_sectionId_date_idx" ON "TeacherAttendance"("sectionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAttendance_teacherId_sectionId_date_key" ON "TeacherAttendance"("teacherId", "sectionId", "date");

-- CreateIndex
CREATE INDEX "Timetable_tenantId_idx" ON "Timetable"("tenantId");

-- CreateIndex
CREATE INDEX "Timetable_teacherId_dayOfWeek_idx" ON "Timetable"("teacherId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Timetable_sectionId_dayOfWeek_idx" ON "Timetable"("sectionId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Payroll_tenantId_idx" ON "Payroll"("tenantId");

-- CreateIndex
CREATE INDEX "Payroll_teacherId_idx" ON "Payroll"("teacherId");

-- CreateIndex
CREATE INDEX "Payroll_month_idx" ON "Payroll"("month");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_teacherId_month_key" ON "Payroll"("teacherId", "month");

-- AddForeignKey
ALTER TABLE "CourseSubject" ADD CONSTRAINT "CourseSubject_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSubject" ADD CONSTRAINT "CourseSubject_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSubject" ADD CONSTRAINT "CourseSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendance" ADD CONSTRAINT "TeacherAttendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendance" ADD CONSTRAINT "TeacherAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendance" ADD CONSTRAINT "TeacherAttendance_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
