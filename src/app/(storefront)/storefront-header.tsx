"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "./storefront-provider";
import LivePriceWidget from "./live-price-widget";
import type { StorefrontCategory, StorefrontStore } from "@/lib/storefront-types";
import { categoryFilterValue } from "@/lib/category-filters";

export default function StorefrontHeader({
  store,
  categories,
}: {
  store: StorefrontStore;
  categories: StorefrontCategory[];
}) {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#11110f]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          className="flex min-w-0 items-center gap-3"
          href={`/${store.slug}`}
        >
          {store.logoUrl ? (
            <Image alt="" className="h-11 w-11 rounded-xl object-cover" height={44} src={store.logoUrl} unoptimized width={44} />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d6ad56]/30 bg-[#d6ad56]/[0.09] text-xl font-semibold text-[#e2c16d]">
              ت
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[#f5f2e9] sm:text-base">
              {store.name}
            </span>
            <span className="mt-0.5 block text-[9px] tracking-[0.2em] text-[#898578]">
              GOLD · JEWELLERY
            </span>
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-4">
          {categories.length ? (
            <details className="relative hidden sm:block">
              <summary className="cursor-pointer list-none text-sm text-[#aaa79b] hover:text-[#e2c16d]">
                دسته‌بندی‌ها
              </summary>
              <div className="absolute right-0 top-full z-40 mt-4 max-h-[70vh] min-w-56 overflow-y-auto rounded-xl border border-white/10 bg-[#171716] p-3 shadow-xl">
                <CategoryTree categories={categories} parentId={null} store={store} />
              </div>
            </details>
          ) : null}
          <Link
            className="hidden text-sm text-[#aaa79b] transition hover:text-[#e2c16d] sm:inline-flex"
            href={`/${store.slug}#products`}
          >
            محصولات
          </Link>
          <Link
            className="hidden text-sm text-[#aaa79b] transition hover:text-[#e2c16d] sm:inline-flex"
            href={`/${store.slug}/custom-order`}
          >
            سفارش اختصاصی
          </Link>
          <Link
            className="hidden text-sm text-[#aaa79b] transition hover:text-[#e2c16d] lg:inline-flex"
            href={`/${store.slug}/contact`}
          >
            تماس با ما
          </Link>
          <Link
            aria-label="علاقه‌مندی‌ها"
            className="hidden rounded-xl border border-white/[0.09] px-3 py-2.5 text-[#e2c16d] transition hover:border-[#d6ad56]/40 sm:inline-flex"
            href="/wishlist"
          >
            ♡
          </Link>
          <Link
            className="flex items-center gap-2 rounded-xl border border-white/[0.09] px-3 py-2.5 text-sm text-[#e9e5db] transition hover:border-[#d6ad56]/40 hover:text-[#e2c16d] sm:px-4"
            href="/cart"
          >
            <CartIcon />
            <span className="hidden sm:inline">سبد خرید</span>
            <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#d6ad56] px-1 text-[10px] font-bold text-[#211a0d]">
              {itemCount.toLocaleString("fa-IR")}
            </span>
          </Link>
          <Link
            className="hidden rounded-xl bg-[#d6ad56] px-4 py-2.5 text-sm font-semibold text-[#211a0d] transition hover:bg-[#e2bf70] md:inline-flex"
            href="/login"
          >
            ورود / حساب
          </Link>
        </nav>
      </div>
      <LivePriceWidget />
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
      className="block rounded-lg px-3 py-2 text-xs text-[#c5c1b6] hover:bg-white/[0.05] hover:text-[#e2c16d]"
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
