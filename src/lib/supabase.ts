import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type SupabaseClient = ReturnType<typeof createClient>;

let supabaseClient: SupabaseClient | undefined;
let supabaseAdminClient: SupabaseClient | undefined;

function getSupabaseConfig(env: CloudflareEnv) {
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key",
  };
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const { env } = getCloudflareContext();
    const { url, anonKey } = getSupabaseConfig(env);
    supabaseClient = createClient(url, anonKey);
  }
  return supabaseClient;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseAdminClient) {
    const { env } = getCloudflareContext();
    const { url } = getSupabaseConfig(env);
    supabaseAdminClient = createClient(
      url,
      env.SUPABASE_SERVICE_ROLE_KEY || "dummy-service-role-key",
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
