import { UserRole } from "@/app/generated/prisma/enums";
import { requireRole } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsPage } from "@/components/notifications/notifications-page";

export default async function TeacherNotificationsPage() {
  await requireRole([UserRole.TEACHER]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Track attendance and classroom-related updates."
      />
      <NotificationsPage />
    </div>
  );
}
