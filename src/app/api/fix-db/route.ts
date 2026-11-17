import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const queries = [
    "ALTER TABLE tenants ADD COLUMN show_header_widget INTEGER DEFAULT 1;",
    "ALTER TABLE tenants ADD COLUMN show_chart INTEGER DEFAULT 1;",
    "ALTER TABLE tenants ADD COLUMN chart_type TEXT DEFAULT 'line';",
    "ALTER TABLE tenants ADD COLUMN chart_color TEXT DEFAULT '#d4af37';",
    `CREATE TABLE IF NOT EXISTS market_cache (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );`
  ];

  let results = [];

  for (const q of queries) {
    try {
      await db.execute(q);
      results.push(`✅ اجرا شد: ${q.substring(0, 50)}...`);
    } catch (e: any) {
      if (e.message.includes("duplicate column name")) {
        results.push(`⚠️ از قبل وجود دارد: ${q.substring(0, 50)}...`);
      } else {
        results.push(`❌ خطا: ${q.substring(0, 50)}... - ${e.message}`);
      }
    }
  }

  return NextResponse.json({ message: "عملیات پایان یافت", details: results });
}
