"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantAdminContext } from "@/lib/admin-context";
import type { AdminActionState } from "../action-state";

export async function saveStoreSettings(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { tenantId } = await getTenantAdminContext();
  const name = readText(formData, "name");
  const description = readText(formData, "description");
  const domain = readText(formData, "domain");
  const instagramUrl = readText(formData, "instagram_url");
  const telegramUrl = readText(formData, "telegram_url");
  const whatsappUrl = readText(formData, "whatsapp_url");

  if (!name || name.length > 120) {
    return { error: "نام فروشگاه را وارد کنید (حداکثر ۱۲۰ نویسه)." };
  }
  if (description.length > 5000) {
    return { error: "توضیحات نباید بیشتر از ۵۰۰۰ نویسه باشد." };
  }
  if (domain.length > 253) {
    return { error: "دامنه نباید بیشتر از ۲۵۳ نویسه باشد." };
  }

  for (const [label, value] of [
    ["اینستاگرام", instagramUrl],
    ["تلگرام", telegramUrl],
    ["واتساپ", whatsappUrl],
  ]) {
    if (value && !isHttpUrl(value)) {
      return { error: `نشانی ${label} باید با http یا https شروع شود.` };
    }
  }

  await db.execute({
    sql: `UPDATE tenants
          SET name = ?, description = ?, domain = ?, instagram_url = ?,
              telegram_url = ?, whatsapp_url = ?
          WHERE id = ?`,
    args: [
      name,
      description || null,
      domain || null,
      instagramUrl || null,
      telegramUrl || null,
      whatsappUrl || null,
      tenantId,
    ],
  });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  return { success: "تنظیمات فروشگاه ذخیره شد." };
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
