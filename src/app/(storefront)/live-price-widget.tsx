"use client";
import { useState } from "react";
import { useMarketPrice } from "./market-price-context";

const AVAILABLE_CURRENCIES: Record<string, { label: string; format: (val: number | undefined, source?: string) => string }> = {
  USD: { label: "دلار آمریکا", format: (v, s) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  EUR: { label: "یورو", format: (v) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  AED: { label: "درهم امارات", format: (v) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  TRY: { label: "لیر ترکیه", format: (v) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  CNY: { label: "یوان چین", format: (v) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  XAU: { label: "انس جهانی", format: (v) => (v && v > 0) ? `$${Math.round(v).toLocaleString("en-US")}` : "نامشخص" },
  "18K": { label: "طلای ۱۸ عیار", format: (v) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  BUBBLE: { label: "حباب بازار", format: (v) => (v !== undefined && v !== null) ? `${v > 0 ? "+" : ""}${v.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪` : "-" },
  BTC: { label: "بیت‌کوین", format: (v) => (v && v > 0) ? `$${Math.round(v).toLocaleString("en-US")}` : "نامشخص" }, 
  USDT: { label: "تتر", format: (v) => (v && v > 0) ? `${Math.round(v).toLocaleString("fa-IR")} تومان` : "نامشخص" },
  ETH: { label: "اتریوم", format: (v) => (v && v > 0) ? `$${Math.round(v).toLocaleString("en-US")}` : "نامشخص" },
};

export default function LivePriceWidget({ showWidget, enabledCurrencies }: { showWidget?: boolean, enabledCurrencies?: string | null }) {
  const { price, error } = useMarketPrice();
  const [isOpen, setIsOpen] = useState(false);

  if (!showWidget) return null;

  let selected = ["USD", "XAU", "18K", "BUBBLE"];
  try {
    if (enabledCurrencies) selected = JSON.parse(enabledCurrencies);
  } catch(e) {}

  const priceMap: Record<string, number | undefined> = {
    USD: price?.dollarPrice, EUR: price?.euroPrice, AED: price?.dirhamPrice, TRY: price?.liraPrice,
    CNY: price?.yuanPrice, XAU: price?.ouncePrice, "18K": price?.eighteenKPrice, BUBBLE: price?.bubblePercentage,
    // BTC و بقیه فعلا در API نیستند، اگر اضافه کردیم اینجا ست میشن
  };

  const mainItems = selected.slice(0, 4).map(key => ({
    key, label: AVAILABLE_CURRENCIES[key]?.label || key, value: AVAILABLE_CURRENCIES[key]?.format(priceMap[key], price?.source) || "نامشخص"
  }));

  const extraItems = selected.slice(4).map(key => ({
    key, label: AVAILABLE_CURRENCIES[key]?.label || key, value: AVAILABLE_CURRENCIES[key]?.format(priceMap[key], price?.source) || "نامشخص"
  }));

  let cacheInfo = null;
  if (price?.isCached && price.cacheUpdatedAt) {
    const date = new Date(price.cacheUpdatedAt);
    cacheInfo = date.toLocaleString("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="border-t border-white/[0.06] bg-[var(--color-bg)]/80 relative">
      <div className="mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-2 sm:gap-4 sm:px-8">
        {mainItems.map((item, idx) => (
          <div key={idx} className="min-w-0 rounded-lg border border-[var(--color-primary)]/15 bg-[var(--color-primary)]/[0.04] px-2 py-1.5 text-center sm:px-3">
            <span className="block truncate text-[10px] text-[#aaa79b]">{item.label}</span>
            <strong className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--color-primary)] sm:text-xs">{item.value}</strong>
          </div>
        ))}
      </div>

      {extraItems.length > 0 && (
        <div className="text-center pb-2">
          <button onClick={() => setIsOpen(!isOpen)} className="text-xs text-[var(--color-primary)] hover:underline">
            {isOpen ? "بستن لیست" : "مشاهده سایر ارزها"}
          </button>
          {isOpen && (
            <div className="absolute top-full left-0 right-0 z-50 bg-[var(--color-surface)] border border-white/10 p-4 shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-2">
              {extraItems.map((item, idx) => (
                <div key={idx} className="min-w-0 rounded-lg border border-white/5 bg-black/20 px-2 py-1.5 text-center">
                  <span className="block truncate text-[10px] text-[#aaa79b]">{item.label}</span>
                  <strong className="mt-0.5 block truncate text-[11px] text-[var(--color-primary)]">{item.value}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {cacheInfo && <div className="text-center text-[10px] text-yellow-500/80 pb-1">آخرین قیمت ثبت‌شده: {cacheInfo}</div>}
    </div>
  );
}
