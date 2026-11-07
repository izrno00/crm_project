"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  /** The item is highlighted for this path and everything below it. */
  prefix: string;
  /** Rendered inside the menu item, e.g. the unread count (itself behind a Suspense boundary). */
  badge?: ReactNode;
};

type NavProps = { items: NavItem[]; label: string };

// The links themselves. With `pathname` null nothing is highlighted, which is what the sidebar
// shows for a moment while the current path streams in (see NavMain).
export function NavMenu({ items, label, pathname }: NavProps & { pathname: string | null }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <nav aria-label={label}>
          <SidebarMenu>
            {items.map((item) => {
              const active =
                pathname !== null && (pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={active}
                    render={<Link href={item.href} aria-current={active ? "page" : undefined} />}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {item.badge}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </nav>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// Highlights the current page. The path is runtime data, so with Cache Components this must
// render inside a <Suspense> boundary (Tech.md §3); the sidebar passes NavMenu as the fallback.
export function NavMain(props: NavProps) {
  const pathname = usePathname();
  return <NavMenu {...props} pathname={pathname} />;
}
