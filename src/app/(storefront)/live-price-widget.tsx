"use client";

import { useEffect, useState } from "react";

type LivePrice = {
  eighteenKPrice: number;
};

export default function LivePriceWidget({ tenantId }: { tenantId: string }) {
  const [price, setPrice] = useState<LivePrice | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function refreshPrice() {
      try {
        const response = await fetch(
          `/api/live-prices?tenant=${encodeURIComponent(tenantId)}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          throw new Error("Live gold price request failed.");
        }
        const result = (await response.json()) as LivePrice;
        if (active && Number.isFinite(result.eighteenKPrice)) {
          setPrice(result);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    }
    void refreshPrice();
    const intervalId = window.setInterval(() => void refreshPrice(), 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [tenantId]);

  return (
    <span
      aria-live="polite"
      className="hidden max-w-48 rounded-xl border border-[#d6ad56]/20 bg-[#d6ad56]/[0.05] px-3 py-2 text-center text-[10px] leading-5 text-[#c5c1b6] lg:block"
      title={error ? "قیمت زنده در دسترس نیست" : "قیمت لحظه‌ای هر گرم طلای ۱۸ عیار"}
    >
      هر گرم طلای ۱۸ عیار{" "}
      <strong className="block text-xs text-[#e2c16d]">
        {price
          ? `${Math.round(price.eighteenKPrice).toLocaleString("fa-IR")} تومان`
          : error
            ? "در دسترس نیست"
            : "در حال دریافت..."}
      </strong>
    </span>
  );
}
