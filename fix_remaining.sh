#!/bin/bash
set -e

echo "🚀 1. در حال آپدیت Context..."
cat << 'INNER_EOF' > src/app/\(storefront\)/market-price-context.tsx
"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type MarketPrice = {
  ouncePrice: number; dollarPrice: number; eighteenKPrice: number; globalEighteenKPrice: number;
  bubblePercentage: number; euroPrice?: number; dirhamPrice?: number; liraPrice?: number; yuanPrice?: number;
  updatedAt: string; source?: string; isApproximate?: boolean;
};
type MarketPriceState = { price: MarketPrice | null; error: string | null; };
const MarketPriceContext = createContext<MarketPriceState>({ price: null, error: null });

export function MarketPriceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MarketPriceState>({ price: null, error: null });

  useEffect(() => {
    let active = true;
    async function refreshPrice() {
      try {
        const response = await fetch("/api/live-prices", { cache: "no-store" });
        const result: unknown = await response.json();
        if (!response.ok) throw new Error((result as any).error || "قیمت در دسترس نیست.");
        if (active) setState({ price: { ...(result as any), updatedAt: new Date().toISOString() }, error: null });
      } catch (err) {
        if (active) setState({ price: null, error: err instanceof Error ? err.message : "خطا" });
      }
    }
    void refreshPrice();
    const intervalId = window.setInterval(() => void refreshPrice(), 5 * 60 * 1000);
    return () => { active = false; window.clearInterval(intervalId); };
  }, []);

  return <MarketPriceContext.Provider value={state}>{children}</MarketPriceContext.Provider>;
}
export function useMarketPrice() { return useContext(MarketPriceContext); }
INNER_EOF
echo "✅ Context آپدیت شد."

echo "🚀 2. در حال آپدیت Widget..."
cat << 'INNER_EOF' > src/app/\(storefront\)/live-price-widget.tsx
"use client";
import { useMarketPrice } from "./market-price-context";
import { resolveBusinessKind } from "@/lib/tenant-features";

export default function LivePriceWidget({ businessType, showWidget }: { businessType?: string | null, showWidget?: boolean }) {
  const { price, error } = useMarketPrice();
  if (!showWidget) return null;

  const kind = resolveBusinessKind(businessType, ["gold_features"]);
  const formatNum = (num: number | undefined) => num ? `${Math.round(num).toLocaleString("fa-IR")} تومان` : statusText(error);
  const formatUSD = (num: number | undefined) => num ? `$${Math.round(num).toLocaleString("en-US")}` : statusText(error);
  const statusText = (err: string | null) => err ?? "در حال دریافت...";

  let items: { label: string; value: string }[] = [];

  if (price?.source === "global") {
    items = [
      { label: "انس جهانی", value: formatUSD(price.ouncePrice) },
      { label: "دلار (نامشخص)", value: "نامشخص" },
      { label: "طلای ۱۸ عیار", value: "نامشخص" },
      { label: "حباب بازار", value: "-" },
    ];
  } else if (kind === "gold") {
    items = [
      { label: "انس جهانی", value: formatUSD(price?.ouncePrice) },
      { label: "دلار", value: formatNum(price?.dollarPrice) },
      { label: "طلای ۱۸ عیار", value: formatNum(price?.eighteenKPrice) },
      { label: "حباب بازار", value: price ? `${price.bubblePercentage > 0 ? "+" : ""}${price.bubblePercentage.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪` : statusText(error) },
    ];
  } else {
    items = [
      { label: "دلار", value: formatNum(price?.dollarPrice) },
      { label: "یورو", value: formatNum(price?.euroPrice) },
      { label: "درهم", value: formatNum(price?.dirhamPrice) },
      { label: "لیر", value: formatNum(price?.liraPrice) },
    ];
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
    </div>
  );
}
INNER_EOF
echo "✅ Widget آپدیت شد."

echo "🚀 3. در حال آپدیت نمودار..."
cat << 'INNER_EOF' > src/app/\(storefront\)/price-trends.tsx
"use client";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMarketPrice } from "./market-price-context";

type Range = "daily" | "weekly" | "monthly";
const ranges: { id: Range; label: string; points: number }[] = [
  { id: "daily", label: "روزانه", points: 24 },
  { id: "weekly", label: "هفتگی", points: 7 },
  { id: "monthly", label: "ماهانه", points: 30 },
];

