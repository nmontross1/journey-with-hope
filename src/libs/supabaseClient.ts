import { createClient } from "@supabase/supabase-js";

const PROD_URL = import.meta.env.VITE_SUPABASE_URL;
const PROD_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function getSupabaseClient(key?: string, url?: string) {
  return createClient(url || PROD_URL!, key || PROD_ANON_KEY!);
}

export const supabase = getSupabaseClient();
