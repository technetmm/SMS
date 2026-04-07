import { UserRole } from "@/app/generated/prisma/enums";
import { DeviceApprovalTable } from "@/components/auth/device-approval-table";
import { PageHeader } from "@/components/shared/page-header";
import { getPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";
import { requireSuperAdminAccess } from "@/lib/rbac";

export default async function PlatformDeviceApprovalsPage() {
  await requireSuperAdminAccess();

  const requests = await getPendingDeviceApprovalRows({
    role: UserRole.SUPER_ADMIN,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Approvals"
        description="Review and handle school admin device login requests."
      />

      <div className="rounded-lg border bg-background">
        <DeviceApprovalTable initialRequests={requests} showSchool />
      </div>
    </div>
  );
}