export default function PriceTrends({ showChart, chartType, chartColor }: { showChart?: boolean, chartType?: string, chartColor?: string }) {
  const [range, setRange] = useState<Range>("weekly");
  const { price, error } = useMarketPrice();
  const currentPrice = price?.eighteenKPrice ?? null;
  if (!showChart) return null;

  const data = useMemo(() => {
    if (currentPrice === null) return [];
    const selected = ranges.find((item) => item.id === range) ?? ranges[1];
    return Array.from({ length: selected.points }, (_, index) => {
      const progress = (index + 1) / selected.points;
      const wave = Math.sin(index * 1.37) * 0.006 + Math.cos(index * 0.51) * 0.003 + (progress - 0.5) * 0.008;
      const date = new Date();
      date.setDate(date.getDate() - (selected.points - index - 1));
      const label = range === "daily" ? `${String(index).padStart(2, "0")}:00` : new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(date);
      return { label, price: Math.max(0, Math.round(currentPrice * (1 + wave))) };
    });
  }, [currentPrice, range]);

  const color = chartColor || "var(--color-primary)";

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[var(--color-surface)] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium" style={{ color }}>روند بازار</p>
          <h2 className="mt-2 text-xl font-semibold">تغییرات قیمت طلای ۱۸ عیار</h2>
          <p className="mt-1 text-xs text-[#858378]">نمودار نمونه؛ قیمت لحظه‌ای دریافت می‌شود.</p>
        </div>
        <div aria-label="بازه نمودار" className="flex rounded-xl border border-white/[0.08] p-1" role="group">
          {ranges.map((item) => (
            <button aria-pressed={range === item.id} className={`rounded-lg px-3 py-2 text-xs transition ${range === item.id ? "font-semibold" : "hover:opacity-80"}`} style={range === item.id ? { backgroundColor: color, color: "#000" } : { color: "#aaa79b" }} key={item.id} onClick={() => setRange(item.id)} type="button">{item.label}</button>
          ))}
        </div>
      </div>
      {currentPrice === null ? (
        <p aria-live="polite" className={`mt-8 text-sm ${error ? "text-red-300" : "text-[#969387]"}`}>{error || "در حال دریافت قیمت..."}</p>
      ) : (
      <div className="mt-6 h-64 min-w-0" dir="ltr">
        <ResponsiveContainer height="100%" width="100%">
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 5" />
              <XAxis axisLine={false} dataKey="label" tick={{ fill: "#858378", fontSize: 10 }} tickLine={false} minTickGap={20} />
              <YAxis axisLine={false} domain={["dataMin - 10000", "dataMax + 10000"]} orientation="right" tick={{ fill: "#858378", fontSize: 10 }} tickFormatter={(v: number) => v.toLocaleString("fa-IR")} tickLine={false} width={65} />
              <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "var(--color-text)" }} formatter={(v) => [`${Number(v).toLocaleString("fa-IR")} تومان`, "قیمت"]} />
              <Bar dataKey="price" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 5" />
              <XAxis axisLine={false} dataKey="label" tick={{ fill: "#858378", fontSize: 10 }} tickLine={false} minTickGap={20} />
              <YAxis axisLine={false} domain={["dataMin - 10000", "dataMax + 10000"]} orientation="right" tick={{ fill: "#858378", fontSize: 10 }} tickFormatter={(v: number) => v.toLocaleString("fa-IR")} tickLine={false} width={65} />
              <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "var(--color-text)" }} formatter={(v) => [`${Number(v).toLocaleString("fa-IR")} تومان`, "قیمت"]} />
              <Line activeDot={{ r: 5, fill: color, stroke: "var(--color-surface)", strokeWidth: 2 }} dataKey="price" dot={false} isAnimationActive stroke={color} strokeWidth={2.5} type="monotone" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      )}
    </section>
  );
}
INNER_EOF
echo "✅ نمودار آپدیت شد."

echo "📦 4. در حال کامیت و پوش..."
git add .
git commit -m "feat: dynamic pricing widget, chart settings, and global price fallback"
git push origin main

echo "🎉 تمام شد! کلودفلر در حال دیپلوی است..."
