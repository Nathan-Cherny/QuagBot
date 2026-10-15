import { createBrowserClient } from "@supabase/ssr";

// Supabase client for "use client" components (login form, logout button, etc.)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
