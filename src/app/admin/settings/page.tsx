import { Suspense } from "react";
import { getTenantAdminContext } from "@/lib/admin-context";
import { db } from "@/lib/db";
import StoreSettingsForm, { type StoreSettings } from "./settings-form";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const { tenantId } = await getTenantAdminContext();
  const result = await db.execute({
    sql: `SELECT name, domain, description, instagram_url, telegram_url, whatsapp_url
          FROM tenants WHERE id = ?`,
    args: [tenantId],
  });
  const row = result.rows[0];
  if (!row) {
    throw new Error("فروشگاه مرتبط با حساب کاربری پیدا نشد.");
  }

  const settings: StoreSettings = {
    name: String(row.name),
    domain: row.domain === null ? "" : String(row.domain),
    description: row.description === null ? "" : String(row.description),
    instagramUrl: row.instagram_url === null ? "" : String(row.instagram_url),
    telegramUrl: row.telegram_url === null ? "" : String(row.telegram_url),
    whatsappUrl: row.whatsapp_url === null ? "" : String(row.whatsapp_url),
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold sm:text-3xl">تنظیمات فروشگاه</h1>
      <p className="mt-2 text-sm text-[#969387]">
        نام، توضیحات و راه‌های ارتباطی فروشگاه را ویرایش کنید.
      </p>
      <StoreSettingsForm settings={settings} />
    </div>
  );
}
