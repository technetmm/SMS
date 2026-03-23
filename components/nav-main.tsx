"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronRightIcon } from "lucide-react";

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
    <SidebarMenu>
      {items.map((item) => {
        const active = isActivePath(pathname, item.url);
        return (
          <Collapsible key={item.title} asChild defaultOpen={active}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title} isActive={active}>
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRightIcon />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        );
      })}
    </SidebarMenu>
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
  const pathname = usePathname();
  const sidebar = useSidebar();

  const renderGroups = (navGroups: NavGroup[]) => {
    return (
      <>
        {navGroups.map((group) => {
          const groupActive = group.items.some((item) =>
            isActivePath(pathname, item.url),
          );

          if (sidebar.state === "collapsed") {
            return (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <NavItems items={group.items} />
              </SidebarGroup>
            );
          }

          return (
            <Collapsible key={group.label} defaultOpen={groupActive}>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel asChild>
                    <button
                      type="button"
                      className="w-full justify-between gap-2 data-[state=open]:[&>svg]:rotate-90"
                    >
                      <span>{group.label}</span>
                      <ChevronRightIcon className="transition-transform" />
                    </button>
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <NavItems items={group.items} />
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
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
