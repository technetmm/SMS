"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

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
import { Link } from "@/i18n/navigation";

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
  const t = useTranslations("Sidebar");
  const isPlatform = role === UserRole.SUPER_ADMIN && !schoolId;
  const isSchool =
    (role === UserRole.SCHOOL_SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN) &&
    !!schoolId;
  const isTeacher = role === UserRole.TEACHER;
  const isStudent = role === UserRole.STUDENT;
  const homeHref = isPlatform
    ? "/platform/dashboard"
    : isTeacher
      ? "/teacher/dashboard"
      : isStudent
        ? "/student/dashboard"
        : "/school/dashboard";
  const subtitle = isPlatform
    ? t("platform")
    : schoolName?.trim() || t("school");

  const schoolNavGroups = [
    {
      label: t("groups.overview"),
      items: [
        {
          title: t("items.dashboard"),
          url: "/school/dashboard",
          icon: <LayoutDashboardIcon />,
        },
        {
          title: t("items.analytics"),
          url: "/school/analytics",
          icon: <BarChart3Icon />,
        },
        {
          title: t("items.deviceApprovals"),
          url: "/school/device-approvals",
          icon: <ShieldCheckIcon />,
        },
      ],
    },
    {
      label: t("groups.people"),
      items: [
        {
          title: t("items.students"),
          url: "/school/students",
          icon: <UsersIcon />,
        },
        {
          title: t("items.staff"),
          url: "/school/staff",
          icon: <UserRoundIcon />,
        },
      ],
    },
    {
      label: t("groups.academics"),
      items: [
        {
          title: t("items.subjects"),
          url: "/school/subjects",
          icon: <BookOpenTextIcon />,
        },
        {
          title: t("items.courses"),
          url: "/school/courses",
          icon: <BookOpenIcon />,
        },
        {
          title: t("items.classes"),
          url: "/school/classes",
          icon: <GraduationCapIcon />,
        },
        {
          title: t("items.sections"),
          url: "/school/sections",
          icon: <TvMinimalIcon />,
        },
        {
          title: t("items.enrollments"),
          url: "/school/enrollments",
          icon: <ListChecksIcon />,
        },
      ],
    },
    {
      label: t("groups.schedule"),
      items: [
        {
          title: t("items.timetable"),
          url: "/school/timetable",
          icon: <CalendarClockIcon />,
        },
        {
          title: t("items.studentAttendance"),
          url: "/school/attendance",
          icon: <CalendarDaysIcon />,
        },
        {
          title: t("items.staffAttendance"),
          url: "/school/staff-attendance",
          icon: <ClipboardCheckIcon />,
        },
      ],
    },
    {
      label: t("groups.finance"),
      items: [
        {
          title: t("items.invoices"),
          url: "/school/invoices",
          icon: <FileTextIcon />,
        },
        {
          title: t("items.payments"),
          url: "/school/payments",
          icon: <CreditCardIcon />,
        },
        {
          title: t("items.payroll"),
          url: "/school/payroll",
          icon: <ReceiptIcon />,
        },
      ],
    },
  ];

  const teacherNavGroups = [
    {
      label: t("groups.overview"),
      items: [
        {
          title: t("items.dashboard"),
          url: "/teacher/dashboard",
          icon: <LayoutDashboardIcon />,
        },
      ],
    },
    {
      label: t("groups.academics"),
      items: [
        {
          title: t("items.sections"),
          url: "/teacher/sections",
          icon: <TvMinimalIcon />,
        },
        {
          title: t("items.students"),
          url: "/teacher/students",
          icon: <UsersIcon />,
        },
      ],
    },
    {
      label: t("groups.schedule"),
      items: [
        {
          title: t("items.timetable"),
          url: "/teacher/timetable",
          icon: <CalendarClockIcon />,
        },
        {
          title: t("items.studentAttendance"),
          url: "/teacher/attendance",
          icon: <CalendarDaysIcon />,
        },
      ],
    },
  ];

  const studentNavGroups = [
    {
      label: t("groups.overview"),
      items: [
        {
          title: t("items.dashboard"),
          url: "/student/dashboard",
          icon: <LayoutDashboardIcon />,
        },
      ],
    },
  ];

  const platformNavMain = [
    {
      title: t("items.dashboard"),
      url: "/platform/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: t("items.deviceApprovals"),
      url: "/platform/device-approvals",
      icon: <ShieldCheckIcon />,
    },
    {
      title: t("items.tenants"),
      url: "/platform/tenants",
      icon: <UsersIcon />,
    },
    {
      title: t("items.subscriptions"),
      url: "/platform/subscriptions",
      icon: <CreditCardIcon />,
    },
  ];

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
