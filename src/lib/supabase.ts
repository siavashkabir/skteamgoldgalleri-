import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
);

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-service-role-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
