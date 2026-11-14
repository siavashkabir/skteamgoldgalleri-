# گالری طلای امیر

## Database setup

Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
The local env file is ignored by Git. Keep the Supabase service-role key server
side; `src/lib/supabase.ts` is marked server-only.

After configuring valid Turso credentials, initialize and verify the tables with:

```sh
npm run db:init
```

This command creates the tenant profile, customer cart/order tables, and custom
order table, and adds the store settings and product fields needed by the admin
panels to existing databases. It also renames the seeded system tenant to
`گالری طلای امیر`. Tenant admins and customers need a Supabase Auth user and a
corresponding `profiles` row with their `tenant_id` and the `tenant_admin` or
`customer` role.

To create or update the Super Admin account and its Turso profile, provide the
password through the environment and run:

```sh
SUPER_ADMIN_PASSWORD='your-password' npm run db:seed-admin
```

The script uses `sk.team.it@gmail.com`, confirms the email, and assigns the
`super_admin` role under the `گالری طلای امیر` system tenant required by the
profiles schema. It does not store the password in the repository.

Initialize the private Supabase Storage bucket for customer design requests with:

```sh
npm run db:init-storage
```

Customer accounts with a `customer` profile role can access `/profile`, view
their account, cart, and order history, and submit a custom gold-design request.
Shop owners can review requests at `/admin/custom-orders`. Custom-order images
are stored privately and served with short-lived signed URLs. The customer
profile row must use the authenticated Supabase user ID and the selected
tenant's ID.

The tenant admin panel is available at `/admin`; the central admin is available
at `/master-admin`. Product images are uploaded to the public `products` bucket;
supported formats are JPEG, PNG, WebP, and AVIF, up to 5 MB each.

The public storefront for the default shop is available at `/skteam` (the
tenant ID `/team-gold-system` is also accepted). Visible products and store
categories are loaded from Turso. Customers can add products to a browser-persisted
cart, submit shipping details at `/checkout`, and create a pending mock order;
no online payment is performed. Run `npm run db:init` to add shipping detail
columns to an existing `orders` table.

To seed the default store with sample products and men's/women's categories, run:

```sh
npm run db:seed-products
```

The seed is safe to rerun: it updates only its two sample categories and eight
sample products for the default tenant.
