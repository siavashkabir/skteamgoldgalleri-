export const dynamic = "force-dynamic";

import { getDbClient } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";

export async function GET(request: Request) {
  try {
    const db = await getDbClient();
    const tenantId = new URL(request.url).searchParams.get("tenant") || DEFAULT_TENANT_ID;
    
    const tenantResult = await db.execute({
      sql: "SELECT toman_rate FROM tenants WHERE id = ?",
      args: [tenantId],
    });
    const fallbackDollar = tenantResult.rows[0]?.toman_rate ? Number(tenantResult.rows[0].toman_rate) : 0;

    let data = {
      ouncePrice: 0, dollarPrice: fallbackDollar, eighteenKPrice: 0,
      euroPrice: 0, dirhamPrice: 0, liraPrice: 0, yuanPrice: 0,
      bubblePercentage: 0, globalEighteenKPrice: 0
    };

    let tgjuSuccess = false;

    // 1. تلاش برای دریافت از TGJU (دیتای واقعی و دقیق)
    try {
      const tgjuRes = await fetch("https://call2.tgju.org/ajax.json", {
        cache: "no-store", 
        signal: AbortSignal.timeout(5000), 
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });

      if (tgjuRes.ok) {
        const json = await tgjuRes.json();
        if (json && json.current) {
          // دقت کن که قیمت‌های TGJU ریالی هستن، تقسیم بر 10 میشن تومان
          data.dollarPrice = Number(json.current.price_dollar_rl?.p) / 10 || fallbackDollar;
          data.eighteenKPrice = Number(json.current.tgju_gold_irg18?.p) / 10 || 0;
          data.ouncePrice = Number(json.current.ons?.p) || 0;
          data.euroPrice = Number(json.current.price_eur?.p) / 10 || 0;
          data.dirhamPrice = Number(json.current.price_aed?.p) / 10 || 0;
          data.liraPrice = Number(json.current.price_try?.p) / 10 || 0;
          data.yuanPrice = Number(json.current.price_cny?.p) / 10 || 0;
          tgjuSuccess = true;
        }
      }
    } catch (e) {
      console.error("TGJU failed, falling back to Exchange Rate API.");
    }

    // 2. اگر TGJU بلاک کرد یا خطا داد، از نرخ‌های جهانی محاسبه میکنیم
    if (!tgjuSuccess || data.dollarPrice === 0) {
      try {
        const fxRes = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
        if (fxRes.ok) {
          const fxData = await fxRes.json();
          if (fxData.rates && data.dollarPrice > 0) {
            data.euroPrice = data.dollarPrice / (fxData.rates.EUR || 1);
            data.dirhamPrice = data.dollarPrice / (fxData.rates.AED || 1);
            data.liraPrice = data.dollarPrice / (fxData.rates.TRY || 1);
            data.yuanPrice = data.dollarPrice / (fxData.rates.CNY || 1);
          }
        }
      } catch (e) {
        console.error("Exchange rate API failed.");
      }
    }

    // 3. گرفتن انس اگر صفر بود (از API جهانی)
    if (data.ouncePrice === 0) {
      try {
        const goldRes = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
        if (goldRes.ok) {
          const goldData = await goldRes.json();
          data.ouncePrice = Number(goldData.price) || 0;
        }
      } catch (e) {}
    }

    // محاسبه قیمت جهانیِ طلا به تومان (برای محاسبه حباب)
    const global18k = data.ouncePrice > 0 && data.dollarPrice > 0 
      ? (data.ouncePrice / 31.1034768) * (18 / 24) * data.dollarPrice 
      : 0;
    
    data.globalEighteenKPrice = global18k;

    if (data.eighteenKPrice === 0) {
      data.eighteenKPrice = global18k;
    }
    
    // محاسبه درصد حباب
    if (data.eighteenKPrice > 0 && global18k > 0) {
      data.bubblePercentage = ((data.eighteenKPrice - global18k) / global18k) * 100;
    }

    if (data.dollarPrice === 0) {
      return Response.json({ error: "نرخ دلار در دسترس نیست." }, { status: 503 });
    }

    return Response.json(data, { headers: { "Cache-Control": "no-store" } });

  } catch (error) {
    return Response.json({ error: "خطای سرور در دریافت قیمت." }, { status: 503 });
  }
}
