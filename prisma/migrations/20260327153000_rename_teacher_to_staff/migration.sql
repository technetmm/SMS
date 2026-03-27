-- Safe, data-preserving rename migration: Teacher -> Staff
-- This migration intentionally avoids DROP/CREATE for renamed objects.

-- 1) Enum and enum value renames (role + permissions + status type)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'UserRole' AND e.enumlabel = 'TEACHER')
     AND NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'UserRole' AND e.enumlabel = 'STAFF') THEN
    ALTER TYPE "UserRole" RENAME VALUE 'TEACHER' TO 'STAFF';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'Permission' AND e.enumlabel = 'MANAGE_TEACHERS')
     AND NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'Permission' AND e.enumlabel = 'MANAGE_STAFF') THEN
    ALTER TYPE "Permission" RENAME VALUE 'MANAGE_TEACHERS' TO 'MANAGE_STAFF';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TeacherStatus')
     AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StaffStatus') THEN
    ALTER TYPE "TeacherStatus" RENAME TO "StaffStatus";
  END IF;
END $$;

-- 2) Table renames
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Teacher')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Staff') THEN
    ALTER TABLE "Teacher" RENAME TO "Staff";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TeacherAttendance')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'StaffAttendance') THEN
    ALTER TABLE "TeacherAttendance" RENAME TO "StaffAttendance";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SectionTeacher')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SectionStaff') THEN
    ALTER TABLE "SectionTeacher" RENAME TO "SectionStaff";
  END IF;
END $$;

-- 3) Column renames
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Section' AND column_name = 'teacherId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Section' AND column_name = 'staffId') THEN
    ALTER TABLE "Section" RENAME COLUMN "teacherId" TO "staffId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'StaffAttendance' AND column_name = 'teacherId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'StaffAttendance' AND column_name = 'staffId') THEN
    ALTER TABLE "StaffAttendance" RENAME COLUMN "teacherId" TO "staffId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Timetable' AND column_name = 'teacherId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Timetable' AND column_name = 'staffId') THEN
    ALTER TABLE "Timetable" RENAME COLUMN "teacherId" TO "staffId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Payroll' AND column_name = 'teacherId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Payroll' AND column_name = 'staffId') THEN
    ALTER TABLE "Payroll" RENAME COLUMN "teacherId" TO "staffId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SectionStaff' AND column_name = 'teacherId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SectionStaff' AND column_name = 'staffId') THEN
    ALTER TABLE "SectionStaff" RENAME COLUMN "teacherId" TO "staffId";
  END IF;
END $$;

-- 4) Constraint renames (optional but keeps schema aligned with Prisma naming)
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Teacher_pkey') THEN ALTER TABLE "Staff" RENAME CONSTRAINT "Teacher_pkey" TO "Staff_pkey"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Teacher_userId_key') THEN ALTER TABLE "Staff" RENAME CONSTRAINT "Teacher_userId_key" TO "Staff_userId_key"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Teacher_userId_fkey') THEN ALTER TABLE "Staff" RENAME CONSTRAINT "Teacher_userId_fkey" TO "Staff_userId_fkey"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Teacher_tenantId_fkey') THEN ALTER TABLE "Staff" RENAME CONSTRAINT "Teacher_tenantId_fkey" TO "Staff_tenantId_fkey"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Teacher_branchId_fkey') THEN ALTER TABLE "Staff" RENAME CONSTRAINT "Teacher_branchId_fkey" TO "Staff_branchId_fkey"; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherAttendance_pkey') THEN ALTER TABLE "StaffAttendance" RENAME CONSTRAINT "TeacherAttendance_pkey" TO "StaffAttendance_pkey"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherAttendance_tenantId_fkey') THEN ALTER TABLE "StaffAttendance" RENAME CONSTRAINT "TeacherAttendance_tenantId_fkey" TO "StaffAttendance_tenantId_fkey"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherAttendance_teacherId_fkey') THEN ALTER TABLE "StaffAttendance" RENAME CONSTRAINT "TeacherAttendance_teacherId_fkey" TO "StaffAttendance_staffId_fkey"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TeacherAttendance_sectionId_fkey') THEN ALTER TABLE "StaffAttendance" RENAME CONSTRAINT "TeacherAttendance_sectionId_fkey" TO "StaffAttendance_sectionId_fkey"; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SectionTeacher_pkey') THEN ALTER TABLE "SectionStaff" RENAME CONSTRAINT "SectionTeacher_pkey" TO "SectionStaff_pkey"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SectionTeacher_sectionId_fkey') THEN ALTER TABLE "SectionStaff" RENAME CONSTRAINT "SectionTeacher_sectionId_fkey" TO "SectionStaff_sectionId_fkey"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SectionTeacher_teacherId_fkey') THEN ALTER TABLE "SectionStaff" RENAME CONSTRAINT "SectionTeacher_teacherId_fkey" TO "SectionStaff_staffId_fkey"; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Timetable_teacherId_fkey') THEN ALTER TABLE "Timetable" RENAME CONSTRAINT "Timetable_teacherId_fkey" TO "Timetable_staffId_fkey"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payroll_teacherId_fkey') THEN ALTER TABLE "Payroll" RENAME CONSTRAINT "Payroll_teacherId_fkey" TO "Payroll_staffId_fkey"; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Section_teacherId_fkey') THEN ALTER TABLE "Section" RENAME CONSTRAINT "Section_teacherId_fkey" TO "Section_staffId_fkey"; END IF; END $$;

-- 5) Index renames
ALTER INDEX IF EXISTS "Teacher_tenantId_idx" RENAME TO "Staff_tenantId_idx";
ALTER INDEX IF EXISTS "Teacher_userId_key" RENAME TO "Staff_userId_key";
ALTER INDEX IF EXISTS "SectionTeacher_sectionId_idx" RENAME TO "SectionStaff_sectionId_idx";
ALTER INDEX IF EXISTS "SectionTeacher_teacherId_idx" RENAME TO "SectionStaff_staffId_idx";
ALTER INDEX IF EXISTS "SectionTeacher_sectionId_teacherId_key" RENAME TO "SectionStaff_sectionId_staffId_key";
ALTER INDEX IF EXISTS "TeacherAttendance_tenantId_idx" RENAME TO "StaffAttendance_tenantId_idx";
ALTER INDEX IF EXISTS "TeacherAttendance_teacherId_date_idx" RENAME TO "StaffAttendance_staffId_date_idx";
ALTER INDEX IF EXISTS "TeacherAttendance_sectionId_date_idx" RENAME TO "StaffAttendance_sectionId_date_idx";
ALTER INDEX IF EXISTS "TeacherAttendance_teacherId_sectionId_date_key" RENAME TO "StaffAttendance_staffId_sectionId_date_key";
ALTER INDEX IF EXISTS "Timetable_teacherId_dayOfWeek_idx" RENAME TO "Timetable_staffId_dayOfWeek_idx";
ALTER INDEX IF EXISTS "Payroll_teacherId_idx" RENAME TO "Payroll_staffId_idx";
ALTER INDEX IF EXISTS "Payroll_teacherId_month_key" RENAME TO "Payroll_staffId_month_key";
ALTER INDEX IF EXISTS "Section_teacherId_idx" RENAME TO "Section_staffId_idx";

-- 6) Optional cleanup for old unique/index naming on Section if present
ALTER INDEX IF EXISTS "Section_teacherId_key" RENAME TO "Section_staffId_key";
