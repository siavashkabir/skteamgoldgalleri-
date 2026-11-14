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
