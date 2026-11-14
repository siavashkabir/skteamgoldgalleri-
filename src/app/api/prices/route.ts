type JsonRecord = Record<string, unknown>;

export async function GET() {
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
      throw new Error("A live price provider returned an unsuccessful response.");
    }

    const [goldPayload, exchangePayload]: [unknown, unknown] =
      await Promise.all([goldResponse.json(), exchangeResponse.json()]);
    const gold = asRecord(goldPayload);
    const exchange = asRecord(exchangePayload);
    const rates = asRecord(exchange?.rates);
    const ouncePrice = Number(gold?.price);
    const rialRate = Number(rates?.IRR);
    const dollarPrice = rialRate / 10;

    if (
      !Number.isFinite(ouncePrice) ||
      ouncePrice <= 0 ||
      !Number.isFinite(dollarPrice) ||
      dollarPrice <= 0
    ) {
      throw new Error("A live price provider returned invalid price data.");
    }

    const wage = 0;
    const eighteenKPrice =
      (ouncePrice / 31.1034768) * (18 / 24) * dollarPrice + wage;
    return Response.json(
      { ouncePrice, dollarPrice, eighteenKPrice, wage },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not retrieve live gold prices.", error);
    return Response.json(
      { error: "قیمت لحظه‌ای در دسترس نیست؛ لطفاً کمی بعد تلاش کنید." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null
    ? (value as JsonRecord)
    : null;
}
