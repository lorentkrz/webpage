import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Prefer Next.js public env vars; fall back to Expo-style vars if present.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
let warned = false;

if (supabaseUrl && supabaseKey) {
  client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
} else {
  if (process.env.NODE_ENV !== "production" && !warned) {
    console.warn(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (or Expo equivalents)."
    );
    warned = true;
  }
}

export const getSupabaseClient = () => client;
