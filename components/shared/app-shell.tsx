import { redirect } from "next/navigation";
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
import { DeviceApprovalListener } from "@/components/auth/device-approval-listener";
import { NotificationBell } from "@/components/notifications/notification-bell";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getServerAuth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      school: { select: { name: true } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: user.name ?? "Your account",
          email: user.email,
          avatar: user.image ?? "",
        }}
        role={session.user.role}
        schoolId={session.user.schoolId ?? null}
        schoolName={user.school?.name ?? null}
      />
      <SidebarInset>
        <DeviceApprovalListener />
        <header className="sticky top-0 flex h-16 shrink-0 items-center justify-between gap-2 rounded-t-xl bg-background">
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
