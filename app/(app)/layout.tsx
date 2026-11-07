import { Suspense } from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { NoticeToast } from "@/components/notice-toast";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Owner area shell: a sidebar that collapses into a sheet on small screens (PRD §8).
// Pages do their own DAL checks; the proxy only does the optimistic redirect for signed-out visitors.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
        </header>
        {/* SidebarInset already renders the page's <main> landmark. */}
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</div>
      </SidebarInset>
      <Suspense fallback={null}>
        <NoticeToast />
      </Suspense>
    </SidebarProvider>
  );
}
