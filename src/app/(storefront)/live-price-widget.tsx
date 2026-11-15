"use client";

import { useMarketPrice } from "./market-price-context";

export default function LivePriceWidget({ businessType }: { businessType?: string | null }) {
  const { price, error } = useMarketPrice();

  const formatNum = (num: number | undefined) => num ? `${Math.round(num).toLocaleString("fa-IR")} تومان` : statusText(error);
  const statusText = (err: string | null) => err ?? "در حال دریافت...";
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("fa-IR", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  };

  return (
    <div className="border-t border-white/[0.06] bg-[var(--color-bg)]/80" title={error ?? "به‌روزرسانی خودکار هر ۵ دقیقه"}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-2 sm:grid-cols-4 sm:gap-4 sm:px-8">
        <PriceValue label="انس جهانی" value={price ? formatCurrency(price.ouncePrice, "USD") : statusText(error)} />
        <PriceValue label="دلار" value={formatNum(price?.dollarPrice)} />
        <PriceValue label="طلای ۱۸ عیار" value={formatNum(price?.eighteenKPrice)} />
        <PriceValue label="حباب بازار" value={price ? `${price.bubblePercentage > 0 ? "+" : ""}${price.bubblePercentage.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪` : statusText(error)} />
      </div>
    </div>
  );
}

function PriceValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--color-primary)]/15 bg-[var(--color-primary)]/[0.04] px-2 py-1.5 text-center sm:px-3">
      <span className="block truncate text-[10px] text-[#aaa79b]">{label}</span>
      <strong className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--color-primary)] sm:text-xs">{value}</strong>
    </div>
  );
}
