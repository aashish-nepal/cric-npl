import { getDemoRepository } from "./demo/repository";
import { getSupabaseRepository } from "./supabase/repository";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { CricketRepository } from "./repository";

export function getRepository(): CricketRepository {
  if (isSupabaseConfigured()) return getSupabaseRepository();
  return getDemoRepository();
}

export * from "./repository";
