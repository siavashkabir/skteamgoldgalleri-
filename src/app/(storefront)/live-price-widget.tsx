"use client";
import { useMarketPrice } from "./market-price-context";
import { resolveBusinessKind } from "@/lib/tenant-features";

export default function LivePriceWidget({ businessType, showWidget }: { businessType?: string | null, showWidget?: boolean }) {
  const { price, error } = useMarketPrice();
  if (!showWidget) return null;

  const kind = resolveBusinessKind(businessType, ["gold_features"]);
  
  const formatNum = (num: number | undefined) => (num !== undefined && num !== null && num > 0) ? `${Math.round(num).toLocaleString("fa-IR")} تومان` : "نامشخص";
  const formatUSD = (num: number | undefined) => (num !== undefined && num !== null && num > 0) ? `$${Math.round(num).toLocaleString("en-US")}` : "نامشخص";
  const formatPercent = (num: number | undefined) => (num !== undefined && num !== null) ? `${num > 0 ? "+" : ""}${num.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪` : "-";

  let items: { label: string; value: string }[] = [];

  if (kind === "gold") {
    items = [
      { label: "انس جهانی", value: formatUSD(price?.ouncePrice) },
      { label: "دلار", value: formatNum(price?.dollarPrice) },
      { label: "طلای ۱۸ عیار", value: formatNum(price?.eighteenKPrice) },
      { label: "حباب بازار", value: formatPercent(price?.bubblePercentage) },
    ];
  } else {
    items = [
      { label: "دلار", value: formatNum(price?.dollarPrice) },
      { label: "یورو", value: formatNum(price?.euroPrice) },
      { label: "درهم", value: formatNum(price?.dirhamPrice) },
      { label: "لیر", value: formatNum(price?.liraPrice) },
    ];
  }

  // فرمت کردن تاریخ کش برای نمایش
  let cacheInfo = null;
  if (price?.isCached && price.cacheUpdatedAt) {
    const date = new Date(price.cacheUpdatedAt);
    cacheInfo = date.toLocaleString("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const gridClass = items.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2";
  return (
    <div className="border-t border-white/[0.06] bg-[var(--color-bg)]/80" title={price?.isApproximate ? "قیمت‌ها تقریبی است" : error ?? "به‌روزرسانی خودکار"}>
      <div className={`mx-auto grid max-w-7xl gap-2 px-4 py-2 sm:gap-4 sm:px-8 ${gridClass}`}>
        {items.map((item, idx) => (
          <div key={idx} className="min-w-0 rounded-lg border border-[var(--color-primary)]/15 bg-[var(--color-primary)]/[0.04] px-2 py-1.5 text-center sm:px-3">
            <span className="block truncate text-[10px] text-[#aaa79b]">{item.label}</span>
            <strong className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--color-primary)] sm:text-xs">{item.value}</strong>
          </div>
        ))}
      </div>
      {cacheInfo && (
        <div className="text-center text-[10px] text-yellow-500/80 pb-1 bg-[var(--color-bg)]/80">
          آخرین قیمت ثبت‌شده: {cacheInfo} (در حال تلاش برای دریافت لحظه‌ای...)
        </div>
      )}
    </div>
  );
}
