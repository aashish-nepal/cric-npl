import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hasServiceRole, isSupabaseConfigured } from "@/lib/supabase/config";

const KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_URL_ALLOW_CUSTOM"] as const;
const original = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

function reset() {
  for (const key of KEYS) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
}

const VALID_ANON = `${"a".repeat(120)}.${"b".repeat(20)}.${"c".repeat(20)}`;
const VALID_SERVICE = `${"d".repeat(120)}.${"e".repeat(20)}.${"f".repeat(20)}`;

describe("Supabase credential detection", () => {
  beforeEach(reset);
  afterEach(reset);

  it("treats placeholder credentials as demo mode", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key-placeholder";
    expect(isSupabaseConfigured()).toBe(false);
    expect(hasServiceRole()).toBe(false);
  });

  it("accepts a plausible hosted project", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://demo-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = VALID_ANON;
    expect(isSupabaseConfigured()).toBe(true);
    expect(hasServiceRole()).toBe(false);

    process.env.SUPABASE_SERVICE_ROLE_KEY = VALID_SERVICE;
    expect(hasServiceRole()).toBe(true);
  });

  it("accepts a local Supabase URL only outside the hosted shape", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = VALID_ANON;
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("rejects non-https custom hosts unless explicitly allowed", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db.internal.example";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = VALID_ANON;
    expect(isSupabaseConfigured()).toBe(false);

    process.env.SUPABASE_URL_ALLOW_CUSTOM = "true";
    expect(isSupabaseConfigured()).toBe(true);
  });

  it("accepts new publishable keys", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://demo-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_abcdefghijklmnop";
    expect(isSupabaseConfigured()).toBe(true);
  });
});
