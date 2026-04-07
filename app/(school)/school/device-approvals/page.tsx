import { DeviceApprovalTable } from "@/components/auth/device-approval-table";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { getPaginatedPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";
import { parsePageParam } from "@/lib/pagination";
import { requireSchoolAdminAccess } from "@/lib/rbac";

export default async function SchoolDeviceApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireSchoolAdminAccess();
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const requests = await getPaginatedPendingDeviceApprovalRows(
    {
      role: user.role,
      schoolId: user.schoolId,
    },
    { page },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Approvals"
        description="Review and handle staff and student device login requests."
      />

      <div className="rounded-lg border bg-background">
        <DeviceApprovalTable initialRequests={requests.items} />
        <TablePagination
          pagination={requests}
          pathname="/school/device-approvals"
        />
      </div>
    </div>
  );
}
