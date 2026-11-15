"use client";

import { useMemo, useState } from "react";
import { useMarketPrice } from "./market-price-context";

export default function PriceCalculator() {
  const [weight, setWeight] = useState("1");
  const [labor, setLabor] = useState("0");
  const { price, error } = useMarketPrice();
  const goldPrice = price?.eighteenKPrice ?? null;

  const total = useMemo(() => {
    const grams = Number(weight);
    const laborPercentage = Number(labor);
    if (
      goldPrice === null ||
      !Number.isFinite(grams) ||
      grams <= 0 ||
      !Number.isFinite(laborPercentage) ||
      laborPercentage < 0
    ) {
      return null;
    }
    const estimate = goldPrice * grams * (1 + laborPercentage / 100);
    return Number.isFinite(estimate) ? estimate : null;
  }, [goldPrice, labor, weight]);

  return (
    <section className="rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-surface)] p-5 sm:p-7">
      <p className="text-xs font-medium text-[var(--color-primary)]">برآورد سریع</p>
      <h2 className="mt-2 text-xl font-semibold">ماشین‌حساب قیمت طلا</h2>
      <p className="mt-1 text-xs leading-6 text-[#858378]">
        برآورد بر اساس نرخ لحظه‌ای هر گرم طلای ۱۸ عیار و اجرت واردشده.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-[#c5c1b6]">
          وزن (گرم)
          <input
            className={inputClass}
            inputMode="decimal"
            min="0.01"
            onChange={(event) => setWeight(event.target.value)}
            step="any"
            type="number"
            value={weight}
          />
        </label>
        <label className="block text-sm text-[#c5c1b6]">
          اجرت (درصد)
          <input
            className={inputClass}
            inputMode="decimal"
            min="0"
            onChange={(event) => setLabor(event.target.value)}
            step="any"
            type="number"
            value={labor}
          />
        </label>
      </div>
      <div aria-live="polite" className="mt-5 rounded-xl border border-white/[0.07] bg-[var(--color-bg)] p-4">
        {total === null ? (
          <p className={`text-sm ${error ? "text-red-300" : "text-[#969387]"}`}>
            {error || "در حال دریافت قیمت لحظه‌ای..."}
          </p>
        ) : (
          <>
            <p className="text-xs text-[#969387]">مبلغ تقریبی</p>
            <p className="mt-1 text-xl font-semibold text-[var(--color-primary)]">
              {Math.round(total).toLocaleString("fa-IR")} تومان
            </p>
          </>
        )}
      </div>
    </section>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-white/[0.09] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]/60";
