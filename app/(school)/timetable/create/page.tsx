import { Permission } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { requirePermission, requireTenant } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { TimetableForm } from "@/components/timetable/timetable-form";
import { createTimetableSlot } from "@/app/(school)/timetable/actions";

export default async function CreateTimetablePage() {
  await requirePermission(Permission.MANAGE_CLASSES);
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
      <PageHeader title="Create Timetable Slot" description="Add a weekly schedule block." />
      <TimetableForm
        mode="create"
        action={createTimetableSlot}
        teachers={teachers}
        sections={sections.map((section) => ({
          id: section.id,
          name: `${section.class.name} • ${section.name}`,
        }))}
      />
    </div>
  );
}

