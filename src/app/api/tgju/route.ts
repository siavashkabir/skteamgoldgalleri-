export const dynamic = "force-dynamic";

import { getDbClient } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";

export async function GET(request: Request) {
  try {
    const db = await getDbClient();
    const tenantId = new URL(request.url).searchParams.get("tenant") || DEFAULT_TENANT_ID;
    
    // نرخ پشتیبان در صورتی که همه سایت‌ها خراب باشند (فقط برای محاسبه ریاضی انس)
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

    let success = false;

    // ==========================================
    // لایه 1: تلاش برای گرفتن از سایت iSignal (دقیق‌ترین برای بازار ایران)
    // ==========================================
    try {
      const isignalRes = await fetch("https://isignal.ir/gold-currency/", {
        cache: "no-store",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
      });
      if (isignalRes.ok) {
        const html = await isignalRes.text();
        // جستجوی قیمت دلار و طلا در کدهای سایت آی‌سیگنال
        const dollarMatch = html.match(/دلار[\s\S]{0,100}?([0-9,]{6,})\s*ریال/);
        const gold18Match = html.match(/طلای ۱۸ عیار[\s\S]{0,100}?([0-9,]{8,})\s*ریال/);
        
        if (dollarMatch && gold18Match) {
          data.dollarPrice = Number(dollarMatch[1].replace(/,/g, "")) / 10; // ریال به تومان
          data.eighteenKPrice = Number(gold18Match[1].replace(/,/g, "")) / 10;
          success = true;
        }
      }
    } catch (e) {
      console.log("iSignal failed.");
    }

    // ==========================================
    // لایه 2: اگر iSignal جواب نداد، از TGJU استفاده کن (تلاش دوم)
    // ==========================================
    if (!success) {
      try {
        const tgjuRes = await fetch("https://call2.tgju.org/ajax.json", {
          cache: "no-store", 
          signal: AbortSignal.timeout(4000), 
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (tgjuRes.ok) {
          const json = await tgjuRes.json();
          if (json && json.current) {
            data.dollarPrice = Number(json.current.price_dollar_rl?.p) / 10;
            data.eighteenKPrice = Number(json.current.tgju_gold_irg18?.p) / 10;
            data.ouncePrice = Number(json.current.ons?.p) || 0;
            data.euroPrice = Number(json.current.price_eur?.p) / 10 || 0;
            data.dirhamPrice = Number(json.current.price_aed?.p) / 10 || 0;
            data.liraPrice = Number(json.current.price_try?.p) / 10 || 0;
            if (data.dollarPrice > 0 && data.eighteenKPrice > 0) success = true;
          }
        }
      } catch (e) {
        console.log("TGJU failed.");
      }
    }

    // ==========================================
    // لایه 3: گرفتن انس جهانی از API (اگر هنوز نداریم)
    // ==========================================
    if (data.ouncePrice === 0) {
      try {
        const goldRes = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
        if (goldRes.ok) {
          const goldData = await goldRes.json();
          data.ouncePrice = Number(goldData.price) || 0;
        }
      } catch (e) {}
    }

    // ==========================================
    // لایه 4: اگر سایت‌های ایرانی بلاک بودن، قیمت دلار رو از دیتابیس بگیر
    // ==========================================
    if (data.dollarPrice === 0) {
      data.dollarPrice = fallbackDollar;
    }

    // محاسبه قیمت جهانی و حباب
    const global18k = data.ouncePrice > 0 && data.dollarPrice > 0 
      ? (data.ouncePrice / 31.1034768) * (18 / 24) * data.dollarPrice 
      : 0;
    
    data.globalEighteenKPrice = global18k;

    if (data.eighteenKPrice === 0 && global18k > 0) {
      data.eighteenKPrice = global18k;
    }
    
    if (data.eighteenKPrice > 0 && global18k > 0) {
      data.bubblePercentage = ((data.eighteenKPrice - global18k) / global18k) * 100;
    }

    // اگر هیچ‌کدوم از ارزها نیومد، ارزهای دیگه رو با دلار حساب میکنیم
    if (data.euroPrice === 0 && data.dollarPrice > 0) data.euroPrice = data.dollarPrice / 1.08;
    if (data.dirhamPrice === 0 && data.dollarPrice > 0) data.dirhamPrice = data.dollarPrice / 3.67;
    if (data.liraPrice === 0 && data.dollarPrice > 0) data.liraPrice = data.dollarPrice / 50;
    if (data.yuanPrice === 0 && data.dollarPrice > 0) data.yuanPrice = data.dollarPrice / 7.2;

    if (data.dollarPrice === 0 && data.eighteenKPrice === 0) {
      return Response.json({ error: "در حال حاضر امکان دریافت قیمت وجود ندارد." }, { status: 503 });
    }

    return Response.json(data, { headers: { "Cache-Control": "no-store" } });

  } catch (error) {
    return Response.json({ error: "خطای سرور." }, { status: 503 });
  }
}
