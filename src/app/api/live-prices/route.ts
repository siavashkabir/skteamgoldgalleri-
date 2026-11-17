export const dynamic = "force-dynamic";
import { getDbClient } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";

export async function GET(request: Request) {
  try {
    const db = await getDbClient();
    const tenantId = new URL(request.url).searchParams.get("tenant") || DEFAULT_TENANT_ID;

    const tenantResult = await db.execute({ sql: "SELECT toman_rate FROM tenants WHERE id = ?", args: [tenantId] });
    const manualDollar = tenantResult.rows[0]?.toman_rate ? Number(tenantResult.rows[0].toman_rate) : 0;

    let data: any = { ouncePrice: 0, dollarPrice: 0, eighteenKPrice: 0, euroPrice: 0, dirhamPrice: 0, liraPrice: 0, yuanPrice: 0, bubblePercentage: 0, globalEighteenKPrice: 0 };
    let source = "";

    // 1. TGJU
    try {
      const res = await fetch("https://call2.tgju.org/ajax.json", { cache: "no-store", signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const json = await res.json();
        if (json?.current?.price_dollar_rl?.p) {
          data.dollarPrice = Number(json.current.price_dollar_rl.p) / 10;
          data.eighteenKPrice = Number(json.current.tgju_gold_irg18?.p) / 10 || 0;
          data.ouncePrice = Number(json.current.ons?.p) || 0;
          data.euroPrice = Number(json.current.price_eur?.p) / 10 || 0;
          data.dirhamPrice = Number(json.current.price_aed?.p) / 10 || 0;
          data.liraPrice = Number(json.current.price_try?.p) / 10 || 0;
          data.yuanPrice = Number(json.current.price_cny?.p) / 10 || 0;
          source = "tgju";
        }
      }
    } catch (e) {}

    // 2. iSignal
    if (!source) {
      try {
        const res = await fetch("https://isignal.ir/gold-currency/", { cache: "no-store", signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const html = await res.text();
          const dollarMatch = html.match(/دلار[\s\S]{0,100}?([0-9,]{6,})\s*ریال/);
          const gold18Match = html.match(/طلای ۱۸ عیار[\s\S]{0,100}?([0-9,]{8,})\s*ریال/);
          if (dollarMatch && gold18Match) {
            data.dollarPrice = Number(dollarMatch[1].replace(/,/g, "")) / 10;
            data.eighteenKPrice = Number(gold18Match[1].replace(/,/g, "")) / 10;
            source = "isignal";
          }
        }
      } catch (e) {}
    }

    // 3. Global (Fallback to USD)
    if (!source) {
      try {
        const res = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store", signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const goldData = await res.json();
          data.ouncePrice = Number(goldData.price) || 0;
          data.dollarPrice = 0; // نشان می‌دهیم که نرخ دلار تومانی نداریم
          source = "global";
        }
      } catch (e) {}
    }

    // 4. Database
    if (!source) {
      data.dollarPrice = manualDollar;
      source = "database";
    }

    // محاسبات
    let global18k = 0;
    if ((source === "tgju" || source === "isignal") && data.ouncePrice > 0 && data.dollarPrice > 0) {
      global18k = (data.ouncePrice / 31.1034768) * (18 / 24) * data.dollarPrice;
    }
    if (data.eighteenKPrice === 0) data.eighteenKPrice = global18k;
    data.globalEighteenKPrice = global18k;
    if (data.eighteenKPrice > 0 && global18k > 0) data.bubblePercentage = ((data.eighteenKPrice - global18k) / global18k) * 100;

    return Response.json({ ...data, source, isApproximate: source === "database" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: "خطای سرور" }, { status: 503 });
  }
}
