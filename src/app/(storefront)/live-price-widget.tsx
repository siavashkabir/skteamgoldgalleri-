"use client";

import { useMarketPrice } from "./market-price-context";

export default function LivePriceWidget() {
  const { price, error } = useMarketPrice();

  return (
    <div
      aria-label="قیمت‌های لحظه‌ای"
      aria-live="polite"
      className="border-t border-white/[0.06] bg-[var(--color-bg)]/80"
      title={error ?? "به‌روزرسانی خودکار هر ۵ دقیقه"}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-2 sm:grid-cols-4 sm:gap-4 sm:px-8">
        <PriceValue
          label="انس جهانی"
          value={price ? formatCurrency(price.ouncePrice, "USD") : statusText(error)}
        />
        <PriceValue
          label="دلار"
          value={price ? `${Math.round(price.dollarPrice).toLocaleString("fa-IR")} تومان` : statusText(error)}
        />
        <PriceValue
          label="طلای ۱۸ عیار"
          value={price ? `${Math.round(price.eighteenKPrice).toLocaleString("fa-IR")} تومان` : statusText(error)}
        />
        <PriceValue
          label="حباب بازار"
          value={price ? `${price.bubblePercentage > 0 ? "+" : ""}${price.bubblePercentage.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪` : statusText(error)}
        />
      </div>
    </div>
  );
}

function PriceValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--color-primary)]/15 bg-[var(--color-primary)]/[0.04] px-2 py-1.5 text-center sm:px-3">
      <span className="block truncate text-[10px] text-[#aaa79b]">{label}</span>
      <strong className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--color-primary)] sm:text-xs">
        {value}
      </strong>
    </div>
  );
}

function statusText(error: string | null) {
  return error ?? "در حال دریافت...";
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("fa-IR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
