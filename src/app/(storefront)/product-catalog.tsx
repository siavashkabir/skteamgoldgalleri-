"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  StorefrontCategory,
  StorefrontProduct,
  StorefrontStore,
} from "@/lib/storefront-types";
import {
  categoryFilterValue,
  genderFilterForName,
} from "@/lib/category-filters";
import { useCart } from "./storefront-provider";
import WishlistButton from "./wishlist-button";

export default function ProductCatalog({
  categories,
  products,
  store,
  wishlistedProductIds = [],
  isCustomer = false,
}: {
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  store: StorefrontStore;
  wishlistedProductIds?: string[];
  isCustomer?: boolean;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selectedFilter = searchParams.get("category");
  const safeCategories = useMemo(
    () =>
      Array.isArray(categories)
        ? categories.filter(isStorefrontCategory)
        : [],
    [categories],
  );
  const safeProducts = useMemo(
    () =>
      Array.isArray(products)
        ? products.filter(isStorefrontProduct)
        : [],
    [products],
  );
  const categoryOptions = useMemo(() => {
    const options = new Map(
      safeCategories.map((category) => [category.id, category]),
    );
    const categoryNames = new Set(
      safeCategories.map((category) => normalizeCategoryName(category.name)),
    );
    for (const product of safeProducts) {
      if (!product.categoryName) continue;
      const nameKey = normalizeCategoryName(product.categoryName);
      if (categoryNames.has(nameKey)) continue;
      const id = product.categoryId || product.categoryName;
      if (!options.has(id)) {
        options.set(id, {
          id,
          name: product.categoryName,
          parentId: null,
          slug: categoryFilterSlug(product.categoryName),
        });
        categoryNames.add(nameKey);
      }
    }
    return [...options.values()];
  }, [safeCategories, safeProducts]);
  const visibleProducts = useMemo(() => {
    if (!selectedFilter) return safeProducts;
    if (selectedFilter === "men" || selectedFilter === "women") {
      const included = new Set(
        categoryOptions
          .filter((category) => genderFilterForName(category.name) === selectedFilter)
          .map((category) => category.id),
      );
      includeDescendants(categoryOptions, included);
      const categoryById = new Map(
        categoryOptions.map((category) => [category.id, category]),
      );
      return safeProducts.filter((product) => {
        const categoryName =
          product.categoryName ??
          (product.categoryId ? categoryById.get(product.categoryId)?.name : null);
        const categoryGender = categoryName
          ? genderFilterForName(categoryName)
          : null;
        if (categoryGender) return categoryGender === selectedFilter;
        return (
          (product.categoryId !== null && included.has(product.categoryId)) ||
          genderFilterForName(product.name) === selectedFilter
        );
      });
    }

    const matches = categoryOptions.filter((category) => {
      if (category.id === selectedFilter || category.slug === selectedFilter) {
        return true;
      }
      return false;
    });
    const included = new Set(matches.map((category) => category.id));
    includeDescendants(categoryOptions, included);
    const includedNames = new Set(
      categoryOptions
        .filter((category) => included.has(category.id))
        .map((category) => normalizeCategoryName(category.name)),
    );
    return safeProducts.filter(
      (product) =>
        (typeof product.categoryId === "string" &&
          included.has(product.categoryId)) ||
        (typeof product.categoryName === "string" &&
          includedNames.has(normalizeCategoryName(product.categoryName))),
    );
  }, [categoryOptions, safeProducts, selectedFilter]);

  function selectCategory(category: StorefrontCategory | null) {
    const filter = category ? categoryFilterValue(category) : null;
    const params = new URLSearchParams(searchParams.toString());
    if (filter) params.set("category", filter);
    else params.delete("category");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}#products`, { scroll: false });
  }

  return (
    <>
      <div
        aria-label="دسته‌بندی محصولات"
        className="mb-7 flex gap-2 overflow-x-auto pb-2"
        role="group"
      >
        <button
          aria-pressed={!selectedFilter}
          className={categoryClass(!selectedFilter)}
          onClick={() => selectCategory(null)}
          type="button"
        >
          همه محصولات
        </button>
        {categoryOptions.map((category) => {
          const filter = categoryFilterValue(category);
          const active =
            selectedFilter === category.id ||
            selectedFilter === category.slug ||
            selectedFilter === filter;
          return (
          <button
            aria-pressed={active}
            className={categoryClass(active)}
            key={category.id}
            onClick={() => selectCategory(category)}
            type="button"
          >
            {category.name}
          </button>
          );
        })}
      </div>

      {visibleProducts.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard
              isCustomer={isCustomer}
              isWishlisted={wishlistedProductIds.includes(product.id)}
              key={product.id}
              product={product}
              store={store}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-[var(--color-surface)] px-5 py-12 text-center text-sm text-[#929085]">
          {safeProducts.length === 0
            ? "هنوز محصولی در فروشگاه ثبت نشده است."
            : selectedFilter
              ? "در این دسته‌بندی محصولی ثبت نشده است."
              : "در این دسته‌بندی محصولی ثبت نشده است."}
        </div>
      )}
    </>
  );
}

