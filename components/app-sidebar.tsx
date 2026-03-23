"use client";

import * as React from "react";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
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
  CalendarClockIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  BarChart3Icon,
  ReceiptIcon,
  FileDownIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersIcon,
  GraduationCapIcon,
  UserRoundIcon,
  BookOpenIcon,
  BookOpenTextIcon,
  TvMinimalIcon,
} from "lucide-react";
import { UserRole } from "@/app/generated/prisma/enums";

const schoolNavGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon /> },
      {
        title: "Analytics",
        url: "/analytics",
        icon: <BarChart3Icon />,
      },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Students", url: "/students", icon: <UsersIcon /> },
      { title: "Teachers", url: "/teachers", icon: <UserRoundIcon /> },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Subjects", url: "/subjects", icon: <BookOpenTextIcon /> },
      { title: "Courses", url: "/courses", icon: <BookOpenIcon /> },
      { title: "Classes", url: "/classes", icon: <GraduationCapIcon /> },
      { title: "Sections", url: "/sections", icon: <TvMinimalIcon /> },
    ],
  },
  {
    label: "Schedule",
    items: [
      { title: "Timetable", url: "/timetable", icon: <CalendarClockIcon /> },
      {
        title: "Student Attendance",
        url: "/attendance",
        icon: <CalendarDaysIcon />,
      },
      {
        title: "Teacher Attendance",
        url: "/teacher-attendance",
        icon: <ClipboardCheckIcon />,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payments", url: "/payments", icon: <CreditCardIcon /> },
      { title: "Payroll", url: "/payroll", icon: <ReceiptIcon /> },
      { title: "Exports", url: "/exports", icon: <FileDownIcon /> },
    ],
  },
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
  const navSecondary = isPlatform ? platformNavSecondary : schoolNavSecondary;
  const homeHref = isPlatform ? "/platform/dashboard" : "/dashboard";
  const settingsHref = isPlatform ? "/platform/settings" : "/settings";

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
                  <span className="truncate text-xs">
                    {isPlatform ? "Platform" : "School"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isPlatform ? (
          <NavMain label="Platform" items={platformNavMain} />
        ) : (
          <NavMain groups={schoolNavGroups} />
        )}
        {navSecondary.length ? (
          <NavSecondary items={navSecondary} className="mt-auto" />
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} settingsHref={settingsHref} />
      </SidebarFooter>
    </Sidebar>
  );
}
