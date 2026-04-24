import { UserRole } from "@/app/generated/prisma/enums";
import { requireRole } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsPage } from "@/components/notifications/notifications-page";

export default async function StudentNotificationsPage() {
  await requireRole([UserRole.STUDENT]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Track your account, class, and billing updates."
      />
      <NotificationsPage />
    </div>
  );
}
