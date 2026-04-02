"use client";

import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

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

function NavItems({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarMenuSub>
      {items.map((item) => (
        <SidebarMenuSubItem key={item.title}>
          <SidebarMenuSubButton
            asChild
            isActive={isActivePath(pathname, item.url)}
          >
            <a href={item.url}>
              {item.icon}
              {item.title}
            </a>
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

  const renderGroups = (navGroups: NavGroup[]) => {
    return (
      <>
        {navGroups.map((group) => {
          if (sidebar.state === "collapsed") {
            return (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <NavItems items={group.items} />
              </SidebarGroup>
            );
          }

          return (
            <SidebarMenuItem key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              {group.items?.length ? <NavItems items={group.items} /> : null}
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
          <NavItems items={items ?? []} />
        </SidebarGroup>
      )}
    </div>
  );
}
