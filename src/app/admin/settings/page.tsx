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
    sql: `SELECT instagram_url, telegram_url, whatsapp_url, phone_numbers,
                 address_text, location_url
          FROM tenants WHERE id = ?`,
    args: [tenantId],
  });
  const row = result.rows[0];
  if (!row) {
    throw new Error("فروشگاه مرتبط با حساب کاربری پیدا نشد.");
  }

  const settings: StoreSettings = {
    instagramUrl: row.instagram_url === null ? "" : String(row.instagram_url),
    telegramUrl: row.telegram_url === null ? "" : String(row.telegram_url),
    whatsappUrl: row.whatsapp_url === null ? "" : String(row.whatsapp_url),
    phoneNumbers: parsePhoneNumbers(row.phone_numbers).join("\n"),
    addressText: row.address_text === null ? "" : String(row.address_text),
    locationUrl: row.location_url === null ? "" : String(row.location_url),
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold sm:text-3xl">تنظیمات فروشگاه</h1>
      <p className="mt-2 text-sm text-[#969387]">
        راه‌های ارتباطی فروشگاه را ویرایش کنید.
      </p>
      <StoreSettingsForm settings={settings} />
    </div>
  );
}

function parsePhoneNumbers(value: unknown): string[] {
  const parsed: unknown = JSON.parse(typeof value === "string" ? value : "[]");
  if (!Array.isArray(parsed) || !parsed.every((phone) => typeof phone === "string")) {
    throw new Error("شماره‌های تماس ذخیره‌شده معتبر نیستند.");
  }
  return parsed;
}
