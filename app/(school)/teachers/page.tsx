import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TeacherTable } from "@/components/teachers/teacher-table";
import { ExportMenu } from "@/components/shared/export-menu";
import { exportTeachersToExcel } from "@/app/(school)/exports/actions";

export default async function TeachersPage() {
  await requireSchoolAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Create and manage teacher accounts."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              items={[
                { label: "Export Excel", action: exportTeachersToExcel },
              ]}
            />
            <Button asChild>
              <Link href="/teachers/create">New Teacher</Link>
            </Button>
          </div>
        }
      />
      <TeacherTable />
    </div>
  );
}
