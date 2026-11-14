import type { ReactNode } from "react";
import { getStoreBySlug, getStorefrontCategories } from "@/lib/storefront-data";
import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";
import StorefrontFrame from "./storefront-frame";

export default async function StorefrontDefaultLayout({
  children,
}: {
  children: ReactNode;
}) {
  const store = await getStoreBySlug(DEFAULT_TENANT_ID);
  if (!store) {
    throw new Error("فروشگاه پیش‌فرض برای نمایش ویترین پیدا نشد.");
  }

  const categories = await getStorefrontCategories(store.id);
  return <StorefrontFrame categories={categories} store={store}>{children}</StorefrontFrame>;
}
