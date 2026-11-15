import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalCustomerContext } from "@/lib/admin-context";
import { getStoreBySlug, getStorefrontCatalog } from "@/lib/storefront-data";
import { db } from "@/lib/db";
import ProductCatalog from "../product-catalog";
import StorefrontFrame from "../storefront-frame";

export default async function WishlistPage() {
  const customer = await getOptionalCustomerContext();
  if (!customer) {
    redirect(`/login?next=${encodeURIComponent("/wishlist")}`);
  }
  const store = await getStoreBySlug(customer.tenantId);
  if (!store) {
    throw new Error("فروشگاه حساب کاربری برای نمایش علاقه‌مندی‌ها پیدا نشد.");
  }
  const [catalog, wishlistResult] = await Promise.all([
    getStorefrontCatalog(store.id),
    db.execute({
      sql: "SELECT product_id FROM wishlist WHERE tenant_id = ? AND customer_id = ?",
      args: [store.id, customer.userId],
    }),
  ]);
  const savedIds = wishlistResult.rows.map((row) => String(row.product_id));
  const savedProducts = catalog.products.filter((product) =>
    savedIds.includes(product.id),
  );

  return (
    <StorefrontFrame categories={catalog.categories} store={store}>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[var(--color-primary)]">انتخاب‌های شما</p>
            <h1 className="mt-2 text-2xl font-semibold">علاقه‌مندی‌ها</h1>
          </div>
          <span className="text-xs text-[#858378]">
            {savedProducts.length.toLocaleString("fa-IR")} محصول
          </span>
        </div>
        {savedProducts.length ? (
          <ProductCatalog
            categories={catalog.categories}
            isCustomer
            products={savedProducts}
            store={store}
            wishlistedProductIds={savedIds}
          />
        ) : (
          <div className="rounded-2xl border border-white/[0.07] bg-[var(--color-surface)] px-5 py-14 text-center">
            <p className="text-sm text-[#969387]">هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید.</p>
            <Link className="mt-5 inline-flex rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-bg)]" href={`/${store.slug}`}>
              دیدن محصولات
            </Link>
          </div>
        )}
      </section>
    </StorefrontFrame>
  );
}
