import { PageHeader } from "@/components/shared/page-header";
import { StudentDialog } from "@/components/shared/student-dialog";
import { StudentsTable } from "@/components/shared/students-table";

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Create, manage, and enroll students into classes."
        actions={<StudentDialog />}
      />
      <StudentsTable />
    </div>
  );
}
