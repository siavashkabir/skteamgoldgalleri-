# گالری طلای امیر

## Cloudflare deployment

This app is deployed as a Cloudflare Worker using `@opennextjs/cloudflare`;
the OpenNext adapter does not deploy to Cloudflare Pages. Use `npm run preview`
to test the Worker locally or `npm run deploy` to build and deploy it. Configure
the app's environment variables as Worker secrets/variables in Cloudflare. The
`IMAGES` binding enables `next/image` optimization and may incur Cloudflare
Images charges.

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
order table, and migrates tenant branding, manual currency rates, customer
registration details, nested categories, product specifications, and platform
branding settings in existing databases. It also renames the seeded system tenant to
`گالری طلای امیر`. Tenant admins and customers need a Supabase Auth user and a
corresponding `profiles` row with their `tenant_id` and the `customer` role.
Tenant-admin access is resolved from the authenticated email matching a
tenant's `owner_email`; the super-admin account is identified by its configured
email.

Add `/reset-password` to the Supabase Auth redirect URL allow list to enable
password recovery for both customers and tenant admins. Customer registration
is available at `/register`; it creates the Supabase Auth account and its
customer profile under the default system tenant.

For an existing database, apply the independent reviews and wishlist migration
without changing tenant settings:

```sh
npm run db:migrate-features
```

Apply the tenant theme settings column migration before deploying theme
customization:

```sh
npm run db:migrate-theme
```

Apply the master-admin subscription, theme, banner, and tools migration before
deploying the master panel. This migration also seeds its three default tools;
it is safe to rerun:

```sh
npm run db:migrate-master-admin
```

To create or update the Super Admin account and its Turso profile, provide the
password through the environment and run:

```sh
SUPER_ADMIN_PASSWORD='your-password' npm run db:seed-admin
```

The script uses `sk.team.it@gmail.com`, confirms the email, and assigns the
`super_admin` role under the `گالری طلای امیر` system tenant required by the
profiles schema. It does not store the password in the repository.

Initialize the Supabase Storage buckets with:

```sh
npm run db:init-storage
```

This creates/verifies the public `products` bucket for storefront photos, the
private `custom-orders` bucket for customer design requests, and the private
`licenses` bucket for business documents. Customer
accounts with a `customer` profile role can access `/profile`, view
their account, cart, and order history, and submit a custom gold-design request.
Shop owners can review requests at `/admin/custom-orders`. Custom-order images
are stored privately and served with short-lived signed URLs. The customer
profile row must use the authenticated Supabase user ID and the selected
tenant's ID.

The tenant admin panel is available at `/admin`; the central admin is available
at `/master-admin`, with tool management at `/master-admin/tools`. Master admins
manage tenant subscriptions, themes, and the storefront announcement banner;
tenant admins manage catalog, orders, and store contact details. Product and
store background images are uploaded to the public `products` bucket;
supported formats are JPEG, PNG, WebP, and AVIF, up to 5 MB each.

For an existing database, apply the tenant owner and storefront template
migration before deploying the matching application version:

```sh
npm run db:migrate-tenant-ownership
```

The migration adds owner email, template, and subscription fields and backfills
owner emails from existing `tenant_admin` profiles where possible. Assign an
owner email in `/master-admin` for any tenant that could not be backfilled. The
owner must also have a Supabase Auth account with that same email to sign in;
the server resolves their tenant from the verified email and scopes admin
queries to that tenant. The designated super admin can securely impersonate a
tenant from its master-admin card. Storefront templates (`luxury`, `minimal`,
`classic`, `medical`, `tourism`, and `corporate`) and their themes are managed centrally; tenant owners cannot
change them. Cloudflare custom domains should use a CNAME pointing to
`skteamgoldgalleri.sk-team-it.workers.dev`.

Before deploying tenant onboarding, module controls, product image galleries,
and booking requests to an existing database, run:

```sh
npm run db:migrate-modules
```

Tenant admins must complete their KYC profile and accept the responsibility
agreement on first sign-in. Module visibility and data access are enforced by
server-side authorization and tenant-scoped Turso queries; Turso does not
provide native row-level security policies. Initialize storage again to create
or verify the private `licenses` bucket.

The tenant admin's `/admin/orders` page lists only that tenant's orders and
supports updating each order's status. `/admin/customers` provides a tenant
scoped customer list and order histories; `/admin/guide` documents the
tenant-owner capabilities and restrictions. `/master-admin/system-guide`
contains platform handover instructions.

The public storefront for the default shop is available at `/skteam` (the
tenant ID `/team-gold-system` is also accepted). Visible products and store categories are loaded from Turso. Customers can add
products to a browser-persisted cart. Checkout requires a signed-in customer,
rechecks product prices in Turso, and creates a pending mock order; no online
payment is performed. Store owners can configure storefront branding,
contact details, nested categories, and product specifications from `/admin`.
The master admin can edit tenant settings and the platform footer name/URL. The
storefront filters products with `?category=...`. The live-price widget and
price calculator read local 18k gold and dollar prices from TGJU through
`/api/tgju`, and compare the local 18k price with the ounce-and-dollar-derived
global price. The daily, weekly, and monthly chart currently uses mock history;
its current price is live. Customers can submit custom designs at
`/custom-order`, see saved products at `/wishlist`, and review products after
purchase. Store contact information and Waze, Neshan, and Balad routing links
are shown on the contact page and storefront footer.

To seed the default store with sample products and men's/women's categories, run:

```sh
npm run db:seed-products
```

The seed is safe to rerun: it updates only its two sample categories and eight
sample products for the default tenant.
