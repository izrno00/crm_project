import { RiExpandUpDownLine } from "@remixicon/react";
import { SignOutMenuItem } from "@/components/app/sign-out-menu-item";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { getProfile } from "@/lib/dal";
import { initialsOf } from "@/lib/format";
import { en } from "@/lib/strings/en";

// The account menu in the sidebar footer: name, email and Sign out. Reads the session,
// so it renders behind a Suspense boundary (Tech.md §11.1).
export async function UserMenu() {
  const profile = await getProfile();
  const name = profile.fullName || profile.email;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" aria-label={en.nav.openMenu} />}
          >
            <Avatar className="size-8">
              <AvatarFallback>{initialsOf(name)}</AvatarFallback>
            </Avatar>
            <span className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{profile.email}</span>
            </span>
            <RiExpandUpDownLine className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {en.nav.signedInAs} {profile.email}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <SignOutMenuItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function UserMenuSkeleton() {
  return (
    <div className="flex h-12 items-center gap-2 px-2" aria-hidden="true">
      <div className="size-8 animate-pulse rounded-full bg-sidebar-accent" />
      <div className="h-4 w-28 animate-pulse rounded-full bg-sidebar-accent" />
    </div>
  );
}
