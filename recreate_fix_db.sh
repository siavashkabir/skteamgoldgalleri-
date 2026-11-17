#!/bin/bash
set -e

echo "🚀 1. در حال ساخت مجدد API برای اصلاح دیتابیس..."
mkdir -p src/app/api/fix-db
cat << 'INNER_EOF' > src/app/api/fix-db/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const queries = [
    "ALTER TABLE tenants ADD COLUMN show_header_widget INTEGER DEFAULT 1;",
    "ALTER TABLE tenants ADD COLUMN show_chart INTEGER DEFAULT 1;",
    "ALTER TABLE tenants ADD COLUMN chart_type TEXT DEFAULT 'line';",
    "ALTER TABLE tenants ADD COLUMN chart_color TEXT DEFAULT '#d4af37';"
  ];

  let results = [];

  for (const q of queries) {
    try {
      await db.execute(q);
      results.push(`✅ اجرا شد: ${q}`);
    } catch (e: any) {
      if (e.message.includes("duplicate column name")) {
        results.push(`⚠️ ستون از قبل وجود دارد: ${q}`);
      } else {
        results.push(`❌ خطا: ${q} - ${e.message}`);
      }
    }
  }

  return NextResponse.json({ message: "عملیات پایان یافت", details: results });
}
INNER_EOF
echo "✅ فایل ساخته شد."

echo "📦 2. در حال کامیت و پوش به گیت‌هاب..."
git add src/app/api/fix-db/route.ts
git commit -m "feat: add temporary api to alter db columns"
git push origin main

echo "🎉 تغییرات پوش شد! کلودفلر در حال دیپلوی است..."
