import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

type SupabaseClient = ReturnType<typeof createClient>;

let supabaseClient: SupabaseClient | undefined;
let supabaseAdminClient: SupabaseClient | undefined;

function getSupabaseConfig() {
  return {
    url: getEnv("NEXT_PUBLIC_SUPABASE_URL") || "https://dummy.supabase.co",
    anonKey: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "dummy-key",
  };
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const { url, anonKey } = getSupabaseConfig();
    supabaseClient = createClient(url, anonKey);
  }
  return supabaseClient;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseAdminClient) {
    const { url } = getSupabaseConfig();
    supabaseAdminClient = createClient(
      url,
      getEnv("SUPABASE_SERVICE_ROLE_KEY") || "dummy-service-role-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
  return supabaseAdminClient;
}
