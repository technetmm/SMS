import { prisma } from "@/lib/prisma/client";
import { requirePermission, requireTenant } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { StaffAttendanceForm } from "@/components/staff-attendance/staff-attendance-form";
import { StaffAttendanceTable } from "@/components/staff-attendance/staff-attendance-table";
import { markStaffAttendance } from "@/app/(school)/staff-attendance/actions";
import { PERMISSIONS } from "@/lib/permission-keys";

export default async function StaffAttendancePage() {
  await requirePermission(PERMISSIONS.staffUpdate);
  const schoolId = await requireTenant();

  const [staff, sections] = await Promise.all([
    prisma.staff.findMany({
      where: { schoolId, isDeleted: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.section.findMany({
      where: { schoolId, isDeleted: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, class: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Attendance"
        description="Track staff attendance per section, per day."
      />
      <StaffAttendanceForm
        action={markStaffAttendance}
        staff={staff}
        sections={sections.map((section) => ({
          id: section.id,
          name: `${section.class.name} • ${section.name}`,
        }))}
      />
      <StaffAttendanceTable />
    </div>
  );
}

