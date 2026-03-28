"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Image as ImageIcon,
  KeyRound,
  LockKeyhole,
  Mail,
  Palette,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/settings/theme", label: "Theme", icon: Palette },
  { href: "/settings/profile-photo", label: "Profile Photo", icon: ImageIcon },
  { href: "/settings/change-email", label: "Change Email", icon: Mail },
  { href: "/settings/change-password", label: "Change Password", icon: KeyRound },
  { href: "/settings/2fa", label: "Two-Factor Auth", icon: LockKeyhole },
  { href: "/settings/roles", label: "Roles", icon: Shield },
  { href: "/settings/security", label: "Security", icon: ShieldCheck },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
              isActive
                ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition group-hover:text-foreground",
                isActive && "border-primary/40 text-primary",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
