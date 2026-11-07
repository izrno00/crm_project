"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { en } from "@/lib/strings/en";

const notices = en.notices as Record<string, string>;

// Turns a `?notice=<key>` query param (set by auth redirects) into a toast,
// then removes it from the URL. Render inside a <Suspense> boundary.
export function NoticeToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const notice = params.get("notice");

  useEffect(() => {
    if (!notice) return;

    const message = notices[notice];
    if (message) {
      // `id` stops a duplicate toast when React runs the effect twice in dev.
      const show = notice === "email_change_partial" ? toast.info : toast.success;
      show(message, { id: notice });
    }

    const rest = new URLSearchParams(params.toString());
    rest.delete("notice");
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [notice, params, pathname, router]);

  return null;
}
