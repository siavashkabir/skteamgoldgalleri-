"use client";

import { useEffect, useState } from "react";

type LivePrice = {
  ouncePrice: number;
  dollarPrice: number;
  eighteenKPrice: number;
};

export default function LivePriceWidget() {
  const [price, setPrice] = useState<LivePrice | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function refreshPrice() {
      try {
        const response = await fetch("/api/prices", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Live gold price request failed.");
        }
        const result: unknown = await response.json();
        if (
          isLivePrice(result) &&
          active
        ) {
          setPrice(result);
          setError(false);
        } else if (active) {
          throw new Error("Live gold price response was invalid.");
        }
      } catch {
        if (active) {
          setPrice(null);
          setError(true);
        }
      }
    }
    void refreshPrice();
    const intervalId = window.setInterval(() => void refreshPrice(), 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      aria-label="قیمت‌های لحظه‌ای"
      aria-live="polite"
      className="border-t border-white/[0.06] bg-[#11110f]/80"
      title={error ? "قیمت زنده در دسترس نیست" : "به‌روزرسانی خودکار هر ۵ دقیقه"}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-3 gap-2 px-4 py-2 sm:gap-4 sm:px-8">
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
      </div>
    </div>
  );
}

function PriceValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#d6ad56]/15 bg-[#d6ad56]/[0.04] px-2 py-1.5 text-center sm:px-3">
      <span className="block truncate text-[10px] text-[#aaa79b]">{label}</span>
      <strong className="mt-0.5 block truncate text-[11px] font-semibold text-[#e2c16d] sm:text-xs">
        {value}
      </strong>
    </div>
  );
}

function statusText(error: boolean) {
  return error ? "در دسترس نیست" : "در حال دریافت...";
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("fa-IR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function isLivePrice(value: unknown): value is LivePrice {
  return (
    typeof value === "object" &&
    value !== null &&
    "ouncePrice" in value &&
    "dollarPrice" in value &&
    "eighteenKPrice" in value &&
    Number.isFinite(value.ouncePrice) &&
    Number.isFinite(value.dollarPrice) &&
    Number.isFinite(value.eighteenKPrice)
  );
}
