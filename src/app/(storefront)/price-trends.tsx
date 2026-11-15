"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMarketPrice } from "./market-price-context";

type Range = "daily" | "weekly" | "monthly";

const ranges: { id: Range; label: string; points: number }[] = [
  { id: "daily", label: "روزانه", points: 24 },
  { id: "weekly", label: "هفتگی", points: 7 },
  { id: "monthly", label: "ماهانه", points: 30 },
];

export default function PriceTrends() {
  const [range, setRange] = useState<Range>("weekly");
  const { price, error } = useMarketPrice();
  const currentPrice = price?.eighteenKPrice ?? null;

  const data = useMemo(() => {
    if (currentPrice === null) return [];
    const selected = ranges.find((item) => item.id === range) ?? ranges[1];
    return Array.from({ length: selected.points }, (_, index) => {
      const progress = (index + 1) / selected.points;
      const wave =
        Math.sin(index * 1.37) * 0.006 +
        Math.cos(index * 0.51) * 0.003 +
        (progress - 0.5) * 0.008;
      const date = new Date();
      date.setDate(date.getDate() - (selected.points - index - 1));
      const label =
        range === "daily"
          ? `${String(index).padStart(2, "0")}:00`
          : new Intl.DateTimeFormat("fa-IR", {
              month: "short",
              day: "numeric",
            }).format(date);
      return {
        label,
        price: Math.max(0, Math.round(currentPrice * (1 + wave))),
      };
    });
  }, [currentPrice, range]);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#171716] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#d6ad56]">روند بازار</p>
          <h2 className="mt-2 text-xl font-semibold">تغییرات قیمت طلای ۱۸ عیار</h2>
          <p className="mt-1 text-xs text-[#858378]">
            نمودار نمونه؛ قیمت لحظه‌ای از TGJU دریافت می‌شود.
          </p>
        </div>
        <div aria-label="بازه نمودار" className="flex rounded-xl border border-white/[0.08] p-1" role="group">
          {ranges.map((item) => (
            <button
              aria-pressed={range === item.id}
              className={`rounded-lg px-3 py-2 text-xs transition ${
                range === item.id
                  ? "bg-[#d6ad56] font-semibold text-[#211a0d]"
                  : "text-[#aaa79b] hover:text-[#e2c16d]"
              }`}
              key={item.id}
              onClick={() => setRange(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {currentPrice === null ? (
        <p aria-live="polite" className={`mt-8 text-sm ${error ? "text-red-300" : "text-[#969387]"}`}>
          {error || "در حال دریافت قیمت لحظه‌ای..."}
        </p>
      ) : (
      <div className="mt-6 h-64 min-w-0" dir="ltr">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 5" />
            <XAxis axisLine={false} dataKey="label" tick={{ fill: "#858378", fontSize: 10 }} tickLine={false} minTickGap={20} />
            <YAxis
              axisLine={false}
              domain={["dataMin - 10000", "dataMax + 10000"]}
              orientation="right"
              tick={{ fill: "#858378", fontSize: 10 }}
              tickFormatter={(value: number) => value.toLocaleString("fa-IR")}
              tickLine={false}
              width={65}
            />
            <Tooltip
              contentStyle={{
                background: "#171716",
                border: "1px solid rgba(214,173,86,0.25)",
                borderRadius: 12,
                color: "#f5f2e9",
              }}
              formatter={(value) => [`${Number(value).toLocaleString("fa-IR")} تومان`, "قیمت"]}
              labelStyle={{ color: "#e2c16d" }}
            />
            <Line
              activeDot={{ r: 5, fill: "#e2c16d", stroke: "#171716", strokeWidth: 2 }}
              dataKey="price"
              dot={false}
              isAnimationActive
              stroke="#d6ad56"
              strokeWidth={2.5}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
    </section>
  );
}
