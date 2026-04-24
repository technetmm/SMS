"use client";

import { signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BellIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

export function NavUser({
  user,
  isPlatform,
  isTeacher,
  isStudent,
  isSchoolAdmin,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  isPlatform: boolean;
  isSchoolAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}) {
  const { isMobile } = useSidebar();
  const t = useTranslations("NavUser");
  const locale = useLocale();
  const initials =
    user.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ?? "ME";

  const menuItems = [
    {
      name: "Profile",
      label: t("profile"),
      href: isSchoolAdmin
        ? "/school/profile"
        : isTeacher
          ? "/teacher/profile"
          : isStudent
            ? "/student/profile"
            : "/",
      icon: <UserIcon />,
    },
    {
      name: "Settings",
      label: t("settings"),
      href: isPlatform
        ? "/platform/settings"
        : isSchoolAdmin
          ? "/school/settings"
          : isTeacher
            ? "/teacher/settings"
            : isStudent
              ? "/student/settings"
              : "/",
      icon: <Settings2Icon />,
    },
    {
      name: "Security",
      label: t("security"),
      href: isPlatform
        ? "/platform/settings/security"
        : isSchoolAdmin
          ? "/school/settings/security"
          : isTeacher
            ? "/teacher/settings/security"
            : isStudent
              ? "/student/settings/security"
              : "/",
      icon: <ShieldCheckIcon />,
    },
    {
      name: "Notifications",
      label: t("notifications"),
      href: isPlatform
        ? "/platform/notifications"
        : isSchoolAdmin
          ? "/school/notifications"
          : isTeacher
            ? "/teacher/notifications"
            : isStudent
              ? "/student/notifications"
              : "/",
      icon: <BellIcon />,
    },
  ];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {menuItems.map((item) =>
                isPlatform && item.name === "Profile" ? null : (
                  <DropdownMenuItem asChild key={item.name}>
                    <Link href={item.href}>
                      {item.icon}
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                signOut({ callbackUrl: `/${locale}/login` });
              }}
            >
              <LogOutIcon />
              {t("logOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
