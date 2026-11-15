export const dynamic = "force-dynamic";

const rialToToman = 10;
const gramsPerTroyOunce = 31.1034768;

export async function GET() {
  try {
    const [localGoldRial, dollarRial, ouncePrice] = await Promise.all([
      fetchTgjuPrice("https://www.tgju.org/profile/geram18"),
      fetchTgjuPrice("https://www.tgju.org/profile/price_dollar_rl"),
      fetchOuncePrice(),
    ]);

    const globalGoldRial =
      (ouncePrice * dollarRial * (18 / 24)) / gramsPerTroyOunce;
    const bubblePercentage =
      ((localGoldRial - globalGoldRial) / globalGoldRial) * 100;
    if (
      !Number.isFinite(globalGoldRial) ||
      globalGoldRial <= 0 ||
      !Number.isFinite(bubblePercentage)
    ) {
      throw new Error("TGJU returned an invalid price comparison.");
    }

    return Response.json(
      {
        ouncePrice,
        dollarPrice: dollarRial / rialToToman,
        eighteenKPrice: localGoldRial / rialToToman,
        globalEighteenKPrice: globalGoldRial / rialToToman,
        bubblePercentage,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not retrieve TGJU market prices.", error);
    return Response.json(
      { error: "قیمت‌های بازار از منبع TGJU فعلاً در دسترس نیستند." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

async function fetchTgjuPrice(url: string): Promise<number> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "text/html",
      "User-Agent": "Mozilla/5.0 (compatible; GoldStore/1.0)",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`TGJU price request failed with status ${response.status}.`);
  }

  const html = await response.text();
  const price = extractTgjuPrice(html);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Could not parse a valid price from the TGJU page.");
  }
  return price;
}

function extractTgjuPrice(html: string): number {
  const markers = [
    /data-col=["']info\.last_trade\.PDrCotVal["']/i,
    /id=["']l-price["']/i,
    /class=["'][^"']*\binfo-value\b[^"']*["']/i,
  ];

  for (const marker of markers) {
    const match = marker.exec(html);
    if (!match || match.index === undefined) continue;
    const segment = html.slice(match.index, match.index + 1200);
    const text = segment
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ");
    const digits = text.match(/[0-9۰-۹٠-٩][0-9۰-۹٠-٩,٬.]*/)?.[0];
    if (!digits) continue;
    const normalized = digits
      .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
      .replace(/[,.٬]/g, "");
    const value = Number(normalized);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return NaN;
}

async function fetchOuncePrice(): Promise<number> {
  const response = await fetch("https://api.gold-api.com/price/XAU", {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error("The global gold-price source returned an invalid response.");
  }
  const payload: unknown = await response.json();
  const price =
    payload && typeof payload === "object" && "price" in payload
      ? Number(payload.price)
      : NaN;
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("The global gold price was invalid.");
  }
  return price;
}
