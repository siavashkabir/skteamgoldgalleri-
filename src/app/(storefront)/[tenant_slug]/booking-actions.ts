"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getStoreBySlug } from "@/lib/storefront-data";
import { hasTenantModule } from "@/lib/tenant-modules";
import type { AdminActionState } from "@/app/admin/action-state";

export async function createBooking(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const tenantSlug = readText(formData, "tenant_slug");
  const name = readText(formData, "name");
  const phone = readText(formData, "phone");
  const serviceId = readText(formData, "service_id");
  const bookingDate = readText(formData, "booking_date");
  const store = await getStoreBySlug(tenantSlug);
  if (
    !store ||
    (!hasTenantModule(store.enabledModules, "booking") &&
      !hasTenantModule(store.enabledModules, "tourism"))
  ) {
    return { error: "امکان ثبت درخواست در این فروشگاه فعال نیست." };
  }
  if (
    name.length < 2 ||
    name.length > 120 ||
    phone.length < 5 ||
    phone.length > 40 ||
    serviceId.length > 160 ||
    !isValidDate(bookingDate)
  ) {
    return { error: "اطلاعات درخواست معتبر نیست." };
  }
  await db.execute({
    sql: `INSERT INTO bookings
            (id, tenant_id, name, phone, service_id, booking_date, status)
          VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    args: [
      crypto.randomUUID(),
      store.id,
      name,
      phone,
      serviceId || null,
      bookingDate,
    ],
  });
  revalidatePath(`/${store.slug}`);
  return { success: "درخواست شما ثبت شد؛ فروشگاه برای هماهنگی با شما تماس می‌گیرد." };
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    date >= today
  );
}
