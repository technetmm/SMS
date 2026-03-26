import Link from "next/link";
import { Permission } from "@/app/generated/prisma/enums";
import { requirePermission } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EnrollmentTable } from "@/components/enrollments/enrollment-table";

export default async function EnrollmentsPage() {
  await requirePermission(Permission.MANAGE_CLASSES);

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
