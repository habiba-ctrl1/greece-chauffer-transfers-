import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Minimal, schema-agnostic connectivity check. Queries a table that does
 * not need to exist — a response from Supabase (even a "table not found"
 * error) proves the client reached the database. Only network failures or
 * an invalid API key count as "not connected".
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("connection_test")
      .select("*")
      .limit(1);

    if (!error) return true;

    const databaseResponded = error.code === "PGRST205" || error.code === "42P01";
    return databaseResponded;
  } catch {
    return false;
  }
}
