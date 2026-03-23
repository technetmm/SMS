"use client";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  CalendarDaysIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersIcon,
  GraduationCapIcon,
  UserRoundIcon,
  BookOpenIcon,
  FolderTreeIcon,
} from "lucide-react";
import { UserRole } from "@/app/generated/prisma/enums";

const schoolNavMain = [
  { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon /> },
  { title: "Students", url: "/students", icon: <UsersIcon /> },
  { title: "Teachers", url: "/teachers", icon: <UserRoundIcon /> },
  { title: "Subjects", url: "/subjects", icon: <FolderTreeIcon /> },
  { title: "Courses", url: "/courses", icon: <BookOpenIcon /> },
  { title: "Classes", url: "/classes", icon: <GraduationCapIcon /> },
  { title: "Sections", url: "/sections", icon: <GraduationCapIcon /> },
  { title: "Attendance", url: "/attendance", icon: <CalendarDaysIcon /> },
  { title: "Payments", url: "/payments", icon: <CreditCardIcon /> },
];

const schoolNavSecondary = [
  { title: "Settings", url: "/settings", icon: <Settings2Icon /> },
  { title: "Security", url: "/settings/security", icon: <ShieldCheckIcon /> },
];

const platformNavMain = [
  {
    title: "Dashboard",
    url: "/platform/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  { title: "Tenants", url: "/platform/tenants", icon: <UsersIcon /> },
  {
    title: "Subscriptions",
    url: "/platform/subscriptions",
    icon: <CreditCardIcon />,
  },
];

const platformNavSecondary = [
  { title: "Settings", url: "/platform/settings", icon: <Settings2Icon /> },
  {
    title: "Security",
    url: "/platform/settings/security",
    icon: <ShieldCheckIcon />,
  },
];

export function AppSidebar({
  user,
  role,
  tenantId,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  role: UserRole;
  tenantId: string | null;
}) {
  const isPlatform = role === UserRole.SUPER_ADMIN && !tenantId;
  const navMain = isPlatform ? platformNavMain : schoolNavMain;
  const navSecondary = isPlatform ? platformNavSecondary : schoolNavSecondary;
  const homeHref = isPlatform ? "/platform/dashboard" : "/dashboard";

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={homeHref}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LayoutDashboardIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Technet LMS</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {navSecondary.length ? (
          <NavSecondary items={navSecondary} className="mt-auto" />
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
