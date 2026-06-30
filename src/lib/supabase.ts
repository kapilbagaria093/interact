import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "your-anon-key";

if (supabaseUrl === "https://your-project.supabase.co" || !supabaseAnonKey) {
  console.warn("Supabase credentials not configured in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
