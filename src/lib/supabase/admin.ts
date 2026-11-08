import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasServiceRole, supabaseAnonKey, supabaseUrl } from "./config";

export { hasServiceRole, isSupabaseConfigured } from "./config";

let cachedAdmin: SupabaseClient | null = null;

/**
 * Server-only client. Uses the service role when available so administrative reads
 * and writes are not blocked by RLS; the repository never returns private rows to
 * public pages. Public clients are still governed by the RLS policies in
 * supabase/migrations.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;
  const url = supabaseUrl();
  const key = hasServiceRole() ? process.env.SUPABASE_SERVICE_ROLE_KEY : supabaseAnonKey();
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured with valid credentials. Set NEXT_PUBLIC_SUPABASE_URL and a real anon key, " +
        "or remove them to run in demo mode.",
    );
  }
  cachedAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAdmin;
}
