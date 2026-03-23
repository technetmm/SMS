import {
  CalendarDaysIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersIcon,
  GraduationCapIcon,
} from "lucide-react"

export const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Students",
    url: "/students",
    icon: UsersIcon,
  },
  {
    title: "Classes",
    url: "/classes",
    icon: GraduationCapIcon,
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: CalendarDaysIcon,
  },
  {
    title: "Payments",
    url: "/payments",
    icon: CreditCardIcon,
  },
]

export const navSecondary = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2Icon,
  },
  {
    title: "Security",
    url: "/settings/security",
    icon: ShieldCheckIcon,
  },
]