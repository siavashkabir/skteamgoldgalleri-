
import { db } from "@/lib/db";

function safeFontUrl(raw: string | null): { href: string; format: string } | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    const href = url
      .toString()
      .replace(/\\/g, "%5C")
      .replace(/"/g, "%22")
      .replace(/'/g, "%27")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/</g, "%3C")
      .replace(/>/g, "%3E");
    const format = url.pathname.toLowerCase().endsWith(".woff")
      ? "woff"
      : "truetype";
    return { href, format };
  } catch {
    return null;
  }
}

export default async function TenantFont({ tenantId }: { tenantId: string }) {
  let fontUrl: string | null = null;
  try {
    const result = await db.execute({
      sql: "SELECT custom_font_url FROM tenants WHERE id = ? LIMIT 1",
      args: [tenantId],
    });
    const value = result.rows[0]?.custom_font_url;
    fontUrl = typeof value === "string" && value ? value : null;
  } catch (error) {
    console.error("Could not load the tenant font", error);
  }

  const font = safeFontUrl(fontUrl);
  if (!font) return null;

  const css = `@font-face{font-family:"TenantCustomFont";src:url("${font.href}") format("${font.format}");font-weight:100 900;font-display:swap;}
html,body,button,input,select,textarea{font-family:"TenantCustomFont",system-ui,sans-serif !important;}`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
