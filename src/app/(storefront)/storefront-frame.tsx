import type { ReactNode } from "react";
import type { StorefrontStore } from "@/lib/storefront-types";
import StorefrontFooter from "./storefront-footer";
import StorefrontHeader from "./storefront-header";

export default function StorefrontFrame({
  children,
  store,
}: {
  children: ReactNode;
  store: StorefrontStore;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader store={store} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter store={store} />
    </div>
  );
}
