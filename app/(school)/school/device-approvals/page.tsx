import { DeviceApprovalTable } from "@/components/auth/device-approval-table";
import { PageHeader } from "@/components/shared/page-header";
import { getPendingDeviceApprovalRows } from "@/lib/auth/device-approval-queue";
import { requireSchoolAdminAccess } from "@/lib/rbac";

export default async function SchoolDeviceApprovalsPage() {
  const user = await requireSchoolAdminAccess();

  const requests = await getPendingDeviceApprovalRows({
    role: user.role,
    schoolId: user.schoolId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Approvals"
        description="Review and handle staff and student device login requests."
      />

      <div className="rounded-lg border bg-background">
        <DeviceApprovalTable initialRequests={requests} />
      </div>
    </div>
  );
}
