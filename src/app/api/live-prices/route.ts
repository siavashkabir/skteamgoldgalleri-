import { DEFAULT_TENANT_ID } from "@/lib/storefront-types";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const tenantId =
    new URL(request.url).searchParams.get("tenant") || DEFAULT_TENANT_ID;
  const tenantResult = await db.execute({
    sql: "SELECT toman_rate FROM tenants WHERE id = ?",
    args: [tenantId],
  });
  if (!tenantResult.rows[0]) {
    return Response.json({ error: "فروشگاه پیدا نشد." }, { status: 404 });
  }

  try {
    const [goldResponse, exchangeResponse] = await Promise.all([
      fetch("https://api.gold-api.com/price/XAU", {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }),
      fetch("https://open.er-api.com/v6/latest/USD", {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }),
    ]);
    if (!goldResponse.ok || !exchangeResponse.ok) {
      throw new Error("منبع قیمت جهانی پاسخ معتبر نداد.");
    }

    const [goldPayload, exchangePayload]: [unknown, unknown] =
      await Promise.all([goldResponse.json(), exchangeResponse.json()]);
    const ouncePrice =
      goldPayload && typeof goldPayload === "object" && "price" in goldPayload
        ? Number(goldPayload.price)
        : NaN;
    const rialRate =
      exchangePayload &&
      typeof exchangePayload === "object" &&
      "rates" in exchangePayload &&
      exchangePayload.rates &&
      typeof exchangePayload.rates === "object" &&
      "IRR" in exchangePayload.rates
        ? Number(exchangePayload.rates.IRR)
        : NaN;
    const tomanRate =
      tenantResult.rows[0].toman_rate === null
        ? rialRate / 10
        : Number(tenantResult.rows[0].toman_rate);

    if (
      !Number.isFinite(ouncePrice) ||
      ouncePrice <= 0 ||
      !Number.isFinite(tomanRate) ||
      tomanRate <= 0
    ) {
      throw new Error("داده قیمت طلا یا نرخ ارز معتبر نیست.");
    }

    const wage = 0;
    const eighteenKPrice =
      (ouncePrice / 31.1034768) * (18 / 24) * tomanRate + wage;
    return Response.json(
      { ouncePrice, tomanRate, eighteenKPrice, wage },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not retrieve live gold prices.", error);
    return Response.json(
      { error: "قیمت لحظه‌ای در دسترس نیست؛ لطفاً کمی بعد تلاش کنید." },
      { status: 503 },
    );
  }
}
