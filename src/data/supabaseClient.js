import { createClient } from "@supabase/supabase-js";

const env = import.meta.env || {};
const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
const supabaseKey = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY)?.trim();
const hasPartialConfiguration = Boolean(env.VITE_SUPABASE_URL || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY);
let validUrl = false;
try {
  const parsedUrl = new URL(supabaseUrl);
  validUrl = ["https:", "http:"].includes(parsedUrl.protocol) && Boolean(parsedUrl.host);
} catch {
  validUrl = false;
}

export const supabaseConfigurationError = hasPartialConfiguration && (!validUrl || !supabaseKey)
  ? "Supabase environment is incomplete or its project URL is invalid. Fix VITE_SUPABASE_URL and the publishable/anon key; the app will not switch to demo storage."
  : "";
export const supabaseConfigured = Boolean(validUrl && supabaseKey);
export const supabaseClient = supabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
  : null;
