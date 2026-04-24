"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppLocale } from "@/i18n/config";
import { Link, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";

type NavItem = {
  title: string;
  url: string;
  icon: React.ReactNode;
  items?: Array<{ title: string; url: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

function isActivePath(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

function NavItems({ items, locale }: { items: NavItem[]; locale?: AppLocale }) {
  const pathname = usePathname();

  return (
    <SidebarMenuSub>
      {items.map((item) => (
        <SidebarMenuSubItem key={item.title}>
          <SidebarMenuSubButton
            asChild
            isActive={isActivePath(pathname, item.url)}
            locale={locale}
          >
            <Link href={item.url}>
              {item.icon}
              {item.title}
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}

export function NavMain({
  label = "Navigation",
  items,
  groups,
}: {
  label?: string;
  items?: NavItem[];
  groups?: NavGroup[];
}) {
  const sidebar = useSidebar();
  const locale = useLocale() as AppLocale;

  const renderGroups = (navGroups: NavGroup[]) => {
    return (
      <>
        {navGroups.map((group) => {
          if (sidebar.state === "collapsed") {
            return (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <NavItems items={group.items} locale={locale} />
              </SidebarGroup>
            );
          }

          return (
            <SidebarMenuItem key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              {group.items?.length ? (
                <NavItems items={group.items} locale={locale} />
              ) : null}
            </SidebarMenuItem>
          );
        })}
      </>
    );
  };

  return (
    <div>
      {groups?.length ? (
        renderGroups(groups)
      ) : (
        <SidebarGroup>
          <SidebarGroupLabel>{label}</SidebarGroupLabel>
          <NavItems items={items ?? []} locale={locale} />
        </SidebarGroup>
      )}
    </div>
  );
}
