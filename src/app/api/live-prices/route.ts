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
