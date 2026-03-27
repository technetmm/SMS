import { prisma } from "@/lib/prisma/client";
import { requirePermission, requireTenant } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { TimetableForm } from "@/components/timetable/timetable-form";
import { createTimetableSlot } from "@/app/(school)/timetable/actions";
import { PERMISSIONS } from "@/lib/permission-keys";

export default async function CreateTimetablePage() {
  await requirePermission(PERMISSIONS.classUpdate);
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
      <PageHeader title="Create Timetable Slot" description="Add a weekly schedule block." />
      <TimetableForm
        mode="create"
        action={createTimetableSlot}
        staff={staff}
        sections={sections.map((section) => ({
          id: section.id,
          name: `${section.class.name} • ${section.name}`,
        }))}
      />
    </div>
  );
}

