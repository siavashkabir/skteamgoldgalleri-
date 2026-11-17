import { createClient } from "@libsql/client/web";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" }); // یا .env.local

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.log("❌ متغیرهای محیطی Turso پیدا نشد.");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function addColumns() {
  const queries = [
    "ALTER TABLE tenants ADD COLUMN show_header_widget INTEGER DEFAULT 1;",
    "ALTER TABLE tenants ADD COLUMN show_chart INTEGER DEFAULT 1;",
    "ALTER TABLE tenants ADD COLUMN chart_type TEXT DEFAULT 'line';",
    "ALTER TABLE tenants ADD COLUMN chart_color TEXT DEFAULT '#d4af37';"
  ];

  for (const q of queries) {
    try {
      await client.execute(q);
      console.log(`✅ اجرا شد: ${q}`);
    } catch (e: any) {
      if (e.message.includes("duplicate column name")) {
        console.log(`⚠️ ستون از قبل وجود دارد: ${q}`);
      } else {
        console.error(`❌ خطا در: ${q}`, e.message);
      }
    }
  }
  console.log("🎉 عملیات پایان یافت.");
}

addColumns();
