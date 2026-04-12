import { requireSchoolAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsPage } from "@/components/notifications/notifications-page";

export default async function SchoolNotificationsPage() {
  await requireSchoolAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Track school events, approvals, and account updates."
      />
      <NotificationsPage />
    </div>
  );
}
