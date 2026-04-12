import { requireSuperAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsPage } from "@/components/notifications/notifications-page";

export default async function PlatformNotificationsPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Track platform updates and approval outcomes."
      />
      <NotificationsPage />
    </div>
  );
}
