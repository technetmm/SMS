"use client"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  CalendarDaysIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersIcon,
  GraduationCapIcon,
  UserRoundIcon,
} from "lucide-react"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Students",
    url: "/students",
    icon: <UsersIcon />,
  },
  {
    title: "Teachers",
    url: "/teachers",
    icon: <UserRoundIcon />,
  },
  {
    title: "Classes",
    url: "/classes",
    icon: <GraduationCapIcon />,
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: <CalendarDaysIcon />,
  },
  {
    title: "Payments",
    url: "/payments",
    icon: <CreditCardIcon />,
  },
]

const navSecondary = [
  {
    title: "Settings",
    url: "/settings",
    icon: <Settings2Icon />,
  },
  {
    title: "Security",
    url: "/settings/security",
    icon: <ShieldCheckIcon />,
  },
]

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
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
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
