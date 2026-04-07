import Link from "next/link";
import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { StaffTable } from "@/components/staff/staff-table";
import { ExportMenu } from "@/components/shared/export-menu";
import { exportStaffToExcel } from "@/app/(school)/school/exports/actions";
import { parsePageParam } from "@/lib/pagination";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireSchoolAdmin();
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Create and manage staff accounts."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              items={[{ label: "Export Excel", action: exportStaffToExcel }]}
            />
            <Button asChild>
              <Link href="/school/staff/create">New Staff</Link>
            </Button>
          </div>
        }
      />
      <StaffTable page={page} />
    </div>
  );
}
