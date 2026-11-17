#!/bin/bash
set -e

echo "🚀 1. در حال ساخت جدول market_cache در دیتابیس (از طریق API موقت)..."
cat << 'INNER_EOF' > src/app/api/fix-db/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const queries = [
    "ALTER TABLE tenants ADD COLUMN show_header_widget INTEGER DEFAULT 1;",
    "ALTER TABLE tenants ADD COLUMN show_chart INTEGER DEFAULT 1;",
    "ALTER TABLE tenants ADD COLUMN chart_type TEXT DEFAULT 'line';",
    "ALTER TABLE tenants ADD COLUMN chart_color TEXT DEFAULT '#d4af37';",
    `CREATE TABLE IF NOT EXISTS market_cache (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );`
  ];

  let results = [];

  for (const q of queries) {
    try {
      await db.execute(q);
      results.push(`✅ اجرا شد: ${q.substring(0, 50)}...`);
    } catch (e: any) {
      if (e.message.includes("duplicate column name")) {
        results.push(`⚠️ از قبل وجود دارد: ${q.substring(0, 50)}...`);
      } else {
        results.push(`❌ خطا: ${q.substring(0, 50)}... - ${e.message}`);
      }
    }
  }

  return NextResponse.json({ message: "عملیات پایان یافت", details: results });
}
INNER_EOF
echo "✅ API موقت برای ساخت جدول آپدیت شد."

echo "🚀 2. در حال آپدیت Type (market-price-context.tsx)..."
cat << 'INNER_EOF' > src/app/\(storefront\)/market-price-context.tsx
"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type MarketPrice = {
  ouncePrice: number; dollarPrice: number; eighteenKPrice: number; globalEighteenKPrice: number;
  bubblePercentage: number; euroPrice?: number; dirhamPrice?: number; liraPrice?: number; yuanPrice?: number;
  updatedAt: string; source?: string; isApproximate?: boolean; isCached?: boolean; cacheUpdatedAt?: string;
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
echo "✅ Type آپدیت شد."

echo "🚀 3. در حال آپدیت API قیمت‌ها با منطق Cache (route.ts)..."
cat << 'INNER_EOF' > src/app/api/live-prices/route.ts
export const dynamic = "force-dynamic";
import { getDbClient } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";

const parseNumber = (val: any) => {
  if (!val) return 0;
  const clean = String(val).replace(/,/g, "").trim();
  return Number(clean) || 0;
};

