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

export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (!supabaseClient) {
    const { env } = await getCloudflareContext({ async: true });
    const { url, anonKey } = getSupabaseConfig(env);
    supabaseClient = createClient(url, anonKey);
  }
  return supabaseClient;
}

export async function getSupabaseAdminClient(): Promise<SupabaseClient> {
  if (!supabaseAdminClient) {
    const { env } = await getCloudflareContext({ async: true });
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
