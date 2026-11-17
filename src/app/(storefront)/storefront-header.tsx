"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "./storefront-provider";
import LivePriceWidget from "./live-price-widget";
import type { StorefrontCategory, StorefrontStore } from "@/lib/storefront-types";
import { categoryFilterValue } from "@/lib/category-filters";
import { businessTypeLabel } from "@/lib/tenant-features";

export default function StorefrontHeader({
  store,
  categories,
}: {
  store: StorefrontStore;
  categories: StorefrontCategory[];
}) {
  const { itemCount } = useCart();
  const isCorporate =
    store.templateId === "corporate" ||
    store.enabledModules.includes("corporate");
  const hasEcommerce =
    store.enabledModules.includes("ecommerce") && !isCorporate;

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[var(--color-bg)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          className="flex min-w-0 items-center gap-3"
          href={`/${store.slug}`}
        >
          {store.logoUrl ? (
            <Image alt="" className="h-11 w-11 rounded-xl object-cover" height={44} src={store.logoUrl} unoptimized width={44} />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/[0.09] text-xl font-semibold text-[var(--color-primary)]">
              {Array.from(store.name.trim())[0] ?? "ت"}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--color-text)] sm:text-base">
              {store.name}
            </span>
            <span className="mt-0.5 block text-[9px] tracking-[0.12em] text-[#898578]">
              {businessTypeLabel(store.businessType) ||
                (store.templateId === "medical"
                  ? "سلامت و درمان"
                  : store.templateId === "tourism"
                    ? "سفر و گردشگری"
                    : "معرفی کسب‌وکار")}
            </span>
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-4">
          {hasEcommerce && categories.length ? (
            <details className="relative hidden sm:block">
              <summary className="cursor-pointer list-none text-sm text-[#aaa79b] hover:text-[var(--color-primary)]">
                دسته‌بندی‌ها
              </summary>
              <div className="absolute right-0 top-full z-40 mt-4 max-h-[70vh] min-w-56 overflow-y-auto rounded-xl border border-white/10 bg-[var(--color-surface)] p-3 shadow-xl">
                <CategoryTree categories={categories} parentId={null} store={store} />
              </div>
            </details>
          ) : null}
          {hasEcommerce ? <Link
            className="hidden text-sm text-[#aaa79b] transition hover:text-[var(--color-primary)] sm:inline-flex"
            href={`/${store.slug}#products`}
          >
            محصولات
          </Link> : null}
          {store.enabledModules.includes("gallery") ? <Link
            className="hidden text-sm text-[#aaa79b] transition hover:text-[var(--color-primary)] sm:inline-flex"
            href={`/${store.slug}/custom-order`}
          >
            سفارش اختصاصی
          </Link> : null}
          <Link
            className="hidden text-sm text-[#aaa79b] transition hover:text-[var(--color-primary)] lg:inline-flex"
            href={`/${store.slug}/contact`}
          >
            تماس با ما
          </Link>
          {hasEcommerce ? <Link
            aria-label="علاقه‌مندی‌ها"
            className="hidden rounded-xl border border-white/[0.09] px-3 py-2.5 text-[var(--color-primary)] transition hover:border-[var(--color-primary)]/40 sm:inline-flex"
            href="/wishlist"
          >
            ♡
          </Link> : null}
          {hasEcommerce ? <Link
            className="flex items-center gap-2 rounded-xl border border-white/[0.09] px-3 py-2.5 text-sm text-[var(--color-text)] transition hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] sm:px-4"
            href="/cart"
          >
            <CartIcon />
            <span className="hidden sm:inline">سبد خرید</span>
            <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-[var(--color-bg)]">
              {itemCount.toLocaleString("fa-IR")}
            </span>
          </Link> : null}
          <Link
            className="hidden rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-bg)] transition hover:bg-[var(--color-primary)] md:inline-flex"
            href={`/login?next=${encodeURIComponent(`/${store.slug}`)}`}
          >
            ورود / حساب
          </Link>
        </nav>
      </div>
      {hasEcommerce ? <LivePriceWidget enabledCurrencies={store.enabled_currencies} showWidget={store.show_header_widget !== 0 && store.show_header_widget !== false} /> : null}
    </header>
  );
}

function CategoryTree({
  categories,
  parentId,
  store,
  ancestors = [],
}: {
  categories: StorefrontCategory[];
  parentId: string | null;
  store: StorefrontStore;
  ancestors?: string[];
}) {
  return categories
    .filter((category) => category.parentId === parentId && !ancestors.includes(category.id))
    .map((category) => (
      <div className={parentId ? "pr-4" : "py-1"} key={category.id}>
        <CategoryLink category={category} store={store} />
        <CategoryTree
          ancestors={[...ancestors, category.id]}
          categories={categories}
          parentId={category.id}
          store={store}
        />
      </div>
    ));
}

function CategoryLink({
  category,
  store,
}: {
  category: StorefrontCategory;
  store: StorefrontStore;
}) {
  const filter = categoryFilterValue(category);
  return (
    <Link
      className="block rounded-lg px-3 py-2 text-xs text-[#c5c1b6] hover:bg-white/[0.05] hover:text-[var(--color-primary)]"
      href={`/${store.slug}?category=${encodeURIComponent(filter)}#products`}
    >
      {category.name}
    </Link>
  );
}

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M2.5 3.5h2l1.8 9.1a1.5 1.5 0 0 0 1.5 1.2h7.1a1.5 1.5 0 0 0 1.5-1.2L17.5 7H5.1M8 17h.01M14 17h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
