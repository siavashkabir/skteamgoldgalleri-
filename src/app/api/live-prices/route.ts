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
    if (!tenantResult.rows[0]) {
      return Response.json({ error: "فروشگاه پیدا نشد." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    const tomanRate = tenantResult.rows[0].toman_rate === null ? null : Number(tenantResult.rows[0].toman_rate);
    if (tomanRate === null || !Number.isFinite(tomanRate) || tomanRate <= 0) {
      return Response.json({ error: "برای نمایش قیمت، نرخ دلار را در تنظیمات فروشگاه وارد کنید." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const goldResponse = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
    if (!goldResponse.ok) throw new Error("Gold API failed");

    const goldPayload: unknown = await goldResponse.json();
    const ouncePrice = goldPayload && typeof goldPayload === "object" && "price" in goldPayload ? Number(goldPayload.price) : NaN;

    if (!Number.isFinite(ouncePrice) || ouncePrice <= 0) throw new Error("Invalid gold price");

    const wage = 0;
    const eighteenKPrice = (ouncePrice / 31.1034768) * (18 / 24) * tomanRate + wage;

    return Response.json(
      { ouncePrice, tomanRate, dollarPrice: tomanRate, eighteenKPrice, wage, euroPrice: 0, dirhamPrice: 0, liraPrice: 0, bubblePercentage: 0 },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return Response.json({ error: "قیمت لحظه‌ای فعلاً در دسترس نیست." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
