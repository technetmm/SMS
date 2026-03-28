import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TimetableTable } from "@/components/timetable/timetable-table";
import { DragDropWeekTimetable } from "@/components/timetable/drag-drop-week";
import { requireSchoolAdminAccess } from "@/lib/rbac";
import { getTimetable } from "@/app/(school)/timetable/actions";

export default async function TimetablePage() {
  await requireSchoolAdminAccess();
  const slots = await getTimetable();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        description="Manage weekly schedules and prevent staff conflicts."
        actions={
          <Button asChild>
            <Link href="/timetable/create">Create Slot</Link>
          </Button>
        }
      />
      <DragDropWeekTimetable slots={slots} />
      <TimetableTable slots={slots} />
    </div>
  );
}
