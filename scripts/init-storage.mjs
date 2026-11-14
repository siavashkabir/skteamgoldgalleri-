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

const { data: bucket, error: getError } =
  await supabase.storage.getBucket("custom-orders");
if (bucket) {
  if (bucket.public) {
    throw new Error("The custom-orders bucket must remain private.");
  }
  console.log("Verified private custom-orders bucket.");
} else if (getError?.message.toLowerCase().includes("not found")) {
  const { error: createError } = await supabase.storage.createBucket(
    "custom-orders",
    {
      public: false,
      fileSizeLimit: "5MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    },
  );
  if (createError) {
    throw createError;
  }
  console.log("Created private custom-orders bucket.");
} else {
  throw getError ?? new Error("Could not verify the custom-orders bucket.");
}
