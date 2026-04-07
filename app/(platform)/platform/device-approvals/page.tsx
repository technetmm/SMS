import { UserRole } from "@/app/generated/prisma/enums";
import { DeviceApprovalTable } from "@/components/auth/device-approval-table";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { getPaginatedPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";
import { parsePageParam } from "@/lib/pagination";
import { requireSuperAdminAccess } from "@/lib/rbac";

export default async function PlatformDeviceApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireSuperAdminAccess();
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const requests = await getPaginatedPendingDeviceApprovalRows(
    {
      role: UserRole.SUPER_ADMIN,
    },
    { page },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Approvals"
        description="Review and handle school admin device login requests."
      />

      <div className="rounded-lg border bg-background">
        <DeviceApprovalTable initialRequests={requests.items} showSchool />
        <TablePagination
          pagination={requests}
          pathname="/platform/device-approvals"
        />
      </div>
    </div>
  );
}