export async function GET(request: Request) {
  try {
    const db = await getDbClient();
    const tenantId = new URL(request.url).searchParams.get("tenant") || DEFAULT_TENANT_ID;

    const tenantResult = await db.execute({ sql: "SELECT toman_rate FROM tenants WHERE id = ?", args: [tenantId] });
    const manualDollar = tenantResult.rows[0]?.toman_rate ? Number(tenantResult.rows[0].toman_rate) : 0;

    let data: any = { ouncePrice: 0, dollarPrice: 0, eighteenKPrice: 0, euroPrice: 0, dirhamPrice: 0, liraPrice: 0, yuanPrice: 0, bubblePercentage: 0, globalEighteenKPrice: 0 };
    let source = "";
    let isCached = false;
    let cacheUpdatedAt = "";

    // 1. TGJU
    try {
      const res = await fetch("https://call2.tgju.org/ajax.json", { cache: "no-store", signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const json = await res.json();
        if (json?.current?.price_dollar_rl?.p) {
          data.dollarPrice = parseNumber(json.current.price_dollar_rl.p) / 10;
          data.eighteenKPrice = parseNumber(json.current.tgju_gold_irg18?.p) / 10;
          data.ouncePrice = parseNumber(json.current.ons?.p);
          data.euroPrice = parseNumber(json.current.price_eur?.p) / 10;
          data.dirhamPrice = parseNumber(json.current.price_aed?.p) / 10;
          data.liraPrice = parseNumber(json.current.price_try?.p) / 10;
          data.yuanPrice = parseNumber(json.current.price_cny?.p) / 10;
          source = "tgju";
        }
      }
    } catch (e) {}

    // 2. iSignal
    if (!source) {
      try {
        const res = await fetch("https://isignal.ir/gold-currency/", { cache: "no-store", signal: AbortSignal.timeout(2000), headers: { "User-Agent": "Mozilla/5.0" } });
        if (res.ok) {
          const html = await res.text();
          const dollarMatch = html.match(/دلار[\s\S]{0,100}?([0-9,]{6,})\s*ریال/);
          const gold18Match = html.match(/طلای ۱۸ عیار[\s\S]{0,100}?([0-9,]{8,})\s*ریال/);
          if (dollarMatch && gold18Match) {
            data.dollarPrice = parseNumber(dollarMatch[1]) / 10;
            data.eighteenKPrice = parseNumber(gold18Match[1]) / 10;
            source = "isignal";
          }
        }
      } catch (e) {}
    }

    // 3. PersianToolbox
    if (!source) {
      try {
        const res = await fetch("https://persiantoolbox.ir/api/market", { cache: "no-store", signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const json = await res.json();
          if (json?.ok && json?.data?.currencies?.USD?.rate) {
            data.dollarPrice = parseNumber(json.data.currencies.USD.rate) / 10;
            data.euroPrice = parseNumber(json.data.currencies.EUR?.rate) / 10;
            if (json.data.gold?.pricePerGram) {
              data.eighteenKPrice = parseNumber(json.data.gold.pricePerGram) / 10;
            }
            source = "persiantoolbox";
          }
        }
      } catch (e) {}
    }

    // 4. Global (Fallback to USD for Gold)
    if (!source) {
      try {
        const res = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store", signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const goldData = await res.json();
          data.ouncePrice = parseNumber(goldData.price);
          source = "global";
        }
      } catch (e) {}
    }

    // محاسبات
    let global18k = 0;
    if (data.ouncePrice > 0 && data.dollarPrice > 0) {
      global18k = (data.ouncePrice / 31.1034768) * (18 / 24) * data.dollarPrice;
    }
    if (data.eighteenKPrice === 0) data.eighteenKPrice = global18k;
    data.globalEighteenKPrice = global18k;
    
    if (data.eighteenKPrice > 0 && global18k > 0) {
      data.bubblePercentage = ((data.eighteenKPrice - global18k) / global18k) * 100;
    }

    // 5. ذخیره در کش اگر موفق بود
    if (source) {
      try {
        await db.execute({
          sql: `INSERT INTO market_cache (id, data, updated_at) VALUES ('latest', ?, ?) 
                ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
          args: [JSON.stringify(data), Date.now()]
        });
      } catch (e) {
        console.error("Failed to save to cache:", e);
      }
    } 
    
    // 6. خواندن از کش اگر هیچ منبعی جواب نداد
    if (!source) {
      try {
        const cacheResult = await db.execute("SELECT data, updated_at FROM market_cache WHERE id = 'latest'");
        if (cacheResult.rows.length > 0) {
          const cachedData = JSON.parse(String(cacheResult.rows[0].data));
          data = { ...cachedData };
          source = "cache";
          isCached = true;
          cacheUpdatedAt = new Date(Number(cacheResult.rows[0].updated_at)).toISOString();
        }
      } catch (e) {
        console.error("Failed to read from cache:", e);
      }
    }

    // 7. اگر کش هم نبود، برو سراغ دیتابیس دستی (تومان)
    if (!source) {
      data.dollarPrice = manualDollar;
      source = "database";
      isCached = false;
    }

    return Response.json(
      { ...data, source, isApproximate: source === "database", isCached, cacheUpdatedAt }, 
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return Response.json({ error: "خطای سرور" }, { status: 503 });
  }
}
INNER_EOF
echo "✅ API قیمت‌ها با موفقیت آپدیت شد."

echo "🚀 4. در حال آپدیت ویجت (نمایش تاریخ کش)..."
cat << 'INNER_EOF' > src/app/\(storefront\)/live-price-widget.tsx
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
INNER_EOF
echo "✅ ویجت آپدیت شد."

echo "📦 5. در حال کامیت و پوش..."
git add .
git commit -m "feat: implement smart market cache fallback with timestamp"
git push origin main

echo "🎉 تمام شد! کلودفلر در حال دیپلوی است..."
