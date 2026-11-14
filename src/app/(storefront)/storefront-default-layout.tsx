import type { ReactNode } from "react";
import { getStoreBySlug } from "@/lib/storefront-data";
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

  return <StorefrontFrame store={store}>{children}</StorefrontFrame>;
}
