"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/attendance", label: "Attendance", icon: CalendarDays },
  { href: "/payments", label: "Payments", icon: Receipt },
  { href: "/teachers", label: "Teachers", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background p-6 lg:block">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          T
        </div>
        Technet LMS
      </div>
      <nav className="mt-8 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
