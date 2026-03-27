import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TimetableTable } from "@/components/timetable/timetable-table";
import { DragDropWeekTimetable } from "@/components/timetable/drag-drop-week";
import { requirePermission } from "@/lib/rbac";
import { getTimetable } from "@/app/(school)/timetable/actions";
import { PERMISSIONS } from "@/lib/permission-keys";

export default async function TimetablePage() {
  await requirePermission(PERMISSIONS.classUpdate);
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
