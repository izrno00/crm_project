import { Suspense } from "react";
import { RiDashboardLine, RiInboxLine, RiSettings3Line } from "@remixicon/react";
import { NavMain, NavMenu, type NavItem } from "@/components/app/nav-main";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { UserMenu, UserMenuSkeleton } from "@/components/app/user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuBadge,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { requireBusiness } from "@/lib/dal";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { en } from "@/lib/strings/en";

// The owner area's sidebar (PRD §8, Tech.md §11.1). The frame is static. The business name,
// the unread count and the account menu read the session or database, so each streams in behind
// its own Suspense boundary instead of blocking the page.
export function AppSidebar() {
  const items: NavItem[] = [
    {
      href: "/dashboard",
      label: en.nav.dashboard,
      icon: <RiDashboardLine />,
      prefix: "/dashboard",
    },
    {
      href: "/inquiries",
      label: en.nav.inquiries,
      icon: <RiInboxLine />,
      prefix: "/inquiries",
      badge: (
        <Suspense fallback={null}>
          <UnreadBadge />
        </Suspense>
      ),
    },
    {
      href: "/settings/account",
      label: en.nav.settings,
      icon: <RiSettings3Line />,
      prefix: "/settings",
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="gap-1 px-4 pt-5">
        <span className="font-heading text-2xl font-medium">{en.brand}</span>
        <Suspense fallback={<Skeleton className="h-4 w-32 rounded-full bg-sidebar-accent" />}>
          <BusinessName />
        </Suspense>
      </SidebarHeader>
      <SidebarContent>
        {/* The current path is runtime data, so the highlighting streams in behind a boundary.
            Until then the same links render without a highlight. */}
        <Suspense
          fallback={<NavMenu items={items} label={en.nav.mainNavigation} pathname={null} />}
        >
          <NavMain items={items} label={en.nav.mainNavigation} />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

async function BusinessName() {
  const { business } = await requireBusiness();
  return <span className="truncate text-sm text-muted-foreground">{business.name}</span>;
}

// Number of unread inquiries (LIST-2). It shares the dashboard's stats query, which runs once per request.
async function UnreadBadge() {
  const { unread } = await getDashboardStats();
  if (unread === 0) return null;
  return (
    <SidebarMenuBadge>
      <span aria-hidden="true">{unread > 99 ? "99+" : unread}</span>
      <span className="sr-only">{`${unread} ${en.dashboard.unread.toLowerCase()}`}</span>
    </SidebarMenuBadge>
  );
}
