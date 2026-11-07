"use client";

import { RiMoonLine, RiSunLine } from "@remixicon/react";
import { useTheme } from "next-themes";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { en } from "@/lib/strings/en";

// Light/dark switch (PRD §9). The icons swap with CSS (`dark:` classes) instead of reading the
// theme in JavaScript, so the server and browser render the same markup and nothing flickers.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          <RiSunLine className="hidden dark:block" />
          <RiMoonLine className="dark:hidden" />
          <span>{en.nav.toggleTheme}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
