import type { CSSProperties, ReactNode } from "react";
import type { StorefrontCategory, StorefrontStore } from "@/lib/storefront-types";
import { getStorefrontBanner } from "@/lib/storefront-data";
import {
  DEFAULT_THEME_SETTINGS,
  type ThemeSettings,
} from "@/lib/theme-settings";
import StorefrontFooter from "./storefront-footer";
import StorefrontHeader from "./storefront-header";
import { MarketPriceProvider } from "./market-price-context";

export default async function StorefrontFrame({
  children,
  store,
  categories = [],
}: {
  children: ReactNode;
  store: StorefrontStore;
  categories?: StorefrontCategory[];
}) {
  const { bgImageUrl, bgOpacity } = store.themeSettings;
  const palette = getTemplatePalette(store.templateId, store.themeSettings);
  const banner = await getStorefrontBanner();
  const themeStyle = {
    "--color-primary": palette.primary,
    "--color-bg": palette.background,
    "--color-text": palette.text,
    "--color-accent": palette.accent,
    "--color-card": palette.card,
  } as CSSProperties & {
    "--color-primary": string;
    "--color-bg": string;
    "--color-text": string;
    "--color-accent": string;
    "--color-card": string;
  };
  const warning = getSubscriptionWarning(store.status, store.expiryDate);

  return (
    <MarketPriceProvider>
      <div
        className={`storefront-theme template-${store.templateId} relative flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]`}
        style={themeStyle}
      >
        {bgImageUrl ? (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${bgImageUrl.replaceAll('"', "%22")}")` }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-0 bg-black"
              style={{ opacity: bgOpacity / 100 }}
            />
          </>
        ) : null}
        <div className="relative z-10 flex min-h-screen flex-col">
          {banner ? (
            <div className="bg-[var(--color-primary)] px-4 py-2 text-center text-sm font-medium text-[var(--color-bg)]">
              {banner}
            </div>
          ) : null}
          {store.status === "suspended" ? (
            <main className="flex flex-1 items-center justify-center px-5 py-20">
              <section className="max-w-lg rounded-3xl border border-white/10 bg-[var(--color-card)] p-8 text-center shadow-2xl sm:p-12">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-3xl text-[var(--color-primary)]">
                  ◌
                </span>
                <h1 className="mt-6 text-2xl font-semibold">فروشگاه موقتاً بسته است</h1>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  {store.name} در حال حاضر امکان پذیرش سفارش جدید را ندارد.
                  برای اطلاعات بیشتر با فروشگاه تماس بگیرید.
                </p>
              </section>
            </main>
          ) : (
            <>
              {warning ? (
                <div className="bg-amber-400/15 px-4 py-2 text-center text-xs text-amber-100">
                  {warning}
                </div>
              ) : null}
              <StorefrontHeader categories={categories} store={store} />
              <main className="flex-1">{children}</main>
              <StorefrontFooter store={store} />
            </>
          )}
        </div>
      </div>
    </MarketPriceProvider>
  );
}

function getTemplatePalette(
  templateId: StorefrontStore["templateId"],
  theme: ThemeSettings,
): ThemeSettings {
  const presets: Record<
    StorefrontStore["templateId"],
    Pick<ThemeSettings, "primary" | "background" | "text" | "accent" | "card">
  > = {
    luxury: {
      primary: "#d4af37",
      background: "#0a0a0a",
      text: "#ffffff",
      accent: "#e2c16d",
      card: "#151514",
    },
    minimal: {
      primary: "#20242a",
      background: "#ffffff",
      text: "#17191c",
      accent: "#5b626a",
      card: "#f7f7f5",
    },
    classic: {
      primary: "#6e1d2a",
      background: "#f3ead7",
      text: "#451a1a",
      accent: "#a77a3b",
      card: "#fff8e9",
    },
    medical: {
      primary: "#247a9b",
      background: "#f1f8fb",
      text: "#153342",
      accent: "#5bb8c7",
      card: "#ffffff",
    },
    tourism: {
      primary: "#e46b36",
      background: "#fff7eb",
      text: "#28251f",
      accent: "#1d9a8a",
      card: "#ffffff",
    },
    corporate: {
      primary: "#183b66",
      background: "#f4f6f9",
      text: "#172333",
      accent: "#4878aa",
      card: "#ffffff",
    },
  };
  const template = presets[templateId];
  return {
    ...theme,
    primary:
      theme.primary === DEFAULT_THEME_SETTINGS.primary
        ? template.primary
        : theme.primary,
    background:
      theme.background === DEFAULT_THEME_SETTINGS.background
        ? template.background
        : theme.background,
    text:
      theme.text === DEFAULT_THEME_SETTINGS.text
        ? template.text
        : theme.text,
    accent:
      theme.accent === DEFAULT_THEME_SETTINGS.accent
        ? template.accent
        : theme.accent,
    card:
      theme.card === DEFAULT_THEME_SETTINGS.card
        ? template.card
        : theme.card,
  };
}

function getSubscriptionWarning(
  status: StorefrontStore["status"],
  expiryDate: string | null,
): string {
  if (status === "trial") {
    return "این فروشگاه در دوره آزمایشی قرار دارد.";
  }
  if (!expiryDate) {
    return "";
  }
  const daysUntilExpiry = Math.ceil(
    (new Date(`${expiryDate}T23:59:59`).getTime() - Date.now()) /
      (24 * 60 * 60 * 1000),
  );
  if (Number.isNaN(daysUntilExpiry) || daysUntilExpiry > 7) {
    return "";
  }
  return daysUntilExpiry < 0
    ? "مهلت اشتراک این فروشگاه به پایان رسیده است."
    : `اشتراک این فروشگاه تا ${daysUntilExpiry.toLocaleString("fa-IR")} روز دیگر به پایان می‌رسد.`;
}
