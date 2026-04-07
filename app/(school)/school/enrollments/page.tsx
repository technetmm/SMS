import Link from "next/link";
import { requireSchoolAdminAccess } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EnrollmentTable } from "@/components/enrollments/enrollment-table";
import { parsePageParam } from "@/lib/pagination";

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireSchoolAdminAccess();
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Manage student enrollment, billing, attendance, and progress by section."
        actions={
          <Button asChild>
            <Link href="/school/enrollments/create">New Enrollment</Link>
          </Button>
        }
      />
      <EnrollmentTable page={page} />
    </div>
  );
}
