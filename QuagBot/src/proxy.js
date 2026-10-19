import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 runs this before every matching request (it was called middleware.js before v16).
export async function proxy(request) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Everything except static files and images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
