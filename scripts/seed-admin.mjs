import { createClient as createTursoClient } from "@libsql/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const email = "sk.team.it@gmail.com";
const password = requiredEnv("SUPER_ADMIN_PASSWORD");
const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabase = createSupabaseClient(
  supabaseUrl,
  requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
const db = createTursoClient({
  url: requiredEnv("TURSO_DATABASE_URL"),
  authToken: requiredEnv("TURSO_AUTH_TOKEN"),
});

async function findUserByEmail() {
  const perPage = 1000;

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const existing = data.users.find(
      (user) => user.email?.toLowerCase() === email,
    );
    if (existing) {
      return existing;
    }
    if (data.users.length < perPage) {
      return null;
    }
  }
}

try {
  const existingUser = await findUserByEmail();
  const userResult = existingUser
    ? await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
      })
    : await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

  if (userResult.error) {
    throw userResult.error;
  }
  const user = userResult.data.user;
  if (!user) {
    throw new Error("Supabase did not return the seeded user.");
  }

  const tenantId = "team-gold-system";
  await db.execute({
    sql: `INSERT OR IGNORE INTO tenants (id, name)
          VALUES (?, ?)`,
    args: [tenantId, "Team Gold System"],
  });

  const tenantResult = await db.execute({
    sql: "SELECT id FROM tenants WHERE id = ?",
    args: [tenantId],
  });
  if (tenantResult.rows.length !== 1) {
    throw new Error("Could not verify the system tenant in Turso.");
  }

  await db.execute({
    sql: `INSERT INTO profiles (id, tenant_id, role, full_name)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            role = excluded.role,
            full_name = excluded.full_name`,
    args: [user.id, tenantId, "super_admin", "Team Gold Super Admin"],
  });

  console.log(`Seeded ${email} as super_admin.`);
} finally {
  await db.close();
}
