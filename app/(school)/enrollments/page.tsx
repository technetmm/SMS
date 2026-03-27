import Link from "next/link";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EnrollmentTable } from "@/components/enrollments/enrollment-table";
import { PERMISSIONS } from "@/lib/permission-keys";

export default async function EnrollmentsPage() {
  await requirePermission(PERMISSIONS.classUpdate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Manage student enrollment, billing, attendance, and progress by section."
        actions={
          <Button asChild>
            <Link href="/enrollments/create">New Enrollment</Link>
          </Button>
        }
      />
      <EnrollmentTable />
    </div>
  );
}
