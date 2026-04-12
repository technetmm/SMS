"use client";

import * as React from "react";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
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
  FileTextIcon,
  LayoutDashboardIcon,
  UsersIcon,
  GraduationCapIcon,
  UserRoundIcon,
  BookOpenIcon,
  BookOpenTextIcon,
  ListChecksIcon,
  ShieldCheckIcon,
  TvMinimalIcon,
} from "lucide-react";
import { UserRole } from "@/app/generated/prisma/enums";

const schoolNavGroups = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/school/dashboard",
        icon: <LayoutDashboardIcon />,
      },
      {
        title: "Analytics",
        url: "/school/analytics",
        icon: <BarChart3Icon />,
      },
      {
        title: "Device Approvals",
        url: "/school/device-approvals",
        icon: <ShieldCheckIcon />,
      },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Students", url: "/school/students", icon: <UsersIcon /> },
      { title: "Staff", url: "/school/staff", icon: <UserRoundIcon /> },
    ],
  },
  {
    label: "Academics",
    items: [
      {
        title: "Subjects",
        url: "/school/subjects",
        icon: <BookOpenTextIcon />,
      },
      { title: "Courses", url: "/school/courses", icon: <BookOpenIcon /> },
      { title: "Classes", url: "/school/classes", icon: <GraduationCapIcon /> },
      { title: "Sections", url: "/school/sections", icon: <TvMinimalIcon /> },
      {
        title: "Enrollments",
        url: "/school/enrollments",
        icon: <ListChecksIcon />,
      },
    ],
  },
  {
    label: "Schedule",
    items: [
      {
        title: "Timetable",
        url: "/school/timetable",
        icon: <CalendarClockIcon />,
      },
      {
        title: "Student Attendance",
        url: "/school/attendance",
        icon: <CalendarDaysIcon />,
      },
      {
        title: "Staff Attendance",
        url: "/school/staff-attendance",
        icon: <ClipboardCheckIcon />,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Invoices", url: "/school/invoices", icon: <FileTextIcon /> },
      { title: "Payments", url: "/school/payments", icon: <CreditCardIcon /> },
      { title: "Payroll", url: "/school/payroll", icon: <ReceiptIcon /> },
      { title: "Exports", url: "/school/exports", icon: <FileDownIcon /> },
    ],
  },
];

const teacherNavGroups = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/teacher/dashboard",
        icon: <LayoutDashboardIcon />,
      },
    ],
  },
];

const studentNavGroups = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/student/dashboard",
        icon: <LayoutDashboardIcon />,
      },
    ],
  },
];

const platformNavMain = [
  {
    title: "Dashboard",
    url: "/platform/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Device Approvals",
    url: "/platform/device-approvals",
    icon: <ShieldCheckIcon />,
  },
  { title: "Tenants", url: "/platform/tenants", icon: <UsersIcon /> },
  {
    title: "Subscriptions",
    url: "/platform/subscriptions",
    icon: <CreditCardIcon />,
  },
];

export function AppSidebar({
  user,
  role,
  schoolId,
  schoolName,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  role: UserRole;
  schoolId: string | null;
  schoolName?: string | null;
}) {
  const isPlatform = role === UserRole.SUPER_ADMIN && !schoolId;
  const isSchool = role === UserRole.SCHOOL_ADMIN && !!schoolId;
  const isTeacher = role === UserRole.TEACHER;
  const isStudent = role === UserRole.STUDENT;
  const homeHref = isPlatform
    ? "/platform/dashboard"
    : isTeacher
      ? "/teacher/dashboard"
      : isStudent
        ? "/student/dashboard"
        : "/school/dashboard";
  const subtitle = isPlatform ? "Platform" : schoolName?.trim() || "School";

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
                  <span className="truncate font-medium">Technet SMS</span>
                  <span className="truncate text-xs">{subtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isPlatform ? (
          <NavMain label="Platform" items={platformNavMain} />
        ) : isTeacher ? (
          <NavMain groups={teacherNavGroups} />
        ) : isStudent ? (
          <NavMain groups={studentNavGroups} />
        ) : (
          <NavMain groups={schoolNavGroups} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={user}
          isPlatform={isPlatform}
          isTeacher={isTeacher}
          isStudent={isStudent}
          isSchoolAdmin={isSchool}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
