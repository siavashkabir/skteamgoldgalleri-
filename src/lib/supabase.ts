import "server-only";

import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");

export const supabase = createClient(
  supabaseUrl,
  requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
);

export const supabaseAdmin = createClient(
  supabaseUrl,
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
