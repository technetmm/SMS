/*
  Warnings:

  - You are about to drop the column `legacyRole` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `LegacyRolePermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LegacyUserPermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE IF EXISTS "LegacyUserPermission" DROP CONSTRAINT IF EXISTS "LegacyUserPermission_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "legacyRole";

-- DropTable
DROP TABLE IF EXISTS "LegacyRolePermission";

-- DropTable
DROP TABLE IF EXISTS "LegacyUserPermission";

-- RenameForeignKey
ALTER TABLE "Attendance" RENAME CONSTRAINT "Attendance_tenantId_fkey" TO "Attendance_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "AuditLog" RENAME CONSTRAINT "AuditLog_tenantId_fkey" TO "AuditLog_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Branch" RENAME CONSTRAINT "Branch_tenantId_fkey" TO "Branch_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Class" RENAME CONSTRAINT "Class_tenantId_fkey" TO "Class_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Course" RENAME CONSTRAINT "Course_tenantId_fkey" TO "Course_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "CourseSubject" RENAME CONSTRAINT "CourseSubject_tenantId_fkey" TO "CourseSubject_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Enrollment" RENAME CONSTRAINT "Enrollment_tenantId_fkey" TO "Enrollment_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Invoice" RENAME CONSTRAINT "Invoice_tenantId_fkey" TO "Invoice_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Payment" RENAME CONSTRAINT "Payment_tenantId_fkey" TO "Payment_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Payroll" RENAME CONSTRAINT "Payroll_tenantId_fkey" TO "Payroll_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Progress" RENAME CONSTRAINT "Progress_tenantId_fkey" TO "Progress_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Refund" RENAME CONSTRAINT "Refund_tenantId_fkey" TO "Refund_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Section" RENAME CONSTRAINT "Section_tenantId_fkey" TO "Section_schoolId_fkey";

-- RenameForeignKey
DO $$
BEGIN
  IF to_regclass('"Staff"') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'Staff_tenantId_fkey'
        AND conrelid = to_regclass('"Staff"')
    ) THEN
      ALTER TABLE "Staff" RENAME CONSTRAINT "Staff_tenantId_fkey" TO "Staff_schoolId_fkey";
    END IF;
  ELSIF to_regclass('"Teacher"') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'Teacher_tenantId_fkey'
        AND conrelid = to_regclass('"Teacher"')
    ) THEN
      ALTER TABLE "Teacher" RENAME CONSTRAINT "Teacher_tenantId_fkey" TO "Staff_schoolId_fkey";
    END IF;
  END IF;
END $$;

-- RenameForeignKey
DO $$
BEGIN
  IF to_regclass('"StaffAttendance"') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'StaffAttendance_tenantId_fkey'
        AND conrelid = to_regclass('"StaffAttendance"')
    ) THEN
      ALTER TABLE "StaffAttendance" RENAME CONSTRAINT "StaffAttendance_tenantId_fkey" TO "StaffAttendance_schoolId_fkey";
    END IF;
  ELSIF to_regclass('"TeacherAttendance"') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'TeacherAttendance_tenantId_fkey'
        AND conrelid = to_regclass('"TeacherAttendance"')
    ) THEN
      ALTER TABLE "TeacherAttendance" RENAME CONSTRAINT "TeacherAttendance_tenantId_fkey" TO "StaffAttendance_schoolId_fkey";
    END IF;
  END IF;
END $$;

-- RenameForeignKey
ALTER TABLE "Student" RENAME CONSTRAINT "Student_tenantId_fkey" TO "Student_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Subject" RENAME CONSTRAINT "Subject_tenantId_fkey" TO "Subject_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Subscription" RENAME CONSTRAINT "Subscription_tenantId_fkey" TO "Subscription_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "Timetable" RENAME CONSTRAINT "Timetable_tenantId_fkey" TO "Timetable_schoolId_fkey";

-- RenameForeignKey
ALTER TABLE "User" RENAME CONSTRAINT "User_tenantId_fkey" TO "User_schoolId_fkey";

-- RenameIndex
ALTER INDEX "Attendance_tenantId_date_idx" RENAME TO "Attendance_schoolId_date_idx";

-- RenameIndex
ALTER INDEX "AuditLog_tenantId_idx" RENAME TO "AuditLog_schoolId_idx";

-- RenameIndex
ALTER INDEX "Branch_tenantId_idx" RENAME TO "Branch_schoolId_idx";

-- RenameIndex
ALTER INDEX "Branch_tenantId_name_key" RENAME TO "Branch_schoolId_name_key";

-- RenameIndex
ALTER INDEX "Class_tenantId_idx" RENAME TO "Class_schoolId_idx";

-- RenameIndex
ALTER INDEX "Course_tenantId_idx" RENAME TO "Course_schoolId_idx";

-- RenameIndex
ALTER INDEX "Course_tenantId_name_key" RENAME TO "Course_schoolId_name_key";

-- RenameIndex
ALTER INDEX "CourseSubject_tenantId_idx" RENAME TO "CourseSubject_schoolId_idx";

-- RenameIndex
ALTER INDEX "Enrollment_tenantId_idx" RENAME TO "Enrollment_schoolId_idx";

-- RenameIndex
ALTER INDEX "Invoice_tenantId_idx" RENAME TO "Invoice_schoolId_idx";

-- RenameIndex
ALTER INDEX "Payment_tenantId_idx" RENAME TO "Payment_schoolId_idx";

-- RenameIndex
ALTER INDEX "Payroll_tenantId_idx" RENAME TO "Payroll_schoolId_idx";

-- RenameIndex
ALTER INDEX "Progress_tenantId_idx" RENAME TO "Progress_schoolId_idx";

-- RenameIndex
ALTER INDEX "Refund_tenantId_idx" RENAME TO "Refund_schoolId_idx";

-- RenameIndex
ALTER INDEX "Section_tenantId_idx" RENAME TO "Section_schoolId_idx";

-- RenameIndex
DO $$
BEGIN
  IF to_regclass('"Staff_tenantId_idx"') IS NOT NULL
     AND to_regclass('"Staff_schoolId_idx"') IS NULL THEN
    ALTER INDEX "Staff_tenantId_idx" RENAME TO "Staff_schoolId_idx";
  ELSIF to_regclass('"Teacher_tenantId_idx"') IS NOT NULL
     AND to_regclass('"Staff_schoolId_idx"') IS NULL THEN
    ALTER INDEX "Teacher_tenantId_idx" RENAME TO "Staff_schoolId_idx";
  END IF;
END $$;

-- RenameIndex
DO $$
BEGIN
  IF to_regclass('"StaffAttendance_tenantId_idx"') IS NOT NULL
     AND to_regclass('"StaffAttendance_schoolId_idx"') IS NULL THEN
    ALTER INDEX "StaffAttendance_tenantId_idx" RENAME TO "StaffAttendance_schoolId_idx";
  ELSIF to_regclass('"TeacherAttendance_tenantId_idx"') IS NOT NULL
     AND to_regclass('"StaffAttendance_schoolId_idx"') IS NULL THEN
    ALTER INDEX "TeacherAttendance_tenantId_idx" RENAME TO "StaffAttendance_schoolId_idx";
  END IF;
END $$;

-- RenameIndex
ALTER INDEX "Student_tenantId_idx" RENAME TO "Student_schoolId_idx";

-- RenameIndex
ALTER INDEX "Subject_tenantId_name_key" RENAME TO "Subject_schoolId_name_key";

-- RenameIndex
ALTER INDEX "Timetable_tenantId_idx" RENAME TO "Timetable_schoolId_idx";