function includeDescendants(
  categories: StorefrontCategory[],
  included: Set<string>,
) {
  let found = true;
  while (found) {
    found = false;
    for (const category of categories) {
      if (
        category.parentId &&
        included.has(category.parentId) &&
        !included.has(category.id)
      ) {
        included.add(category.id);
        found = true;
      }
    }
  }
}

function ProductCard({
  product,
  store,
  isCustomer,
  isWishlisted,
}: {
  product: StorefrontProduct;
  store: StorefrontStore;
  isCustomer: boolean;
  isWishlisted: boolean;
}) {
  const { addItem } = useCart();
  const priceAvailable =
    product.price !== null &&
    Number.isFinite(product.price) &&
    product.price > 0;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[var(--color-surface)] transition duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)]/25 hover:shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
      <WishlistButton
        isSaved={isWishlisted}
        loginPath={
          isCustomer ? "" : `/login?next=${encodeURIComponent(`/${store.slug}`)}`
        }
        productId={product.id}
      />
      <Link
        aria-label={`مشاهده ${product.name}`}
        className="block"
        href={`/${store.slug}/products/${product.id}`}
      >
        <div className="relative aspect-[4/4.5] overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,color-mix(in_srgb,var(--color-primary)_12%,transparent),color-mix(in_srgb,var(--color-text)_1.5%,transparent)_65%)]">
          {product.imageUrl ? (
            <Image
              alt={product.name}
              className="object-cover transition duration-500 group-hover:scale-105"
              fill
              sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 23vw"
              src={product.imageUrl}
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-6xl font-extralight text-[var(--color-primary)]/60 transition duration-500 group-hover:scale-110">
                ◈
              </span>
            </div>
          )}
          {product.categoryName ? (
            <span className="absolute right-3 top-3 rounded-full border border-white/[0.08] bg-[var(--color-bg)]/80 px-2.5 py-1 text-[10px] text-[#d6c9a8] backdrop-blur">
              {product.categoryName}
            </span>
          ) : null}
        </div>
        <div className="px-3.5 pt-4 sm:px-4">
          <h3 className="line-clamp-1 min-h-6 text-sm font-medium text-[var(--color-text)] transition group-hover:text-[var(--color-primary)]">
            {product.name}
          </h3>
          <p className="mt-1.5 text-[11px] text-[#858378]">
            {product.weight === null
              ? "وزن ثبت نشده"
              : `${product.weight.toLocaleString("fa-IR")} گرم`}
          </p>
          <p aria-label={product.ratingCount ? `امتیاز ${product.ratingAverage?.toFixed(1)} از ۵` : "بدون امتیاز"} className="mt-1.5 text-[11px] text-[var(--color-primary)]">
            {product.ratingCount
              ? `★ ${product.ratingAverage?.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} (${product.ratingCount.toLocaleString("fa-IR")})`
              : "هنوز امتیازی ثبت نشده"}
          </p>
          <p className="mt-3 min-h-5 text-sm font-semibold text-[var(--color-primary)]">
            {product.price !== null && priceAvailable
              ? formatPrice(product.price)
              : "قیمت استعلام شود"}
          </p>
        </div>
      </Link>
      <div className="px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4">
        <button
          className="w-full rounded-xl border border-[var(--color-primary)]/25 py-2.5 text-xs font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!priceAvailable}
          onClick={() => addItem(product, store.id, store.slug)}
          type="button"
        >
          افزودن به سبد
        </button>
      </div>
    </article>
  );
}

function categoryClass(active: boolean) {
  return `shrink-0 rounded-full border px-4 py-2 text-xs transition ${
    active
      ? "border-[var(--color-primary)] bg-[var(--color-primary)] font-semibold text-[var(--color-bg)]"
      : "border-white/[0.09] bg-[var(--color-surface)] text-[#aaa79b] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
  }`;
}

function categoryFilterSlug(name: string) {
  return name.trim().toLocaleLowerCase("fa").replace(/\s+/g, "-");
}

function normalizeCategoryName(name: string) {
  return (typeof name === "string" ? name : "").trim().toLocaleLowerCase("fa");
}

function isStorefrontCategory(
  value: unknown,
): value is StorefrontCategory {
  if (!value || typeof value !== "object") return false;
  const category = value as Partial<StorefrontCategory>;
  return (
    typeof category.id === "string" &&
    typeof category.name === "string" &&
    typeof category.slug === "string" &&
    (category.parentId === null || typeof category.parentId === "string")
  );
}

function isStorefrontProduct(value: unknown): value is StorefrontProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<StorefrontProduct>;
  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    (product.categoryId === null || typeof product.categoryId === "string") &&
    (product.categoryName === null ||
      typeof product.categoryName === "string")
  );
}

function formatPrice(value: number): string {
  return `${value.toLocaleString("fa-IR")} تومان`;
}
