import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getStoreBySlug,
  getStorefrontCatalog,
  getStorefrontCustomerState,
} from "@/lib/storefront-data";
import ProductCatalog from "../product-catalog";
import PriceCalculator from "../price-calculator";
import PriceTrends from "../price-trends";
import TrustBadges from "../trust-badges";


export default function StorefrontPage(props: PageProps<"/[tenant_slug]">) {
  return (
    <Suspense
      fallback={
        <main className="min-h-[65vh] bg-[var(--color-bg)]" aria-busy="true" />
      }
    >
      <StorefrontContent params={props.params} />
    </Suspense>
  );
}

async function StorefrontContent({
  params,
}: {
  params: Promise<{ tenant_slug: string }>;
}) {
  const { tenant_slug: slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  const [catalog, customerState] = await Promise.all([
    getStorefrontCatalog(store.id),
    getStorefrontCustomerState(store.id),
  ]);

  return (
    <div>
      <section className="relative isolate overflow-hidden border-b border-white/[0.06] bg-[var(--color-surface)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_45%,color-mix(in_srgb,var(--color-primary)_19%,transparent),transparent_38%),linear-gradient(130deg,var(--color-surface)_5%,var(--color-bg)_72%)]" />
        <div className="pointer-events-none absolute -left-24 top-0 -z-10 h-[28rem] w-[28rem] rounded-full border border-[var(--color-primary)]/[0.08] sm:-left-4 sm:top-[-5rem]" />
        <div className="pointer-events-none absolute -left-8 top-16 -z-10 h-[22rem] w-[22rem] rounded-full border border-[var(--color-primary)]/[0.1]" />
        <div className="mx-auto grid min-h-[440px] max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.15fr_0.85fr] md:py-20 lg:min-h-[520px]">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.07] px-4 py-2 text-xs font-medium text-[var(--color-primary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              اصالت، ظرافت، ماندگاری
            </p>
            <h1 className="text-4xl font-semibold leading-[1.5] tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-6xl">
              {store.heroTitle || store.name}
              {store.heroSubtitle ? (
                <span className="mt-1 block text-[var(--color-primary)]">{store.heroSubtitle}</span>
              ) : (
                <span className="mt-1 block text-[var(--color-primary)]">زیباییِ ماندگار</span>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-8 text-[#aaa79b] sm:text-base">
              {store.description ||
                "کالکشن منتخب طلا و جواهر را با دقتی درخور لحظه‌های خاص زندگی کشف کنید."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                className="rounded-xl bg-[var(--color-primary)] px-6 py-3.5 text-sm font-semibold text-[var(--color-bg)] shadow-[0_12px_30px_color-mix(in_srgb,var(--color-primary)_13%,transparent)] transition hover:bg-[var(--color-primary)]"
                href="#products"
              >
                دیدن محصولات
              </Link>
              <span className="text-xs text-[#858378]">
                انتخابی برای هر روز و هر مناسبت
              </span>
            </div>
          </div>

          <div className="relative mx-auto flex h-[260px] w-full max-w-[410px] items-center justify-center sm:h-[330px]">
            <div className="absolute h-[250px] w-[250px] rounded-full border border-[var(--color-primary)]/20 sm:h-[310px] sm:w-[310px]" />
            <div className="absolute h-[205px] w-[205px] rounded-full border border-[var(--color-primary)]/15 sm:h-[260px] sm:w-[260px]" />
            <div className="absolute h-[150px] w-[150px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-primary)_18%,transparent),color-mix(in_srgb,var(--color-primary)_1.5%,transparent)_68%,transparent_70%)] sm:h-[200px] sm:w-[200px]" />
            <div className="relative flex h-36 w-36 rotate-45 items-center justify-center rounded-[2rem] border border-[var(--color-primary)]/45 bg-gradient-to-br from-[var(--color-primary)]/25 via-[var(--color-surface)]/60 to-[var(--color-surface)] shadow-[0_20px_80px_color-mix(in_srgb,var(--color-primary)_13%,transparent)] sm:h-44 sm:w-44">
              <span className="-rotate-45 text-7xl font-extralight text-[var(--color-primary)] sm:text-8xl">
                ◈
              </span>
            </div>
            <span className="absolute right-[13%] top-[20%] text-xl text-[var(--color-primary)]">
              ✧
            </span>
            <span className="absolute bottom-[18%] left-[12%] text-sm text-[var(--color-primary)]">
              ✦
            </span>
          </div>
        </div>
      </section>

      <TrustBadges />

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.25fr_0.75fr]">
        <PriceTrends />
        <PriceCalculator />
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16"
        id="products"
      >
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-[var(--color-primary)]">
              کالکشن فروشگاه
            </p>
            <h2 className="text-2xl font-semibold sm:text-3xl">محصولات منتخب</h2>
          </div>
          <p className="text-xs text-[#858378]">
            {catalog.products.length.toLocaleString("fa-IR")} محصول قابل مشاهده
          </p>
        </div>

        <ProductCatalog
          categories={catalog.categories}
          isCustomer={Boolean(customerState)}
          products={catalog.products}
          store={store}
          wishlistedProductIds={customerState?.wishlistedProductIds}
        />
      </section>

      <section className="border-y border-white/[0.05] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-[var(--color-text)]">
              انتخابی ارزشمند، تجربه‌ای مطمئن
            </p>
            <p className="mt-1.5 text-xs leading-6 text-[#858378]">
              هر قطعه با توجه به زیبایی و کیفیت انتخاب شده است.
            </p>
          </div>
          <Link
            className="w-fit rounded-xl border border-[var(--color-primary)]/30 px-4 py-2.5 text-xs font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/[0.08]"
            href="/cart"
          >
            رفتن به سبد خرید
          </Link>
        </div>
      </section>
    </div>
  );
}
