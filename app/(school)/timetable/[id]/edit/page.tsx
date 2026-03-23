import { notFound } from "next/navigation";
import { Permission } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma/client";
import { requirePermission, requireTenant } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { TimetableForm } from "@/components/timetable/timetable-form";
import { updateTimetableSlot } from "@/app/(school)/timetable/actions";

export default async function EditTimetablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(Permission.MANAGE_CLASSES);
  const tenantId = await requireTenant();
  const { id } = await params;

  const [slot, teachers, sections] = await Promise.all([
    prisma.timetable.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        teacherId: true,
        sectionId: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        room: true,
      },
    }),
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

  if (!slot) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Timetable Slot" description="Update a weekly schedule block." />
      <TimetableForm
        mode="edit"
        action={updateTimetableSlot}
        teachers={teachers}
        sections={sections.map((section) => ({
          id: section.id,
          name: `${section.class.name} • ${section.name}`,
        }))}
        initialData={slot}
      />
    </div>
  );
}

