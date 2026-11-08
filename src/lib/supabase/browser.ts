import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-safe Supabase config. Only NEXT_PUBLIC_* values are read, and the same
 * placeholder rejection used by the server is applied so a copied `.env.local`
 * cannot silently break the demo experience.
 */
export function browserSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const validUrl = url.startsWith("https://") || url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1");
  const validKey = key.startsWith("sb_publishable_") ? key.length >= 20 : key.length >= 100 && key.split(".").length === 3;
  return validUrl && validKey ? { url, key } : null;
}

let cached: SupabaseClient | null = null;

export function getBrowserSupabaseClient(): SupabaseClient | null {
  if (cached) return cached;
  const config = browserSupabaseConfig();
  if (!config) return null;
  cached = createClient(config.url, config.key, {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return cached;
}
