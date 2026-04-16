"use client";

import { useTranslations } from "next-intl";
import {
  Building2,
  Image as ImageIcon,
  KeyRound,
  LockKeyhole,
  Mail,
  Palette,
  ShieldCheck,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/school/settings/school-profile", label: "School Info", icon: Building2 },
  { href: "/school/settings/theme", label: "Theme", icon: Palette },
  { href: "/school/settings/profile-photo", label: "Profile Photo", icon: ImageIcon },
  { href: "/school/settings/change-email", label: "Change Email", icon: Mail },
  { href: "/school/settings/change-password", label: "Change Password", icon: KeyRound },
  { href: "/school/settings/2fa", label: "Two-Factor Auth", icon: LockKeyhole },
  { href: "/school/settings/security", label: "Security", icon: ShieldCheck },
];

export function SettingsNav() {
  const pathname = usePathname();
  const t = useTranslations("SettingsNav");

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
            <span>
              {item.href === "/school/settings/school-profile"
                ? t("schoolInfo")
                : item.href === "/school/settings/theme"
                  ? t("theme")
                  : item.href === "/school/settings/profile-photo"
                    ? t("profilePhoto")
                    : item.href === "/school/settings/change-email"
                      ? t("changeEmail")
                      : item.href === "/school/settings/change-password"
                        ? t("changePassword")
                        : item.href === "/school/settings/2fa"
                          ? t("twoFactorAuth")
                          : t("security")}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
