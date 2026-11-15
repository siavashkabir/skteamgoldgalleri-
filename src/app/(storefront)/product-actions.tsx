"use client";

import { useState } from "react";
import type {
  StorefrontProduct,
  StorefrontStore,
} from "@/lib/storefront-types";
import { useCart } from "./storefront-provider";

export default function AddToCartButton({
  product,
  store,
}: {
  product: StorefrontProduct;
  store: StorefrontStore;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const available =
    product.price !== null &&
    Number.isFinite(product.price) &&
    product.price > 0;

  return (
    <button
      className="w-full rounded-xl bg-[var(--color-primary)] px-5 py-3.5 text-sm font-semibold text-[var(--color-bg)] transition hover:bg-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
      disabled={!available}
      onClick={() => {
        addItem(product, store.id, store.slug);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
      type="button"
    >
      {available ? (added ? "به سبد اضافه شد ✓" : "افزودن به سبد خرید") : "قیمت در دسترس نیست"}
    </button>
  );
}
