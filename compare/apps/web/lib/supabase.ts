import { createClient } from "@supabase/supabase-js";
import type { Database } from "@bandinghidup/core";

const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
const supabaseAnonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "";

if (
  typeof window !== "undefined" &&
  (!supabaseUrl || supabaseUrl.includes("your-project-id") ||
   !supabaseAnonKey || supabaseAnonKey.includes("your-anon"))
) {
  console.warn(
    "[BandingHidup] Supabase credentials not configured. " +
    "Copy apps/web/.env.local and add your Supabase URL and anon key. " +
    "API calls will fail until configured."
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
  {
    auth: {
      persistSession: false, // Stage 0 — no auth required
    },
  }
);

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !supabaseUrl.includes("your-project-id") &&
  !!supabaseAnonKey &&
  !supabaseAnonKey.includes("your-anon");
