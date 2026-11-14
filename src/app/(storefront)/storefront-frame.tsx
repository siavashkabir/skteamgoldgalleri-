import type { ReactNode } from "react";
import type { StorefrontCategory, StorefrontStore } from "@/lib/storefront-types";
import StorefrontFooter from "./storefront-footer";
import StorefrontHeader from "./storefront-header";

export default function StorefrontFrame({
  children,
  store,
  categories = [],
}: {
  children: ReactNode;
  store: StorefrontStore;
  categories?: StorefrontCategory[];
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader categories={categories} store={store} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter store={store} />
    </div>
  );
}
