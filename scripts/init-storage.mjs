import { createClient } from "@supabase/supabase-js";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const supabase = createClient(
  requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

async function ensureBucket(name, isPublic) {
  const { data: bucket, error } = await supabase.storage.getBucket(name);
  if (bucket) {
    if (bucket.public !== isPublic) {
      throw new Error(
        `The ${name} bucket must be ${isPublic ? "public" : "private"}.`,
      );
    }
    console.log(`Verified ${isPublic ? "public" : "private"} ${name} bucket.`);
    return;
  }
  if (!error?.message.toLowerCase().includes("not found")) {
    throw error ?? new Error(`Could not verify the ${name} bucket.`);
  }

  const { error: createError } = await supabase.storage.createBucket(name, {
    public: isPublic,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  });
  if (createError) {
    throw createError;
  }
  console.log(`Created ${isPublic ? "public" : "private"} ${name} bucket.`);
}

await ensureBucket("products", true);
await ensureBucket("custom-orders", false);
