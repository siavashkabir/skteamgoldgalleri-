"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  StorefrontCategory,
  StorefrontProduct,
  StorefrontStore,
} from "@/lib/storefront-types";
import { useCart } from "./storefront-provider";

export default function ProductCatalog({
  categories,
  products,
  store,
}: {
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  store: StorefrontStore;
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const categoryOptions = useMemo(() => {
    const options = new Map(categories.map((category) => [category.id, category]));
    for (const product of products) {
      if (product.categoryId && product.categoryName) {
        options.set(product.categoryId, {
          id: product.categoryId,
          name: product.categoryName,
        });
      } else if (product.categoryName) {
        options.set(product.categoryName, {
          id: product.categoryName,
          name: product.categoryName,
        });
      }
    }
    return [...options.values()];
  }, [categories, products]);
  const visibleProducts =
    selectedCategory === "all"
      ? products
      : products.filter(
          (product) =>
            product.categoryId === selectedCategory ||
            (!product.categoryId && product.categoryName === selectedCategory),
        );

  return (
    <>
      <div
        aria-label="دسته‌بندی محصولات"
        className="mb-7 flex gap-2 overflow-x-auto pb-2"
        role="group"
      >
        <button
          aria-pressed={selectedCategory === "all"}
          className={categoryClass(selectedCategory === "all")}
          onClick={() => setSelectedCategory("all")}
          type="button"
        >
          همه محصولات
        </button>
        {categoryOptions.map((category) => (
          <button
            aria-pressed={selectedCategory === category.id}
            className={categoryClass(selectedCategory === category.id)}
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            type="button"
          >
            {category.name}
          </button>
        ))}
      </div>

      {visibleProducts.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} store={store} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-[#171716] px-5 py-12 text-center text-sm text-[#929085]">
          {products.length === 0
            ? "هنوز محصولی در فروشگاه ثبت نشده است."
            : "در این دسته‌بندی محصولی ثبت نشده است."}
        </div>
      )}
    </>
  );
}

function ProductCard({
  product,
  store,
}: {
  product: StorefrontProduct;
  store: StorefrontStore;
}) {
  const { addItem } = useCart();
  const priceAvailable =
    product.price !== null &&
    Number.isFinite(product.price) &&
    product.price > 0;

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#171716] transition duration-300 hover:-translate-y-1 hover:border-[#d6ad56]/25 hover:shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
      <Link
        aria-label={`مشاهده ${product.name}`}
        className="block"
        href={`/${store.slug}/products/${product.id}`}
      >
        <div className="relative aspect-[4/4.5] overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,rgba(214,173,86,0.12),rgba(255,255,255,0.015)_65%)]">
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
              <span className="text-6xl font-extralight text-[#d6ad56]/60 transition duration-500 group-hover:scale-110">
                ◈
              </span>
            </div>
          )}
          {product.categoryName ? (
            <span className="absolute right-3 top-3 rounded-full border border-white/[0.08] bg-[#11110f]/80 px-2.5 py-1 text-[10px] text-[#d6c9a8] backdrop-blur">
              {product.categoryName}
            </span>
          ) : null}
        </div>
        <div className="px-3.5 pt-4 sm:px-4">
          <h3 className="line-clamp-1 min-h-6 text-sm font-medium text-[#eee9dc] transition group-hover:text-[#e2c16d]">
            {product.name}
          </h3>
          <p className="mt-1.5 text-[11px] text-[#858378]">
            {product.weight === null
              ? "وزن ثبت نشده"
              : `${product.weight.toLocaleString("fa-IR")} گرم`}
          </p>
          <p className="mt-3 min-h-5 text-sm font-semibold text-[#e2c16d]">
            {product.price !== null && priceAvailable
              ? formatPrice(product.price)
              : "قیمت استعلام شود"}
          </p>
        </div>
      </Link>
      <div className="px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4">
        <button
          className="w-full rounded-xl border border-[#d6ad56]/25 py-2.5 text-xs font-medium text-[#e2c16d] transition hover:bg-[#d6ad56] hover:text-[#211a0d] disabled:cursor-not-allowed disabled:opacity-40"
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
      ? "border-[#d6ad56] bg-[#d6ad56] font-semibold text-[#211a0d]"
      : "border-white/[0.09] bg-[#171716] text-[#aaa79b] hover:border-[#d6ad56]/40 hover:text-[#e2c16d]"
  }`;
}

function formatPrice(value: number): string {
  return `${value.toLocaleString("fa-IR")} تومان`;
}
