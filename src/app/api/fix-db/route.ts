import { db } from "@/lib/db";
import { NextResponse } from "next/server";
export async function GET() {
  const queries = [
    "ALTER TABLE tenants ADD COLUMN show_header_widget INTEGER DEFAULT 1;",
    "ALTER TABLE tenants ADD COLUMN show_chart INTEGER DEFAULT 1;",
    "ALTER TABLE tenants ADD COLUMN chart_type TEXT DEFAULT 'line';",
    "ALTER TABLE tenants ADD COLUMN chart_color TEXT DEFAULT '#d4af37';",
    "ALTER TABLE tenants ADD COLUMN enabled_currencies TEXT DEFAULT '[\"USD\",\"XAU\",\"18K\",\"BUBBLE\"]';",
    "ALTER TABLE tenants ADD COLUMN category TEXT DEFAULT 'retail';",
    "ALTER TABLE tenants ADD COLUMN owner_password TEXT;",
    `CREATE TABLE IF NOT EXISTS market_cache (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL);`
  ];
  let results = [];
  for (const q of queries) {
    try { await db.execute(q); results.push("OK: " + q.substring(0, 30)); }
    catch (e: any) { results.push(e.message.includes("duplicate") ? "Exists: " + q.substring(0, 30) : "Err: " + e.message); }
  }
  return NextResponse.json({ details: results });
}