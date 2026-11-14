import { Suspense, type ReactNode } from "react";
import { getStoreBySlug } from "@/lib/storefront-data";
import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";
import StorefrontFooter from "./storefront-footer";
import StorefrontHeader from "./storefront-header";
import { StorefrontProvider } from "./storefront-provider";

export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#10100f]" aria-busy="true" />
      }
    >
      <StorefrontFrame>{children}</StorefrontFrame>
    </Suspense>
  );
}

async function StorefrontFrame({ children }: { children: ReactNode }) {
  const store = await getStoreBySlug(DEFAULT_TENANT_ID);
  if (!store) {
    throw new Error("فروشگاه پیش‌فرض برای نمایش ویترین پیدا نشد.");
  }

  return (
    <StorefrontProvider>
      <div className="flex min-h-screen flex-col bg-[#10100f] text-[#f5f2e9]">
        <StorefrontHeader store={store} />
        <main className="flex-1">{children}</main>
        <StorefrontFooter store={store} />
      </div>
    </StorefrontProvider>
  );
}
