import type { CSSProperties, ReactNode } from "react";
import type { StorefrontCategory, StorefrontStore } from "@/lib/storefront-types";
import StorefrontFooter from "./storefront-footer";
import StorefrontHeader from "./storefront-header";
import { MarketPriceProvider } from "./market-price-context";

export default function StorefrontFrame({
  children,
  store,
  categories = [],
}: {
  children: ReactNode;
  store: StorefrontStore;
  categories?: StorefrontCategory[];
}) {
  const { primary, background, text } = store.themeSettings;
  const themeStyle = {
    "--color-primary": primary,
    "--color-bg": background,
    "--color-text": text,
  } as CSSProperties & {
    "--color-primary": string;
    "--color-bg": string;
    "--color-text": string;
  };

  return (
    <MarketPriceProvider>
      <div
        className="storefront-theme flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]"
        style={themeStyle}
      >
        <StorefrontHeader categories={categories} store={store} />
        <main className="flex-1">{children}</main>
        <StorefrontFooter store={store} />
      </div>
    </MarketPriceProvider>
  );
}
