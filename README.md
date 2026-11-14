# skteamgoldgalleri-

## Database setup

Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
The local env file is ignored by Git. Keep the Supabase service-role key server
side; `src/lib/supabase.ts` is marked server-only.

After configuring valid Turso credentials, initialize and verify the tables with:

```sh
npm run db:init
```

This command also adds the tenant profile, store settings, and product fields
needed by the admin panels to existing databases. Tenant admins must have a
Supabase Auth user and a corresponding `profiles` row with their `tenant_id` and
the `tenant_admin` role.

To create or update the Super Admin account and its Turso profile, provide the
password through the environment and run:

```sh
SUPER_ADMIN_PASSWORD='your-password' npm run db:seed-admin
```

The script uses `sk.team.it@gmail.com`, confirms the email, and assigns the
`super_admin` role under the `Team Gold System` tenant required by the profiles
schema. It does not store the password in the repository.

The tenant admin panel is available at `/admin`. Product images are uploaded
server-side to the public Supabase Storage bucket named `products`; supported
formats are JPEG, PNG, WebP, and AVIF, up to 5 MB each.
