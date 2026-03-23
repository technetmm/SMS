import { Permission } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { requirePermission, requireTenant } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { TeacherAttendanceForm } from "@/components/teacher-attendance/teacher-attendance-form";
import { TeacherAttendanceTable } from "@/components/teacher-attendance/teacher-attendance-table";
import { markTeacherAttendance } from "@/app/(school)/teacher-attendance/actions";

export default async function TeacherAttendancePage() {
  await requirePermission(Permission.MANAGE_TEACHERS);
  const tenantId = await requireTenant();

  const [teachers, sections] = await Promise.all([
    prisma.teacher.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.section.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, class: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Attendance"
        description="Track teacher attendance per section, per day."
      />
      <TeacherAttendanceForm
        action={markTeacherAttendance}
        teachers={teachers}
        sections={sections.map((section) => ({
          id: section.id,
          name: `${section.class.name} • ${section.name}`,
        }))}
      />
      <TeacherAttendanceTable />
    </div>
  );
}

