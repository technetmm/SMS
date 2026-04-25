import { getLocale } from "next-intl/server";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { getServerAuth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppBreadcrumb } from "@/components/shared/app-breadcrumb";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { PushSubscriptionListener } from "@/components/notifications/push-subscription-listener";
import { TeacherReminderListener } from "@/components/notifications/teacher-reminder-listener";
import { DeviceApprovalListener } from "@/components/auth/device-approval-listener";
import { TimeZoneSyncListener } from "@/components/shared/time-zone-sync-listener";
import { resolveEffectiveTimeZone } from "@/lib/time-zone";
import { redirect } from "@/i18n/navigation";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const session = await getServerAuth();
  const sessionUser = session?.user;

  if (!sessionUser?.id) {
    redirect({ href: "/login", locale });
  }
  const verifiedSessionUser = sessionUser!;

  const user = await prisma.user.findUnique({
    where: { id: verifiedSessionUser.id },
    select: {
      name: true,
      email: true,
      image: true,
      timeZone: true,
      school: { select: { name: true } },
    },
  });

  if (!user) {
    redirect({ href: "/login", locale });
  }
  const currentUser = user!;
  const effectiveTimeZone = resolveEffectiveTimeZone(currentUser.timeZone);

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: currentUser.name ?? "Your account",
          email: currentUser.email,
          avatar: currentUser.image ?? "",
        }}
        role={verifiedSessionUser.role}
        schoolId={verifiedSessionUser.schoolId ?? null}
        schoolName={currentUser.school?.name ?? null}
      />
      <SidebarInset>
        <TimeZoneSyncListener />
        <PushSubscriptionListener role={String(verifiedSessionUser.role)} />
        <TeacherReminderListener
          role={String(verifiedSessionUser.role)}
          timeZone={effectiveTimeZone}
        />
        <DeviceApprovalListener />
        <header className="sticky top-0 flex h-16 shrink-0 items-center justify-between gap-2 rounded-t-xl bg-background z-50">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4 mt-2"
            />
            <AppBreadcrumb />
          </div>
          <div className="px-4">
            <NotificationBell />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
