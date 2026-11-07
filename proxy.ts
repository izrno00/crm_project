import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Next.js 16 renamed the `middleware` file convention to `proxy`.
// It only refreshes the Supabase session and does optimistic redirects.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip static assets, image optimization files and the public intake API.
    "/((?!_next/static|_next/image|favicon.ico|api/v1/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
