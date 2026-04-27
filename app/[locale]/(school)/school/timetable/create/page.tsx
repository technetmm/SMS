import { requireSchoolAdminAccess } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { TimetableForm } from "@/components/timetable/timetable-form";
import {
  createTimetableSlot,
  getAssignedStaffs,
} from "@/app/(school)/school/timetable/actions";

export default async function CreateTimetablePage() {
  await requireSchoolAdminAccess();

  const staff = await getAssignedStaffs();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Timetable Slot"
        description="Add a weekly schedule block."
      />
      <TimetableForm mode="create" action={createTimetableSlot} staff={staff} />
    </div>
  );
}
