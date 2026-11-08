/**
 * Shared Supabase credential validation.
 *
 * A truthy environment variable is not enough: `.env.local` files are frequently
 * copied from examples and still contain placeholders. Treating a placeholder as a
 * real Supabase project silently disables the demo backend and leaves the whole site
 * empty (and auth broken). We therefore require a plausible URL and key before
 * switching the application into production mode.
 */
function isPlausibleUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const isSupabaseHost = url.hostname.endsWith(".supabase.co");
    const customAllowed = process.env.SUPABASE_URL_ALLOW_CUSTOM === "true";
    if (url.protocol !== "https:" && !(localHost && url.protocol === "http:")) return false;
    return isSupabaseHost || customAllowed || localHost;
  } catch {
    return false;
  }
}

function isPlausibleKey(value: string | undefined, kind: "anon" | "service"): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  // Legacy Supabase JWTs are long (200+ chars). New publishable/secret keys use
  // the sb_publishable_ / sb_secret_ prefixes.
  if (kind === "anon" && trimmed.startsWith("sb_publishable_")) return trimmed.length >= 20;
  if (kind === "service" && trimmed.startsWith("sb_secret_")) return trimmed.length >= 20;
  return trimmed.length >= 100 && trimmed.split(".").length === 3;
}

export function isSupabaseConfigured(): boolean {
  return (
    isPlausibleUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    isPlausibleKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "anon")
  );
}

export function hasServiceRole(): boolean {
  return isSupabaseConfigured() && isPlausibleKey(process.env.SUPABASE_SERVICE_ROLE_KEY, "service");
}

export function supabaseUrl(): string | null {
  return isSupabaseConfigured() ? (process.env.NEXT_PUBLIC_SUPABASE_URL ?? null) : null;
}

export function supabaseAnonKey(): string | null {
  return isSupabaseConfigured() ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null) : null;
}
