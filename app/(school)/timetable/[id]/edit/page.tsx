import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { requirePermission, requireTenant } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { TimetableForm } from "@/components/timetable/timetable-form";
import { updateTimetableSlot } from "@/app/(school)/timetable/actions";
import { PERMISSIONS } from "@/lib/permission-keys";

export default async function EditTimetablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.classUpdate);
  const schoolId = await requireTenant();
  const { id } = await params;

  const [slot, staff, sections] = await Promise.all([
    prisma.timetable.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        staffId: true,
        sectionId: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        room: true,
      },
    }),
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

  if (!slot) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Timetable Slot" description="Update a weekly schedule block." />
      <TimetableForm
        mode="edit"
        action={updateTimetableSlot}
        staff={staff}
        sections={sections.map((section) => ({
          id: section.id,
          name: `${section.class.name} • ${section.name}`,
        }))}
        initialData={slot}
      />
    </div>
  );
}

