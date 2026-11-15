export const dynamic = "force-dynamic";

import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";
import { getDbClient } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const db = await getDbClient();
    const tenantId = new URL(request.url).searchParams.get("tenant") || DEFAULT_TENANT_ID;
    const tenantResult = await db.execute({
      sql: "SELECT toman_rate FROM tenants WHERE id = ?",
      args: [tenantId],
    });
    
    const tomanRate = tenantResult.rows[0]?.toman_rate ? Number(tenantResult.rows[0].toman_rate) : null;

    let finalData = {
      ouncePrice: 0,
      dollarPrice: tomanRate || 0,
      eighteenKPrice: 0,
      euroPrice: 0,
      dirhamPrice: 0,
      liraPrice: 0,
      bubblePercentage: 0
    };

    // 1. تلاش برای گرفتن قیمت‌ها از TGJU
    let tgjuSuccess = false;
    try {
      const tgjuRes = await fetch("https://www.tgju.org/", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5000) // حداکثر ۵ ثانیه صبر می‌کنه
      });

      if (tgjuRes.ok) {
        const html = await tgjuRes.text();
        const extractPrice = (marketRow: string) => {
          const regex = new RegExp(`data-market-row="${marketRow}"[^>]*>.*?<span[^>]*>(.*?)</span>`, "s");
          const match = html.match(regex);
          if (match && match[1]) {
            return Number(match[1].replace(/,/g, "").replace(/<[^>]+>/g, "").trim());
          }
          return null;
        };

        const dollarRaw = extractPrice("price_dollar_rl");
        const eighteenKRaw = extractPrice("geram18");
        const ounceRaw = extractPrice("ons");
        const euroRaw = extractPrice("price_eur");
        const dirhamRaw = extractPrice("price_aed");
        const liraRaw = extractPrice("price_try");

        // اگر تونستیم قیمت دلار رو از tgju بگیریم یعنی موفق بوده
        if (dollarRaw) {
          finalData.dollarPrice = dollarRaw / 10;
          finalData.eighteenKPrice = eighteenKRaw ? eighteenKRaw / 10 : 0;
          finalData.ouncePrice = ounceRaw || 0;
          finalData.euroPrice = euroRaw ? euroRaw / 10 : 0;
          finalData.dirhamPrice = dirhamRaw ? dirhamRaw / 10 : 0;
          finalData.liraPrice = liraRaw ? liraRaw / 10 : 0;
          tgjuSuccess = true;
        }
      }
    } catch (e) {
      console.error("TGJU scraping failed, falling back to math calculation.");
    }

    // 2. اگر TGJU بلاک کرد یا جواب نداد، از روش قبلی (محاسبه ریاضی) استفاده کن
    if (!tgjuSuccess && tomanRate) {
      const goldResponse = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
      if (goldResponse.ok) {
        const goldPayload = await goldResponse.json();
        const ouncePrice = Number(goldPayload.price);
        if (Number.isFinite(ouncePrice) && ouncePrice > 0) {
          finalData.ouncePrice = ouncePrice;
          finalData.eighteenKPrice = (ouncePrice / 31.1034768) * (18 / 24) * tomanRate;
          finalData.dollarPrice = tomanRate;
        }
      }
    }

    if (finalData.dollarPrice === 0) {
      return Response.json({ error: "قیمت لحظه‌ای در دسترس نیست." }, { status: 503 });
    }

    return Response.json(finalData, { headers: { "Cache-Control": "no-store" } });

  } catch (error) {
    return Response.json({ error: "خطای سرور در دریافت قیمت." }, { status: 503 });
  }
}
